"""Panorama storage — PostgreSQL for metadata, GCS for images."""

from __future__ import annotations

import logging
import time
import uuid

from PIL import Image
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.panorama.gcs import get_gcs_client
from src.panorama.models import RoomModel, RoomVersionModel, WalkthroughModel

logger = logging.getLogger(__name__)


class PanoramaStorage:
    """Async storage layer backed by PostgreSQL + Google Cloud Storage."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.gcs = get_gcs_client()

    # ------------------------------------------------------------------
    # Walkthrough
    # ------------------------------------------------------------------

    async def create_walkthrough(
        self,
        walkthrough_id: str,
        floor_plan_id: str,
        title: str,
        pannellum_config: dict,
        rooms: list[dict],
    ) -> WalkthroughModel:
        """Create a walkthrough with its rooms in the database."""
        wt = WalkthroughModel(
            id=walkthrough_id,
            floor_plan_id=floor_plan_id,
            title=title,
            pannellum_config=pannellum_config,
        )
        self.session.add(wt)

        for r in rooms:
            room = RoomModel(
                walkthrough_id=walkthrough_id,
                room_id=r["room_id"],
                room_label=r["room_label"],
            )
            self.session.add(room)

        await self.session.commit()
        await self.session.refresh(wt)
        logger.info("Created walkthrough %s with %d rooms", walkthrough_id, len(rooms))
        return wt

    async def get_walkthrough(self, walkthrough_id: str) -> WalkthroughModel | None:
        """Load a walkthrough with its rooms and versions."""
        result = await self.session.execute(
            select(WalkthroughModel).where(WalkthroughModel.id == walkthrough_id)
        )
        return result.scalar_one_or_none()

    async def update_pannellum_config(self, walkthrough_id: str, config: dict) -> None:
        """Update the Pannellum config for a walkthrough."""
        wt = await self.get_walkthrough(walkthrough_id)
        if wt:
            wt.pannellum_config = config
            await self.session.commit()

    # ------------------------------------------------------------------
    # Room images
    # ------------------------------------------------------------------

    def upload_room_panorama(
        self,
        walkthrough_id: str,
        room_id: str,
        image: Image.Image,
    ) -> str:
        """Upload the initial room panorama to GCS. Returns public URL."""
        gcs_path = f"{walkthrough_id}/rooms/{room_id}.jpg"
        return self.gcs.upload_image(image, gcs_path)

    def upload_version_image(
        self,
        walkthrough_id: str,
        room_id: str,
        version_id: str,
        image: Image.Image,
    ) -> str:
        """Upload a version image to GCS. Returns public URL."""
        gcs_path = f"{walkthrough_id}/rooms/{room_id}/versions/{version_id}.jpg"
        return self.gcs.upload_image(image, gcs_path)

    # ------------------------------------------------------------------
    # Versions
    # ------------------------------------------------------------------

    async def save_room_version(
        self,
        walkthrough_id: str,
        room_id: str,
        image: Image.Image,
        prompt_used: str = "",
        hotspots: list[dict] | None = None,
        bom: list[dict] | None = None,
    ) -> RoomVersionModel:
        """Create a new version for a room — upload image to GCS, save metadata to DB."""
        # Find the room
        result = await self.session.execute(
            select(RoomModel).where(
                RoomModel.walkthrough_id == walkthrough_id,
                RoomModel.room_id == room_id,
            )
        )
        room = result.scalar_one_or_none()
        if room is None:
            msg = f"Room {room_id} not found in walkthrough {walkthrough_id}"
            raise ValueError(msg)

        # Generate version ID
        v_num = len(room.versions) + 1
        v_id = f"v{v_num}_{uuid.uuid4().hex[:6]}"

        # Upload to GCS
        image_url = self.upload_version_image(walkthrough_id, room_id, v_id, image)

        # Save to DB
        version = RoomVersionModel(
            id=v_id,
            room_pk=room.id,
            image_url=image_url,
            prompt_used=prompt_used,
            hotspots=hotspots or [],
            bom=bom or [],
        )
        self.session.add(version)
        room.current_version_id = v_id
        await self.session.commit()
        await self.session.refresh(version)

        logger.info("Saved version %s for room %s", v_id, room_id)
        return version

    async def update_room_version_bom(self, version_id: str, bom: list[dict]) -> None:
        """Update the BOM for an existing room version."""
        from sqlalchemy import update
        await self.session.execute(
            update(RoomVersionModel)
            .where(RoomVersionModel.id == version_id)
            .values(bom=bom)
        )
        await self.session.commit()

    async def revert_room_version(self, walkthrough_id: str, room_id: str, version_id: str) -> str:
        """Revert a room to a previous version ID. Returns the new current image URL."""
        from sqlalchemy import update
        
        # 1. Verify the version exists and belongs to the room
        result = await self.session.execute(
            select(RoomModel).where(
                RoomModel.walkthrough_id == walkthrough_id,
                RoomModel.room_id == room_id
            )
        )
        room = result.scalar_one_or_none()
        if not room:
            raise ValueError(f"Room {room_id} not found")
            
        version = next((v for v in room.versions if v.id == version_id), None)
        if not version:
            raise ValueError(f"Version {version_id} not found for room {room_id}")
            
        # 2. Update current_version_id
        room.current_version_id = version_id
        await self.session.commit()
        
        return version.image_url

    async def get_room_current_image_url(
        self,
        walkthrough_id: str,
        room_id: str,
    ) -> str | None:
        """Get the current panorama URL for a room."""
        result = await self.session.execute(
            select(RoomModel).where(
                RoomModel.walkthrough_id == walkthrough_id,
                RoomModel.room_id == room_id,
            )
        )
        room = result.scalar_one_or_none()
        if room is None:
            return None

        if room.current_version_id:
            for v in room.versions:
                if v.id == room.current_version_id:
                    return v.image_url
            return None

        # Fall back to initial panorama
        return self.gcs.get_public_url(f"{walkthrough_id}/rooms/{room_id}.jpg")

    async def get_room_current_hotspots(
        self,
        walkthrough_id: str,
        room_id: str,
    ) -> list[dict]:
        """Get the current edit hotspots for a room."""
        result = await self.session.execute(
            select(RoomModel).where(
                RoomModel.walkthrough_id == walkthrough_id,
                RoomModel.room_id == room_id,
            )
        )
        room = result.scalar_one_or_none()
        if room is None or not room.current_version_id:
            return []

        for v in room.versions:
            if v.id == room.current_version_id:
                return v.hotspots  # type: ignore[return-value]
        return []
