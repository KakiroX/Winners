"""Panorama domain service — orchestrates generation and editing."""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from pathlib import Path

from src.ai.panorama_client import get_panorama_generator
from src.ai.panorama_graph import build_panorama_graph
from src.ai.panorama_prompts import build_edit_prompt
from src.ai.panorama_state import PanoramaGraphState
from src.panorama.exceptions import (
    PanoramaGenerationError,
    RoomNotFoundError,
    WalkthroughNotFoundError,
)
from src.panorama.schemas import (
    EditRoomResponse,
    GenerateWalkthroughRequest,
    GenerateWalkthroughResponse,
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
    async def generate_walkthrough(
        request: GenerateWalkthroughRequest,
    ) -> GenerateWalkthroughResponse:
        """Generate 360 panoramas for all rooms in a floor plan and link them."""
        generation_id = uuid.uuid4().hex[:12]

        graph = build_panorama_graph()
        initial_state = PanoramaGraphState(
            generation_id=generation_id,
            floor_plan_id=request.floor_plan_id,
            rooms=request.rooms,
            aesthetic_tags=request.aesthetic_tags,
            style_notes=request.style_notes,
            variant_label=request.variant_label,
        )

        final_state = await graph.ainvoke(initial_state)

        room_panoramas = final_state.get("room_panoramas", [])
        if not room_panoramas:
            raise PanoramaGenerationError("No panoramas were generated successfully.")

        pannellum_config = final_state.get("pannellum_config", {})

        # Persist walkthrough metadata
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

        return GenerateWalkthroughResponse(walkthrough=walkthrough)

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
            raise WalkthroughNotFoundError(
                f"Walkthrough {walkthrough_id} not found"
            )

        image_path = _storage.get_room_image_path(walkthrough_id, room_id)
        if image_path is None or not image_path.exists():
            raise RoomNotFoundError(
                f"Room {room_id} not found in walkthrough {walkthrough_id}"
            )

        # Build edit prompt
        edit_prompt_text = build_edit_prompt(
            modification=prompt,
            pitch=pitch,
            yaw=yaw,
        )

        # Run Gemini edit in thread pool
        from PIL import Image

        generator = get_panorama_generator()
        panorama = Image.open(image_path)

        result = await asyncio.to_thread(
            generator.edit,
            panorama,
            prompt,
            edit_prompt_text,
            pitch,
            yaw,
        )

        # Save as temp then version it
        temp_path = image_path.parent / f"temp_edit_{uuid.uuid4().hex[:6]}.jpg"
        result.save(str(temp_path))

        try:
            hotspot = EditHotspotData(
                id=uuid.uuid4().hex[:8],
                pitch=pitch,
                yaw=yaw,
                text=prompt[:50],
                properties={"prompt": prompt},
            )

            # Merge with existing hotspots from current version
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

            # Update panorama URL in Pannellum config
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

            return EditRoomResponse(
                version=version,
                updated_panorama_url=new_url,
            )
        finally:
            if temp_path.exists():
                temp_path.unlink()

    @staticmethod
    async def get_walkthrough(walkthrough_id: str) -> WalkthroughSchema | None:
        """Load a walkthrough by ID."""
        data = _storage.get_walkthrough(walkthrough_id)
        if data is None:
            return None

        from src.panorama.schemas import RoomPanorama

        rooms = []
        for r in data.rooms:
            # Determine current panorama URL
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


def _update_pannellum_scene(walkthrough_id: str, room_id: str, new_url: str) -> None:
    """Update the panorama URL for a room in the stored Pannellum config."""
    walkthrough = _storage.get_walkthrough(walkthrough_id)
    if walkthrough is None:
        return

    scenes = walkthrough.pannellum_config.get("scenes", {})
    if isinstance(scenes, dict) and room_id in scenes:
        scene = scenes[room_id]
        if isinstance(scene, dict):
            scene["panorama"] = new_url
            _storage.save_walkthrough(walkthrough)
