"""Graph state for the panorama generation pipeline."""

from typing import NotRequired, TypedDict

from src.panorama.schemas import RoomInput, RoomPanorama


class PanoramaGraphState(TypedDict):
    # Inputs
    generation_id: str
    floor_plan_id: str
    rooms: list[RoomInput]
    aesthetic_tags: list[str]
    style_notes: str
    variant_label: str

    # Intermediate
    room_prompts: NotRequired[dict[str, str]]
    generated_images: NotRequired[dict[str, str]]  # room_id -> image file path
    generation_errors: NotRequired[dict[str, str]]  # room_id -> error message

    # Output
    room_panoramas: NotRequired[list[RoomPanorama]]
    pannellum_config: NotRequired[dict[str, object]]
    error: NotRequired[str]
