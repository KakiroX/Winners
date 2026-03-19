"""Panorama domain service — orchestrates generation and editing."""

from __future__ import annotations

import asyncio
import json
import logging
import math
import time
import uuid
from collections.abc import AsyncGenerator
from pathlib import Path

from src.ai.panorama_client import get_panorama_generator
from src.ai.panorama_prompts import build_edit_prompt, build_room_prompt
from src.panorama.constants import STORAGE_BASE_DIR
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
from src.panorama.storage import (
    EditHotspotData,
    PanoramaStorage,
    RoomDesignData,
    WalkthroughData,
)

logger = logging.getLogger(__name__)

_storage = PanoramaStorage()


class PanoramaService:
    """Stateless service for panorama generation and editing."""

    @staticmethod
    async def generate_walkthrough_stream(
        request: GenerateWalkthroughRequest,
    ) -> AsyncGenerator[str, None]:
        """Generate panoramas room-by-room, yielding SSE progress events."""
        generation_id = uuid.uuid4().hex[:12]
        total_rooms = len(request.rooms)
        generated: dict[str, str] = {}  # room_id -> image path
        errors: dict[str, str] = {}

        # Create storage directory
        design_dir = STORAGE_BASE_DIR / generation_id / "rooms"
        design_dir.mkdir(parents=True, exist_ok=True)

        generator = get_panorama_generator()

        # --- Phase 1: Generate each room panorama ---
        for i, room in enumerate(request.rooms):
            # Emit progress event
            yield _sse_event("progress", {
                "phase": "generating",
                "current": i,
                "total": total_rooms,
                "room_label": room.label,
            })

            try:
                prompt = build_room_prompt(
                    room_label=room.label,
                    room_type=room.type,
                    area_sqm=room.area_sqm,
                    features=room.features,
                    natural_light=room.natural_light,
                    aesthetic_tags=request.aesthetic_tags,
                    style_notes=request.style_notes,
                )

                result = await asyncio.to_thread(generator.generate, prompt)
                image_path = design_dir / f"{room.id}.jpg"
                result.save(str(image_path))
                generated[room.id] = str(image_path)

                yield _sse_event("room_done", {
                    "current": i + 1,
                    "total": total_rooms,
                    "room_label": room.label,
                    "room_id": room.id,
                })

            except Exception as e:
                logger.error("Failed to generate room %s: %s", room.id, str(e))
                errors[room.id] = str(e)
                yield _sse_event("room_error", {
                    "current": i + 1,
                    "total": total_rooms,
                    "room_label": room.label,
                    "error": str(e),
                })

        if not generated:
            yield _sse_event("error", {"message": "Failed to generate any panoramas"})
            return

        # --- Phase 2: Link rooms ---
        yield _sse_event("progress", {
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
            for connected_id in room.connections:
                if connected_id not in generated or connected_id not in rooms_by_id:
                    continue
                target = rooms_by_id[connected_id]
                yaw = _compute_yaw(
                    room.position, room.width_units, room.height_units,
                    target.position, target.width_units, target.height_units,
                )
                nav_hotspots.append(NavigationHotspot(
                    id=uuid.uuid4().hex[:8],
                    target_room_id=connected_id,
                    pitch=0.0,
                    yaw=yaw,
                    label=f"Go to {target.label}",
                ))

            panorama_url = f"/panoramas/{generation_id}/rooms/{room.id}.jpg"
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
                "hfov": 110,
                "yaw": 0,
                "pitch": 0,
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
                "autoLoad": True,
                "autoRotate": -2,
                "compass": True,
                "showZoomCtrl": True,
                "showFullscreenCtrl": True,
                "mouseZoom": True,
                "draggable": True,
            },
            "scenes": scenes,
        }

        # --- Phase 3: Save ---
        walkthrough_data = WalkthroughData(
            id=generation_id,
            floor_plan_id=request.floor_plan_id,
            title=request.variant_label,
            created_at=time.time(),
            rooms=[
                RoomDesignData(room_id=rp.room_id, room_label=rp.room_label)
                for rp in room_panoramas
            ],
            pannellum_config=pannellum_config,
        )
        _storage.save_walkthrough(walkthrough_data)

        walkthrough = WalkthroughSchema(
            id=generation_id,
            floor_plan_id=request.floor_plan_id,
            generation_id=generation_id,
            title=request.variant_label,
            rooms=room_panoramas,
            pannellum_config=pannellum_config,
        )

        response = GenerateWalkthroughResponse(walkthrough=walkthrough)
        yield _sse_event("complete", response.model_dump())

    @staticmethod
    async def generate_walkthrough(
        request: GenerateWalkthroughRequest,
    ) -> GenerateWalkthroughResponse:
        """Non-streaming fallback — collects the full result."""
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
        walkthrough = _storage.get_walkthrough(walkthrough_id)
        if walkthrough is None:
            raise WalkthroughNotFoundError(f"Walkthrough {walkthrough_id} not found")

        image_path = _storage.get_room_image_path(walkthrough_id, room_id)
        if image_path is None or not image_path.exists():
            raise RoomNotFoundError(f"Room {room_id} not found in walkthrough {walkthrough_id}")

        edit_prompt_text = build_edit_prompt(modification=prompt, pitch=pitch, yaw=yaw)

        from PIL import Image

        generator = get_panorama_generator()
        panorama = Image.open(image_path)

        result = await asyncio.to_thread(
            generator.edit, panorama, prompt, edit_prompt_text, pitch, yaw,
        )

        temp_path = image_path.parent / f"temp_edit_{uuid.uuid4().hex[:6]}.jpg"
        result.save(str(temp_path))

        try:
            hotspot = EditHotspotData(
                id=uuid.uuid4().hex[:8],
                pitch=pitch, yaw=yaw,
                text=prompt[:50],
                properties={"prompt": prompt},
            )

            existing_hotspots: list[EditHotspotData] = []
            for r in walkthrough.rooms:
                if r.room_id == room_id and r.current_version_id:
                    for v in r.versions:
                        if v.id == r.current_version_id:
                            existing_hotspots = list(v.hotspots)
                            break
                    break

            all_hotspots = existing_hotspots + [hotspot]

            version_data = _storage.save_room_version(
                walkthrough_id=walkthrough_id,
                room_id=room_id,
                image_path=temp_path,
                prompt_used=prompt,
                hotspots=all_hotspots,
            )

            new_url = f"/panoramas/{version_data.image_path}"
            _update_pannellum_scene(walkthrough_id, room_id, new_url)

            version = VersionSchema(
                id=version_data.id,
                room_id=room_id,
                image_path=version_data.image_path,
                created_at=version_data.created_at,
                prompt_used=prompt,
                edit_hotspots=[
                    {"id": h.id, "pitch": h.pitch, "yaw": h.yaw, "text": h.text, "properties": h.properties}
                    for h in all_hotspots
                ],
            )

            return EditRoomResponse(version=version, updated_panorama_url=new_url)
        finally:
            if temp_path.exists():
                temp_path.unlink()

    @staticmethod
    async def get_walkthrough(walkthrough_id: str) -> WalkthroughSchema | None:
        """Load a walkthrough by ID."""
        data = _storage.get_walkthrough(walkthrough_id)
        if data is None:
            return None

        rooms = []
        for r in data.rooms:
            if r.current_version_id:
                for v in r.versions:
                    if v.id == r.current_version_id:
                        panorama_url = f"/panoramas/{v.image_path}"
                        break
                else:
                    panorama_url = f"/panoramas/{data.id}/rooms/{r.room_id}.jpg"
            else:
                panorama_url = f"/panoramas/{data.id}/rooms/{r.room_id}.jpg"

            rooms.append(RoomPanorama(
                room_id=r.room_id,
                room_label=r.room_label,
                room_type="",
                panorama_url=panorama_url,
            ))

        return WalkthroughSchema(
            id=data.id,
            floor_plan_id=data.floor_plan_id,
            generation_id=data.id,
            title=data.title,
            rooms=rooms,
            pannellum_config=data.pannellum_config,
        )


def _sse_event(event: str, data: object) -> str:
    """Format a Server-Sent Event string."""
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


def _update_pannellum_scene(walkthrough_id: str, room_id: str, new_url: str) -> None:
    walkthrough = _storage.get_walkthrough(walkthrough_id)
    if walkthrough is None:
        return
    scenes = walkthrough.pannellum_config.get("scenes", {})
    if isinstance(scenes, dict) and room_id in scenes:
        scene = scenes[room_id]
        if isinstance(scene, dict):
            scene["panorama"] = new_url
            _storage.save_walkthrough(walkthrough)
