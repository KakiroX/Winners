"""Panorama domain API router."""

from fastapi import APIRouter, BackgroundTasks, Depends, status
from fastapi.responses import StreamingResponse

from src.panorama.exceptions import RoomNotFoundError, WalkthroughNotFoundError
from src.panorama.schemas import (
    EditRoomRequest,
    EditRoomResponse,
    GenerateWalkthroughRequest,
    GenerateWalkthroughResponse,
    RenameWalkthroughRequest,
    WalkthroughSchema,
)
from src.panorama.service import PanoramaService
from src.users.dependencies import get_current_user, get_optional_current_user
from src.users.models import UserModel

router = APIRouter(prefix="/panorama", tags=["panorama"])


@router.post(
    "/generate-walkthrough",
    response_model=GenerateWalkthroughResponse,
    status_code=status.HTTP_200_OK,
    description="Generate 360 panoramas for all rooms in a selected floor plan.",
)
async def generate_walkthrough(
    body: GenerateWalkthroughRequest,
    current_user: UserModel | None = Depends(get_optional_current_user),
) -> GenerateWalkthroughResponse:
    if current_user:
        body.user_id = current_user.id
    return await PanoramaService.generate_walkthrough(body)


@router.post(
    "/generate-walkthrough/stream",
    description="SSE stream: generate panoramas room-by-room with progress events.",
)
async def generate_walkthrough_stream(
    body: GenerateWalkthroughRequest,
    background_tasks: BackgroundTasks,
    current_user: UserModel | None = Depends(get_optional_current_user),
) -> StreamingResponse:
    if current_user:
        body.user_id = current_user.id
    return StreamingResponse(
        PanoramaService.generate_walkthrough_stream(body, background_tasks),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get(
    "/walkthrough/{walkthrough_id}",
    response_model=WalkthroughSchema,
    description="Get a walkthrough by ID.",
)
async def get_walkthrough(walkthrough_id: str) -> WalkthroughSchema:
    result = await PanoramaService.get_walkthrough(walkthrough_id)
    if result is None:
        raise WalkthroughNotFoundError(f"Walkthrough {walkthrough_id} not found")
    return result

@router.delete(
    "/walkthrough/{walkthrough_id}",
    description="Delete a walkthrough and all its associated data.",
)
async def delete_walkthrough(walkthrough_id: str):
    success = await PanoramaService.delete_walkthrough(walkthrough_id)
    if not success:
        raise WalkthroughNotFoundError(f"Walkthrough {walkthrough_id} not found")
    return {"status": "deleted"}

@router.patch(
    "/walkthrough/{walkthrough_id}/rename",
    description="Rename a walkthrough.",
)
async def rename_walkthrough(walkthrough_id: str, body: RenameWalkthroughRequest):
    success = await PanoramaService.rename_walkthrough(walkthrough_id, body.title)
    if not success:
        raise WalkthroughNotFoundError(f"Walkthrough {walkthrough_id} not found")
    return {"status": "renamed", "title": body.title}


@router.get(
    "/walkthroughs",
    description="List all walkthroughs for a user.",
)
async def list_walkthroughs(
    current_user: UserModel | None = Depends(get_optional_current_user),
    user_id: str = "guest",
):
    uid = current_user.id if current_user else user_id
    return await PanoramaService.list_walkthroughs(uid)


@router.get(
    "/walkthrough/{walkthrough_id}/bom",
    description="Get the total Bill of Materials for a walkthrough.",
)
async def get_walkthrough_bom(walkthrough_id: str):
    return await PanoramaService.get_walkthrough_bom(walkthrough_id)


@router.get(
    "/walkthrough/{walkthrough_id}/room/{room_id}/versions",
    description="Get all versions of a specific room.",
)
async def get_room_versions(
    walkthrough_id: str,
    room_id: str,
):
    return await PanoramaService.get_room_versions(walkthrough_id, room_id)


@router.post(
    "/walkthrough/{walkthrough_id}/room/{room_id}/revert/{version_id}",
    description="Revert a room to a previous version.",
)
async def revert_room_version(
    walkthrough_id: str,
    room_id: str,
    version_id: str,
):
    return await PanoramaService.revert_room_version(walkthrough_id, room_id, version_id)


@router.post(
    "/walkthrough/{walkthrough_id}/room/{room_id}/edit",
    response_model=EditRoomResponse,
    description="Surgically edit a room panorama at a specific pitch/yaw location.",
)
async def edit_room(
    walkthrough_id: str,
    room_id: str,
    body: EditRoomRequest,
    background_tasks: BackgroundTasks,
) -> EditRoomResponse:
    return await PanoramaService.edit_room(
        walkthrough_id=walkthrough_id,
        room_id=room_id,
        prompt=body.prompt,
        pitch=body.pitch,
        yaw=body.yaw,
        background_tasks=background_tasks,
    )
