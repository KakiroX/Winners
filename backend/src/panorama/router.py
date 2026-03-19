"""Panorama domain API router."""

from fastapi import APIRouter, status

from src.panorama.exceptions import RoomNotFoundError, WalkthroughNotFoundError
from src.panorama.schemas import (
    EditRoomRequest,
    EditRoomResponse,
    GenerateWalkthroughRequest,
    GenerateWalkthroughResponse,
    WalkthroughSchema,
)
from src.panorama.service import PanoramaService

router = APIRouter(prefix="/panorama", tags=["panorama"])


@router.post(
    "/generate-walkthrough",
    response_model=GenerateWalkthroughResponse,
    status_code=status.HTTP_200_OK,
    description="Generate 360 panoramas for all rooms in a selected floor plan.",
    responses={
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "description": "Gemini API unavailable or generation failed"
        },
    },
)
async def generate_walkthrough(
    body: GenerateWalkthroughRequest,
) -> GenerateWalkthroughResponse:
    return await PanoramaService.generate_walkthrough(body)


@router.get(
    "/walkthrough/{walkthrough_id}",
    response_model=WalkthroughSchema,
    description="Get a walkthrough by ID with current room panoramas and Pannellum config.",
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Walkthrough not found"},
    },
)
async def get_walkthrough(walkthrough_id: str) -> WalkthroughSchema:
    result = await PanoramaService.get_walkthrough(walkthrough_id)
    if result is None:
        raise WalkthroughNotFoundError(f"Walkthrough {walkthrough_id} not found")
    return result


@router.post(
    "/walkthrough/{walkthrough_id}/room/{room_id}/edit",
    response_model=EditRoomResponse,
    description="Surgically edit a room panorama at a specific pitch/yaw location.",
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Walkthrough or room not found"},
        status.HTTP_503_SERVICE_UNAVAILABLE: {"description": "Edit generation failed"},
    },
)
async def edit_room(
    walkthrough_id: str,
    room_id: str,
    body: EditRoomRequest,
) -> EditRoomResponse:
    return await PanoramaService.edit_room(
        walkthrough_id=walkthrough_id,
        room_id=room_id,
        prompt=body.prompt,
        pitch=body.pitch,
        yaw=body.yaw,
    )
