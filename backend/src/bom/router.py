"""BOM domain API router — two-phase: estimate → source."""

import logging

from fastapi import APIRouter, status

from src.bom.models import (
    BOMEstimateResponse,
    BOMSourceRequest,
    BOMSourceResponse,
)
from src.bom.service import BOMService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bom", tags=["bom"])


@router.get(
    "/walkthrough/{walkthrough_id}",
    response_model=BOMEstimateResponse,
    description="Get the current BOM for a walkthrough (estimates or sourced).",
)
async def get_bom(walkthrough_id: str) -> BOMEstimateResponse:
    return await BOMService.get_bom(walkthrough_id)


@router.post(
    "/walkthrough/{walkthrough_id}/estimate",
    response_model=BOMEstimateResponse,
    status_code=status.HTTP_200_OK,
    description="Phase 1: Detect furniture from panoramas and estimate prices.",
)
async def estimate_bom(walkthrough_id: str) -> BOMEstimateResponse:
    return await BOMService.estimate(walkthrough_id)


@router.post(
    "/walkthrough/{walkthrough_id}/source",
    response_model=BOMSourceResponse,
    status_code=status.HTTP_200_OK,
    description="Phase 2: Search the web for real product listings matching BOM items.",
)
async def source_bom(
    walkthrough_id: str,
    body: BOMSourceRequest | None = None,
) -> BOMSourceResponse:
    item_names = body.item_names if body else []
    return await BOMService.source(walkthrough_id, item_names)
