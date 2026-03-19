"""Panorama domain service — orchestrates generation and editing."""

from __future__ import annotations

import asyncio
import json
import logging
import math
import uuid
from collections.abc import AsyncGenerator

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from PIL import Image

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

_bom_agent = None
# Global in-memory log store: version_id -> list of log strings
_bom_logs: dict[str, list[str]] = {}

def get_bom_agent():
    global _bom_agent
    if _bom_agent is None:
        from src.bom import BOMAgent
        gen = get_panorama_generator()
        _bom_agent = BOMAgent(client=gen._client)
    return _bom_agent


async def background_bom_sourcing(version_id: str, image: Image.Image):
    """Background task to source furniture in parallel with live logging."""
    global _bom_logs
    _bom_logs[version_id] = ["Agent initialized.", "Scanning room panorama for furniture..."]
    
    try:
        agent = get_bom_agent()
        
        # Step 1: Detection
        _bom_logs[version_id].append("Analyzing visual features and identifying distinct items...")
        
        # We wrap the agent call to capture its internal logging if needed, 
        # but for now we'll simulate the phase transitions.
        bom_data = await agent.process_room(image)
        
        # Step 2: Sourcing
        _bom_logs[version_id].append(f"Found {len(bom_data)} items. Sourcing real products via Google Search Grounding...")
        
        if len(bom_data) > 0:
            _bom_logs[version_id].append("Verifying prices and retail availability...")
        
        async with async_session_factory() as session:
            storage = PanoramaStorage(session)
            await storage.update_room_version_bom(version_id, bom_data)
        
        _bom_logs[version_id].append("BOM updated successfully. Task complete.")
    except Exception as e:
        error_msg = f"Sourcing Error: {str(e)}"
        logger.error("Background BOM sourcing failed: %s", e)
        if version_id in _bom_logs:
            _bom_logs[version_id].append(error_msg)


class PanoramaService:
    """Stateless service for panorama generation and editing."""

    @staticmethod
    async def generate_walkthrough_stream(
        request: GenerateWalkthroughRequest,
        background_tasks: BackgroundTasks | None = None,
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

            # --- Phase 0: Create Walkthrough and Rooms in DB ---
            await storage.create_walkthrough(
                walkthrough_id=generation_id,
                user_id=request.user_id,
                floor_plan_id=request.floor_plan_id,
                floor_plan_data=request.floor_plan_metadata,
                title=request.variant_label,
                pannellum_config={"scenes": {}},  # Placeholder
                rooms=[
                    {"room_id": r.id, "room_label": r.label}
                    for r in request.rooms
                ],
            )

            # --- Phase 1: Generate all room panoramas in parallel ---
            yield _sse("progress", {
                "phase": "generating",
                "current": 0,
                "total": total_rooms,
                "room_label": "Generating all rooms simultaneously...",
            })

            async def generate_room_task(room_input):
                try:
                    # Build connection metadata
                    connections: list[dict[str, object]] = []
                    for cid in room_input.connections:
                        target = rooms_by_id.get(cid)
                        if target is None:
                            continue
                        yaw = _compute_yaw(
                            room_input.position, room_input.width_units, room_input.height_units,
                            target.position, target.width_units, target.height_units,
                        )
                        connections.append({
                            "target_label": target.label,
                            "target_type": target.type,
                            "yaw": yaw,
                        })

                    prompt = build_room_prompt(
                        room_label=room_input.label,
                        room_type=room_input.type,
                        area_sqm=room_input.area_sqm,
                        features=room_input.features,
                        natural_light=room_input.natural_light,
                        aesthetic_tags=request.aesthetic_tags,
                        style_notes=request.style_notes,
                        connections=connections,
                        user_style_prompt=request.user_style_prompt,
                        width_units=room_input.width_units,
                        height_units=room_input.height_units,
                    )

                    result = await asyncio.to_thread(generator.generate, prompt)

                    # --- IMPORTANT: Use a FRESH session for each parallel task ---
                    async with async_session_factory() as task_session:
                        task_storage = PanoramaStorage(task_session)
                        version = await task_storage.save_room_version(
                            walkthrough_id=generation_id,
                            room_id=room_input.id,
                            image=result.image,
                            prompt_used="Initial Generation",
                            hotspots=[],
                        )
                        
                        # Trigger background BOM sourcing
                        if background_tasks:
                            background_tasks.add_task(background_bom_sourcing, version.id, result.image)
                            
                        return room_input.id, version.image_url, None
                except Exception as e:
                    logger.error("Failed to generate room %s: %s", room_input.id, str(e))
                    return room_input.id, None, str(e)

            # Execute all room generations in parallel
            tasks = [generate_room_task(r) for r in request.rooms]
            task_results = await asyncio.gather(*tasks)

            for rid, url, err in task_results:
                if url:
                    generated[rid] = url
                if err:
                    errors[rid] = err

            if not generated:
                yield _sse("error", {"message": "Failed to generate any panoramas"})
                return

            if not generated:
                yield _sse("error", {"message": "Failed to generate any panoramas"})
                return

            # --- Phase 2: Link rooms and update config ---
            yield _sse("progress", {
                "phase": "linking",
                "current": total_rooms,
                "total": total_rooms,
                "room_label": "Linking rooms...",
            })

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

            # Update walkthrough config in DB
            await storage.update_pannellum_config(generation_id, pannellum_config)

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
        background_tasks: BackgroundTasks | None = None,
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

            # Trigger background BOM sourcing
            if background_tasks:
                background_tasks.add_task(background_bom_sourcing, version.id, result.image)

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
    async def list_walkthroughs(user_id: str) -> list[dict]:
        """List all designs for a specific user with their BOMs."""
        async with async_session_factory() as session:
            storage = PanoramaStorage(session)
            walkthroughs = await storage.list_walkthroughs(user_id)
            
            from src.bom import BOMManager
            return [
                {
                    "id": wt.id,
                    "title": wt.title,
                    "created_at": wt.created_at.isoformat(),
                    "room_count": len(wt.rooms),
                    "floor_plan_metadata": wt.floor_plan_data,
                    "bom": BOMManager.aggregate_walkthrough_bom(wt)
                } for wt in walkthroughs
            ]

    @staticmethod
    async def get_all_designs_bom(user_id: str) -> list[dict]:
        """Aggregate BOM from every design owned by a user."""
        async with async_session_factory() as session:
            storage = PanoramaStorage(session)
            walkthroughs = await storage.list_walkthroughs(user_id)
            
            from src.bom import BOMManager
            return BOMManager.aggregate_multi_walkthrough_bom(walkthroughs)

    @staticmethod
    async def get_walkthrough_bom(walkthrough_id: str) -> dict:
        """Get the aggregated Bill of Materials and current logs for a walkthrough."""
        async with async_session_factory() as session:
            storage = PanoramaStorage(session)
            wt = await storage.get_walkthrough(walkthrough_id)
            if wt is None:
                raise WalkthroughNotFoundError(f"Walkthrough {walkthrough_id} not found")

            from src.bom import BOMManager
            items = BOMManager.aggregate_walkthrough_bom(wt)
            
            # Collect logs for rooms that are currently being processed
            logs = {}
            for room in wt.rooms:
                if room.current_version_id in _bom_logs:
                    logs[room.room_label] = _bom_logs[room.current_version_id]
                    
            return {
                "items": items,
                "logs": logs
            }

    @staticmethod
    async def get_room_versions(walkthrough_id: str, room_id: str) -> list[dict]:
        """Get all available versions for a room."""
        async with async_session_factory() as session:
            # Fetch the room versions
            from src.panorama.models import RoomModel
            from sqlalchemy import select
            result = await session.execute(
                select(RoomModel).where(
                    RoomModel.walkthrough_id == walkthrough_id,
                    RoomModel.room_id == room_id
                )
            )
            room = result.scalar_one_or_none()
            if not room:
                return []
                
            # Return sorted versions (newest first)
            return sorted([
                {
                    "id": v.id,
                    "image_url": v.image_url,
                    "prompt_used": v.prompt_used,
                    "created_at": v.created_at.isoformat()
                } for v in room.versions
            ], key=lambda x: x["created_at"], reverse=True)

    @staticmethod
    async def revert_room_version(
        walkthrough_id: str,
        room_id: str,
        version_id: str,
    ) -> dict:
        """Revert a room to a previous version."""
        async with async_session_factory() as session:
            storage = PanoramaStorage(session)
            
            wt = await storage.get_walkthrough(walkthrough_id)
            if wt is None:
                raise WalkthroughNotFoundError(f"Walkthrough {walkthrough_id} not found")

            # Update DB and get new current URL
            new_image_url = await storage.revert_room_version(walkthrough_id, room_id, version_id)

            # Update walkthrough config
            config = dict(wt.pannellum_config)
            scenes = config.get("scenes", {})
            if isinstance(scenes, dict) and room_id in scenes:
                scene = scenes[room_id]
                if isinstance(scene, dict):
                    scene["panorama"] = new_image_url
                    await storage.update_pannellum_config(walkthrough_id, config)

            return {"status": "success", "new_panorama_url": new_image_url}

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

    @staticmethod
    async def delete_walkthrough(walkthrough_id: str) -> bool:
        """Delete a walkthrough."""
        async with async_session_factory() as session:
            storage = PanoramaStorage(session)
            return await storage.delete_walkthrough(walkthrough_id)

    @staticmethod
    async def rename_walkthrough(walkthrough_id: str, title: str) -> bool:
        """Rename a walkthrough."""
        async with async_session_factory() as session:
            storage = PanoramaStorage(session)
            return await storage.update_walkthrough_title(walkthrough_id, title)




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
