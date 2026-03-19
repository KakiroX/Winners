"""Panorama domain Pydantic schemas — API boundary models."""

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Hotspot models
# ---------------------------------------------------------------------------


class NavigationHotspot(BaseModel):
    """A clickable hotspot inside a panorama for room-to-room navigation."""

    id: str
    target_room_id: str
    pitch: float = Field(ge=-90, le=90)
    yaw: float = Field(ge=-180, le=180)
    label: str


class EditHotspot(BaseModel):
    """A hotspot recording a surgical edit location + metadata."""

    id: str
    pitch: float = Field(ge=-90, le=90)
    yaw: float = Field(ge=-180, le=180)
    text: str = ""
    properties: dict[str, object] = {}


class BOMItem(BaseModel):
    """A furniture or decor item sourced for a room."""

    name: str
    price: str
    url: str
    design_source: str | None = None


# ---------------------------------------------------------------------------
# Room panorama
# ---------------------------------------------------------------------------


class RoomPanorama(BaseModel):
    """A single room's panorama with its navigation and edit hotspots."""

    room_id: str
    room_label: str
    room_type: str
    panorama_url: str
    navigation_hotspots: list[NavigationHotspot] = []
    edit_hotspots: list[EditHotspot] = []
    bom: list[BOMItem] = []
    default_yaw: float = 0.0
    default_pitch: float = 0.0


# ---------------------------------------------------------------------------
# Walkthrough
# ---------------------------------------------------------------------------


class WalkthroughSchema(BaseModel):
    """A multi-room 360 walkthrough built from a floor plan."""

    id: str
    floor_plan_id: str
    generation_id: str
    title: str
    rooms: list[RoomPanorama]
    pannellum_config: dict[str, object]


# ---------------------------------------------------------------------------
# Version tracking
# ---------------------------------------------------------------------------


class VersionSchema(BaseModel):
    """An immutable snapshot of a room panorama after an edit."""

    id: str
    room_id: str
    image_path: str
    created_at: float
    prompt_used: str = ""
    edit_hotspots: list[EditHotspot] = []
    bom: list[BOMItem] = []


# ---------------------------------------------------------------------------
# Room input (must precede GenerateWalkthroughRequest)
# ---------------------------------------------------------------------------


class RoomInput(BaseModel):
    """Minimal room data needed for panorama generation."""

    id: str
    type: str
    label: str
    area_sqm: float
    width_units: int
    height_units: int
    position: dict[str, int]
    connections: list[str]
    features: list[str] = []
    natural_light: str


# ---------------------------------------------------------------------------
# Request / Response
# ---------------------------------------------------------------------------


class GenerateWalkthroughRequest(BaseModel):
    """Request to generate panoramas for all rooms in a selected floor plan."""

    floor_plan_id: str
    user_id: str = "guest"
    variant_label: str
    total_area_sqm: float
    grid_cols: int
    grid_rows: int
    rooms: list[RoomInput]
    floor_plan_metadata: dict = {}  # Store the full plan layout for later viewing
    aesthetic_tags: list[str]
    style_notes: str
    user_style_prompt: str = ""


class GenerateWalkthroughResponse(BaseModel):
    """Response containing the generated walkthrough."""

    walkthrough: WalkthroughSchema


class EditRoomRequest(BaseModel):
    """Request to surgically edit a room panorama."""

    prompt: str = Field(min_length=3, max_length=500)
    pitch: float = Field(ge=-90, le=90)
    yaw: float = Field(ge=-180, le=180)


class EditRoomResponse(BaseModel):
    """Response after editing a room panorama."""

    version: VersionSchema
    updated_panorama_url: str
