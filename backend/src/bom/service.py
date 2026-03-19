"""BOM service — orchestrates the two-phase estimate → source pipeline."""

import asyncio
import io
import logging

import httpx
from PIL import Image

from src.bom.agent import BOMAgent
from src.bom.models import BOMEstimateResponse, BOMItem, BOMItemStatus, BOMSourceResponse
from src.database import async_session_factory
from src.panorama.exceptions import WalkthroughNotFoundError
from src.panorama.storage import PanoramaStorage

logger = logging.getLogger(__name__)

_bom_agent: BOMAgent | None = None


def _get_agent() -> BOMAgent:
    global _bom_agent
    if _bom_agent is None:
        from src.ai.panorama_client import get_panorama_generator

        gen = get_panorama_generator()
        _bom_agent = BOMAgent(client=gen._client)
    return _bom_agent


async def _download_image(url: str) -> Image.Image:
    """Download an image from a URL."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return Image.open(io.BytesIO(resp.content))


class BOMService:
    """Stateless service for BOM estimation and sourcing."""

    @staticmethod
    async def get_bom(walkthrough_id: str) -> BOMEstimateResponse:
        """Get the current stored BOM for a walkthrough."""
        async with async_session_factory() as session:
            storage = PanoramaStorage(session)
            wt = await storage.get_walkthrough(walkthrough_id)
            if wt is None:
                raise WalkthroughNotFoundError(f"Walkthrough {walkthrough_id} not found")

            items: list[BOMItem] = []
            for room in wt.rooms:
                if not room.current_version_id:
                    continue
                for v in room.versions:
                    if v.id == room.current_version_id and v.bom:
                        for raw in v.bom:
                            items.append(BOMItem(
                                name=raw.get("name", "Unknown"),
                                category=raw.get("category", ""),
                                estimated_price_usd=float(raw.get("estimated_price_usd", 0)),
                                status=raw.get("status", BOMItemStatus.ESTIMATED),
                                room_label=room.room_label,
                                source_url=raw.get("source_url", ""),
                                source_name=raw.get("source_name", ""),
                                source_price=raw.get("source_price", ""),
                                source_title=raw.get("source_title", ""),
                            ))
                        break

            total = sum(i.estimated_price_usd for i in items)
            return BOMEstimateResponse(
                walkthrough_id=walkthrough_id,
                items=items,
                total_estimated_usd=round(total, 2),
            )

    @staticmethod
    async def estimate(walkthrough_id: str) -> BOMEstimateResponse:
        """Phase 1: Analyze all room panoramas and estimate furniture prices."""
        async with async_session_factory() as session:
            storage = PanoramaStorage(session)
            wt = await storage.get_walkthrough(walkthrough_id)
            if wt is None:
                raise WalkthroughNotFoundError(f"Walkthrough {walkthrough_id} not found")

            agent = _get_agent()
            all_items: list[BOMItem] = []

            # Process all rooms in parallel
            async def process_room(room):
                if not room.current_version_id:
                    return []
                # Find current version image URL
                image_url = None
                for v in room.versions:
                    if v.id == room.current_version_id:
                        image_url = v.image_url
                        break
                if not image_url:
                    return []

                panorama = await _download_image(image_url)
                return await agent.estimate(panorama, room_label=room.room_label)

            tasks = [process_room(room) for room in wt.rooms]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in results:
                if isinstance(result, Exception):
                    logger.error("Room estimation failed: %s", result)
                    continue
                all_items.extend(result)

            # Persist estimates to DB
            await _persist_bom(storage, wt, all_items)

        total = sum(i.estimated_price_usd for i in all_items)
        return BOMEstimateResponse(
            walkthrough_id=walkthrough_id,
            items=all_items,
            total_estimated_usd=round(total, 2),
        )

    @staticmethod
    async def source(walkthrough_id: str, item_names: list[str]) -> BOMSourceResponse:
        """Phase 2: Search the web for real product listings."""
        # First get current estimates
        current = await BOMService.get_bom(walkthrough_id)
        if not current.items:
            # No estimates yet — run estimate first
            current = await BOMService.estimate(walkthrough_id)

        agent = _get_agent()

        # Filter to requested items, or source all
        items_to_source = current.items
        if item_names:
            items_to_source = [i for i in current.items if i.name in item_names]

        sourced = await agent.source(items_to_source)

        # Merge sourced items back with un-sourced ones
        sourced_names = {i.name for i in sourced}
        final_items = sourced + [i for i in current.items if i.name not in sourced_names]

        # Persist to DB
        async with async_session_factory() as session:
            storage = PanoramaStorage(session)
            wt = await storage.get_walkthrough(walkthrough_id)
            if wt:
                await _persist_bom(storage, wt, final_items)

        total = sum(i.estimated_price_usd for i in final_items)
        return BOMSourceResponse(
            walkthrough_id=walkthrough_id,
            items=final_items,
            total_estimated_usd=round(total, 2),
        )


async def _persist_bom(storage: PanoramaStorage, wt, items: list[BOMItem]) -> None:
    """Save BOM items back to room versions in DB."""
    # Group items by room_label
    by_room: dict[str, list[dict]] = {}
    for item in items:
        label = item.room_label or "unknown"
        by_room.setdefault(label, []).append(item.model_dump())

    for room in wt.rooms:
        if not room.current_version_id:
            continue
        room_items = by_room.get(room.room_label, [])
        if room_items:
            await storage.update_room_version_bom(room.current_version_id, room_items)
