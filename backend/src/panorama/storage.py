"""Panorama design storage — version tracking and image persistence.

Ported from Winners2/panorama_backend/storage.py, adapted for the
Inhabit domain model.
"""

from __future__ import annotations

import json
import logging
import shutil
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path

from src.panorama.constants import STORAGE_BASE_DIR

logger = logging.getLogger(__name__)


@dataclass
class EditHotspotData:
    """Serialisable edit hotspot for storage."""

    id: str
    pitch: float
    yaw: float
    text: str = ""
    properties: dict[str, object] = field(default_factory=dict)

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "pitch": self.pitch,
            "yaw": self.yaw,
            "text": self.text,
            "properties": self.properties,
        }

    @classmethod
    def from_dict(cls, data: dict[str, object]) -> EditHotspotData:
        return cls(**data)  # type: ignore[arg-type]


@dataclass
class VersionData:
    """An immutable version snapshot stored on disk."""

    id: str
    room_id: str
    image_path: str
    created_at: float
    prompt_used: str = ""
    hotspots: list[EditHotspotData] = field(default_factory=list)

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "room_id": self.room_id,
            "image_path": self.image_path,
            "created_at": self.created_at,
            "prompt_used": self.prompt_used,
            "hotspots": [h.to_dict() for h in self.hotspots],
        }

    @classmethod
    def from_dict(cls, data: dict[str, object]) -> VersionData:
        raw_hotspots = data.pop("hotspots", [])
        hotspots = [EditHotspotData.from_dict(h) for h in raw_hotspots]  # type: ignore[union-attr]
        return cls(**data, hotspots=hotspots)  # type: ignore[arg-type]


@dataclass
class RoomDesignData:
    """Design data for a single room within a walkthrough."""

    room_id: str
    room_label: str
    versions: list[VersionData] = field(default_factory=list)
    current_version_id: str = ""

    def to_dict(self) -> dict[str, object]:
        return {
            "room_id": self.room_id,
            "room_label": self.room_label,
            "versions": [v.to_dict() for v in self.versions],
            "current_version_id": self.current_version_id,
        }

    @classmethod
    def from_dict(cls, data: dict[str, object]) -> RoomDesignData:
        raw_versions = data.pop("versions", [])
        versions = [VersionData.from_dict(v) for v in raw_versions]  # type: ignore[union-attr]
        return cls(**data, versions=versions)  # type: ignore[arg-type]


@dataclass
class WalkthroughData:
    """Top-level walkthrough design stored on disk."""

    id: str
    floor_plan_id: str
    title: str
    created_at: float
    rooms: list[RoomDesignData] = field(default_factory=list)
    pannellum_config: dict[str, object] = field(default_factory=dict)

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "floor_plan_id": self.floor_plan_id,
            "title": self.title,
            "created_at": self.created_at,
            "rooms": [r.to_dict() for r in self.rooms],
            "pannellum_config": self.pannellum_config,
        }

    @classmethod
    def from_dict(cls, data: dict[str, object]) -> WalkthroughData:
        raw_rooms = data.pop("rooms", [])
        rooms = [RoomDesignData.from_dict(r) for r in raw_rooms]  # type: ignore[union-attr]
        return cls(**data, rooms=rooms)  # type: ignore[arg-type]


class PanoramaStorage:
    """File-based storage for panorama walkthroughs and version history."""

    def __init__(self, base_dir: Path | None = None) -> None:
        self.base_dir = base_dir or STORAGE_BASE_DIR
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _get_walkthrough_dir(self, walkthrough_id: str) -> Path:
        return self.base_dir / walkthrough_id

    def _get_meta_path(self, walkthrough_id: str) -> Path:
        return self._get_walkthrough_dir(walkthrough_id) / "meta.json"

    def save_walkthrough(self, walkthrough: WalkthroughData) -> None:
        """Save or update walkthrough metadata."""
        wt_dir = self._get_walkthrough_dir(walkthrough.id)
        wt_dir.mkdir(parents=True, exist_ok=True)

        meta_path = self._get_meta_path(walkthrough.id)
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(walkthrough.to_dict(), f, indent=2)

        logger.info("Saved walkthrough %s", walkthrough.id)

    def get_walkthrough(self, walkthrough_id: str) -> WalkthroughData | None:
        """Load walkthrough metadata from disk."""
        meta_path = self._get_meta_path(walkthrough_id)
        if not meta_path.exists():
            return None
        with open(meta_path, encoding="utf-8") as f:
            return WalkthroughData.from_dict(json.load(f))

    def save_room_version(
        self,
        walkthrough_id: str,
        room_id: str,
        image_path: Path,
        prompt_used: str = "",
        hotspots: list[EditHotspotData] | None = None,
    ) -> VersionData:
        """Save a new version for a room within a walkthrough."""
        walkthrough = self.get_walkthrough(walkthrough_id)
        if walkthrough is None:
            msg = f"Walkthrough {walkthrough_id} not found"
            raise ValueError(msg)

        room_data = None
        for r in walkthrough.rooms:
            if r.room_id == room_id:
                room_data = r
                break

        if room_data is None:
            msg = f"Room {room_id} not found in walkthrough {walkthrough_id}"
            raise ValueError(msg)

        # Create version
        v_num = len(room_data.versions) + 1
        v_id = f"v{v_num}_{uuid.uuid4().hex[:6]}"

        # Copy image to versioned storage
        v_dir = self._get_walkthrough_dir(walkthrough_id) / "rooms" / room_id / "versions"
        v_dir.mkdir(parents=True, exist_ok=True)
        dest = v_dir / f"{v_id}{image_path.suffix}"
        shutil.copy2(image_path, dest)

        # Relative path for serving
        rel_path = str(dest.relative_to(self.base_dir.parent))

        version = VersionData(
            id=v_id,
            room_id=room_id,
            image_path=rel_path,
            created_at=time.time(),
            prompt_used=prompt_used,
            hotspots=hotspots or [],
        )

        room_data.versions.append(version)
        room_data.current_version_id = v_id
        self.save_walkthrough(walkthrough)

        logger.info("Saved version %s for room %s in walkthrough %s", v_id, room_id, walkthrough_id)
        return version

    def get_room_image_path(self, walkthrough_id: str, room_id: str) -> Path | None:
        """Get the current panorama image path for a room."""
        # First check for versioned images
        walkthrough = self.get_walkthrough(walkthrough_id)
        if walkthrough is None:
            return None

        for r in walkthrough.rooms:
            if r.room_id == room_id and r.current_version_id:
                for v in r.versions:
                    if v.id == r.current_version_id:
                        return self.base_dir.parent / v.image_path

        # Fall back to the original generated image
        original = self._get_walkthrough_dir(walkthrough_id) / "rooms" / f"{room_id}.jpg"
        if original.exists():
            return original
        return None
