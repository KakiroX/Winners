"""LangGraph node functions for the panorama generation pipeline."""

from __future__ import annotations

import asyncio
import logging
import math
import uuid
from pathlib import Path

from src.ai.panorama_client import get_panorama_generator
from src.ai.panorama_prompts import build_room_prompt
from src.ai.panorama_state import PanoramaGraphState
from src.panorama.constants import STORAGE_BASE_DIR
from src.panorama.schemas import NavigationHotspot, RoomPanorama

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Node 1: Build per-room prompts
# ---------------------------------------------------------------------------


async def prepare_room_prompts(state: PanoramaGraphState) -> dict[str, object]:
    """Build a generation prompt for each room using its metadata + style DNA."""
    prompts: dict[str, str] = {}

    for room in state["rooms"]:
        prompt = build_room_prompt(
            room_label=room.label,
            room_type=room.type,
            area_sqm=room.area_sqm,
            features=room.features,
            natural_light=room.natural_light,
            aesthetic_tags=state["aesthetic_tags"],
            style_notes=state["style_notes"],
        )
        prompts[room.id] = prompt

    logger.info(
        "Prepared %d room prompts",
        len(prompts),
        extra={"generation_id": state["generation_id"]},
    )
    return {"room_prompts": prompts}


# ---------------------------------------------------------------------------
# Node 2: Generate panoramas (sequentially to respect rate limits)
# ---------------------------------------------------------------------------


async def generate_room_panoramas(state: PanoramaGraphState) -> dict[str, object]:
    """Generate equirectangular panoramas for all rooms."""
    generator = get_panorama_generator()
    prompts = state.get("room_prompts", {})
    generated: dict[str, str] = {}
    errors: dict[str, str] = {}

    # Create the design storage directory for this generation
    design_dir = STORAGE_BASE_DIR / state["generation_id"] / "rooms"
    design_dir.mkdir(parents=True, exist_ok=True)

    for room_id, prompt in prompts.items():
        try:
            # Run synchronous Gemini call in thread pool
            result = await asyncio.to_thread(generator.generate, prompt)

            # Save the image
            image_path = design_dir / f"{room_id}.jpg"
            result.save(str(image_path))
            generated[room_id] = str(image_path)

            logger.info(
                "Generated panorama for room %s",
                room_id,
                extra={"generation_id": state["generation_id"]},
            )
        except Exception as e:
            logger.error(
                "Failed to generate panorama for room %s: %s",
                room_id,
                str(e),
                extra={"generation_id": state["generation_id"]},
            )
            errors[room_id] = str(e)

    return {"generated_images": generated, "generation_errors": errors}


# ---------------------------------------------------------------------------
# Node 3: Link rooms and build walkthrough
# ---------------------------------------------------------------------------


def _compute_yaw_between_rooms(
    from_pos: dict[str, int],
    from_w: int,
    from_h: int,
    to_pos: dict[str, int],
    to_w: int,
    to_h: int,
) -> float:
    """Compute the yaw angle from room A center pointing toward room B center.

    Returns yaw in degrees [-180, 180] where:
      0   = looking forward (positive Y direction)
      90  = looking right (positive X direction)
      -90 = looking left (negative X direction)
    """
    # Centers in grid units
    ax = from_pos["x"] + from_w / 2
    ay = from_pos["y"] + from_h / 2
    bx = to_pos["x"] + to_w / 2
    by = to_pos["y"] + to_h / 2

    dx = bx - ax
    dy = by - ay

    # atan2 gives angle from positive X axis; we want from positive Y
    angle_rad = math.atan2(dx, -dy)
    return math.degrees(angle_rad)


async def link_rooms_and_build(state: PanoramaGraphState) -> dict[str, object]:
    """Create navigation hotspots between connected rooms and build Pannellum config."""
    generated = state.get("generated_images", {})
    rooms_by_id = {r.id: r for r in state["rooms"]}
    generation_id = state["generation_id"]

    # Build room panorama objects with navigation hotspots
    room_panoramas: list[RoomPanorama] = []
    scenes: dict[str, object] = {}

    for room in state["rooms"]:
        if room.id not in generated:
            continue

        # Calculate navigation hotspots to connected rooms
        nav_hotspots: list[NavigationHotspot] = []
        for connected_id in room.connections:
            if connected_id not in generated or connected_id not in rooms_by_id:
                continue

            target = rooms_by_id[connected_id]
            yaw = _compute_yaw_between_rooms(
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

        # Build panorama URL (relative to static file mount)
        panorama_url = f"/panoramas/{generation_id}/rooms/{room.id}.jpg"

        room_panorama = RoomPanorama(
            room_id=room.id,
            room_label=room.label,
            room_type=room.type,
            panorama_url=panorama_url,
            navigation_hotspots=nav_hotspots,
            default_yaw=0.0,
            default_pitch=0.0,
        )
        room_panoramas.append(room_panorama)

        # Build Pannellum scene config
        pannellum_hotspots = [
            {
                "id": hs.id,
                "pitch": hs.pitch,
                "yaw": hs.yaw,
                "type": "scene",
                "text": hs.label,
                "sceneId": hs.target_room_id,
            }
            for hs in nav_hotspots
        ]

        scenes[room.id] = {
            "title": room.label,
            "type": "equirectangular",
            "panorama": panorama_url,
            "hfov": 110,
            "yaw": 0,
            "pitch": 0,
            "hotSpots": pannellum_hotspots,
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

    logger.info(
        "Built walkthrough with %d rooms, %d scenes",
        len(room_panoramas),
        len(scenes),
        extra={"generation_id": generation_id},
    )

    return {
        "room_panoramas": room_panoramas,
        "pannellum_config": pannellum_config,
    }


# ---------------------------------------------------------------------------
# Node 4: Error handler
# ---------------------------------------------------------------------------


async def handle_panorama_error(state: PanoramaGraphState) -> dict[str, object]:
    """Raise a domain exception if generation failed critically."""
    from src.panorama.exceptions import PanoramaGenerationError

    errors = state.get("generation_errors", {})
    generated = state.get("generated_images", {})

    if not generated:
        raise PanoramaGenerationError(
            f"Failed to generate any room panoramas. Errors: {errors}"
        )

    # Partial success — log warnings but continue
    if errors:
        logger.warning(
            "Partial panorama generation: %d succeeded, %d failed",
            len(generated),
            len(errors),
            extra={"errors": errors},
        )

    return {}
