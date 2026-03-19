"""Panorama domain service — orchestrates generation and editing."""

from __future__ import annotations

import asyncio
import json
import logging
import math
import uuid
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.panorama_client import get_panorama_generator
from src.ai.panorama_prompts import build_edit_prompt, build_room_prompt
from src.database import async_session_factory
from src.panorama.exceptions import (
    PanoramaGenerationError,
    RoomNotFoundError,
    WalkthroughNotFoundError,
)
from src.panorama.schemas import (
    EditRoomResponse,
    GenerateWalkthroughRequest,
    GenerateWalkthroughResponse,
    NavigationHotspot,
    RoomPanorama,
    VersionSchema,
    WalkthroughSchema,
)
from src.panorama.storage import PanoramaStorage

logger = logging.getLogger(__name__)


class PanoramaService:
    """Stateless service for panorama generation and editing."""

    @staticmethod
    async def generate_walkthrough_stream(
        request: GenerateWalkthroughRequest,
    ) -> AsyncGenerator[str, None]:
        """Generate panoramas room-by-room, yielding SSE progress events."""
        generation_id = uuid.uuid4().hex[:12]
        total_rooms = len(request.rooms)
        generated: dict[str, str] = {}  # room_id -> GCS URL
        errors: dict[str, str] = {}

        generator = get_panorama_generator()
        rooms_by_id = {r.id: r for r in request.rooms}

        async with async_session_factory() as session:
            storage = PanoramaStorage(session)

            # --- Phase 1: Generate each room panorama ---
            for i, room in enumerate(request.rooms):
                yield _sse("progress", {
                    "phase": "generating",
                    "current": i,
                    "total": total_rooms,
                    "room_label": room.label,
                })

                try:
                    # Build connection metadata with yaw angles for door placement
                    connections: list[dict[str, object]] = []
                    for cid in room.connections:
                        target = rooms_by_id.get(cid)
                        if target is None:
                            continue
                        yaw = _compute_yaw(
                            room.position, room.width_units, room.height_units,
                            target.position, target.width_units, target.height_units,
                        )
                        connections.append({
                            "target_label": target.label,
                            "target_type": target.type,
                            "yaw": yaw,
                        })

                    prompt = build_room_prompt(
                        room_label=room.label,
                        room_type=room.type,
                        area_sqm=room.area_sqm,
                        features=room.features,
                        natural_light=room.natural_light,
                        aesthetic_tags=request.aesthetic_tags,
                        style_notes=request.style_notes,
                        connections=connections,
                        user_style_prompt=request.user_style_prompt,
                    )

                    result = await asyncio.to_thread(generator.generate, prompt)

                    # Upload to GCS
                    url = await asyncio.to_thread(
                        storage.upload_room_panorama, generation_id, room.id, result.image,
                    )
                    generated[room.id] = url

                    yield _sse("room_done", {
                        "current": i + 1,
                        "total": total_rooms,
                        "room_label": room.label,
                        "room_id": room.id,
                    })

                except Exception as e:
                    logger.error("Failed to generate room %s: %s", room.id, str(e))
                    errors[room.id] = str(e)
                    yield _sse("room_error", {
                        "current": i + 1,
                        "total": total_rooms,
                        "room_label": room.label,
                        "error": str(e),
                    })

            if not generated:
                yield _sse("error", {"message": "Failed to generate any panoramas"})
                return

            # --- Phase 2: Link rooms ---
            yield _sse("progress", {
                "phase": "linking",
                "current": total_rooms,
                "total": total_rooms,
                "room_label": "Linking rooms...",
            })

            rooms_by_id = {r.id: r for r in request.rooms}
            room_panoramas: list[RoomPanorama] = []
            scenes: dict[str, object] = {}

            for room in request.rooms:
                if room.id not in generated:
                    continue

                nav_hotspots: list[NavigationHotspot] = []
                for cid in room.connections:
                    if cid not in generated or cid not in rooms_by_id:
                        continue
                    target = rooms_by_id[cid]
                    yaw = _compute_yaw(
                        room.position, room.width_units, room.height_units,
                        target.position, target.width_units, target.height_units,
                    )
                    nav_hotspots.append(NavigationHotspot(
                        id=uuid.uuid4().hex[:8],
                        target_room_id=cid,
                        pitch=0.0, yaw=yaw,
                        label=f"Go to {target.label}",
                    ))

                panorama_url = generated[room.id]
                rp = RoomPanorama(
                    room_id=room.id,
                    room_label=room.label,
                    room_type=room.type,
                    panorama_url=panorama_url,
                    navigation_hotspots=nav_hotspots,
                )
                room_panoramas.append(rp)

                scenes[room.id] = {
                    "title": room.label,
                    "type": "equirectangular",
                    "panorama": panorama_url,
                    "hfov": 110, "yaw": 0, "pitch": 0,
                    "hotSpots": [
                        {"id": hs.id, "pitch": hs.pitch, "yaw": hs.yaw,
                         "type": "scene", "text": hs.label, "sceneId": hs.target_room_id}
                        for hs in nav_hotspots
                    ],
                }

            first_room_id = room_panoramas[0].room_id if room_panoramas else ""
            pannellum_config: dict[str, object] = {
                "default": {
                    "firstScene": first_room_id,
                    "autoLoad": True, "autoRotate": -2, "compass": True,
                    "showZoomCtrl": True, "showFullscreenCtrl": True,
                    "mouseZoom": True, "draggable": True,
                },
                "scenes": scenes,
            }

            # --- Phase 3: Persist to DB ---
            await storage.create_walkthrough(
                walkthrough_id=generation_id,
                floor_plan_id=request.floor_plan_id,
                title=request.variant_label,
                pannellum_config=pannellum_config,
                rooms=[
                    {"room_id": rp.room_id, "room_label": rp.room_label}
                    for rp in room_panoramas
                ],
            )

            walkthrough = WalkthroughSchema(
                id=generation_id,
                floor_plan_id=request.floor_plan_id,
                generation_id=generation_id,
                title=request.variant_label,
                rooms=room_panoramas,
                pannellum_config=pannellum_config,
            )

            response = GenerateWalkthroughResponse(walkthrough=walkthrough)
            yield _sse("complete", response.model_dump())

    @staticmethod
    async def generate_walkthrough(
        request: GenerateWalkthroughRequest,
    ) -> GenerateWalkthroughResponse:
        """Non-streaming fallback."""
        result = None
        async for event_str in PanoramaService.generate_walkthrough_stream(request):
            if event_str.startswith("event: complete"):
                data_line = event_str.split("\ndata: ", 1)[1].split("\n")[0]
                result = GenerateWalkthroughResponse.model_validate_json(data_line)
        if result is None:
            raise PanoramaGenerationError("Generation stream ended without result.")
        return result

    @staticmethod
    async def edit_room(
        walkthrough_id: str,
        room_id: str,
        prompt: str,
        pitch: float,
        yaw: float,
    ) -> EditRoomResponse:
        """Surgically edit a room panorama at a specific location."""
        async with async_session_factory() as session:
            storage = PanoramaStorage(session)

            wt = await storage.get_walkthrough(walkthrough_id)
            if wt is None:
                raise WalkthroughNotFoundError(f"Walkthrough {walkthrough_id} not found")

            image_url = await storage.get_room_current_image_url(walkthrough_id, room_id)
            if image_url is None:
                raise RoomNotFoundError(f"Room {room_id} not found")

            # Download current image from GCS, edit it, upload new version
            import io
            import httpx
            from PIL import Image

            async with httpx.AsyncClient() as http:
                resp = await http.get(image_url)
                resp.raise_for_status()
                panorama = Image.open(io.BytesIO(resp.content))

            edit_prompt_text = build_edit_prompt(modification=prompt, pitch=pitch, yaw=yaw)
            generator = get_panorama_generator()

            result = await asyncio.to_thread(
                generator.edit, panorama, prompt, edit_prompt_text, pitch, yaw,
            )

            # Get existing hotspots and append
            existing = await storage.get_room_current_hotspots(walkthrough_id, room_id)
            new_hotspot = {
                "id": uuid.uuid4().hex[:8],
                "pitch": pitch, "yaw": yaw,
                "text": prompt[:50],
                "properties": {"prompt": prompt},
            }
            all_hotspots = existing + [new_hotspot]

            version = await storage.save_room_version(
                walkthrough_id=walkthrough_id,
                room_id=room_id,
                image=result.image,
                prompt_used=prompt,
                hotspots=all_hotspots,
            )

            # Update pannellum config
            config = dict(wt.pannellum_config)
            scenes = config.get("scenes", {})
            if isinstance(scenes, dict) and room_id in scenes:
                scene = scenes[room_id]
                if isinstance(scene, dict):
                    scene["panorama"] = version.image_url
                    await storage.update_pannellum_config(walkthrough_id, config)

            return EditRoomResponse(
                version=VersionSchema(
                    id=version.id,
                    room_id=room_id,
                    image_path=version.image_url,
                    created_at=version.created_at.timestamp(),
                    prompt_used=prompt,
                    edit_hotspots=all_hotspots,
                ),
                updated_panorama_url=version.image_url,
            )

    @staticmethod
    async def get_walkthrough(walkthrough_id: str) -> WalkthroughSchema | None:
        """Load a walkthrough by ID."""
        async with async_session_factory() as session:
            storage = PanoramaStorage(session)
            wt = await storage.get_walkthrough(walkthrough_id)
            if wt is None:
                return None

            rooms = []
            for r in wt.rooms:
                panorama_url = await storage.get_room_current_image_url(walkthrough_id, r.room_id)
                rooms.append(RoomPanorama(
                    room_id=r.room_id,
                    room_label=r.room_label,
                    room_type="",
                    panorama_url=panorama_url or "",
                ))

            return WalkthroughSchema(
                id=wt.id,
                floor_plan_id=wt.floor_plan_id,
                generation_id=wt.id,
                title=wt.title,
                rooms=rooms,
                pannellum_config=wt.pannellum_config,
            )


def _sse(event: str, data: object) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _compute_yaw(
    from_pos: dict[str, int], from_w: int, from_h: int,
    to_pos: dict[str, int], to_w: int, to_h: int,
) -> float:
    ax = from_pos["x"] + from_w / 2
    ay = from_pos["y"] + from_h / 2
    bx = to_pos["x"] + to_w / 2
    by = to_pos["y"] + to_h / 2
    return math.degrees(math.atan2(bx - ax, -(by - ay)))
