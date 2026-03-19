import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.config import settings
from src.constants import ENVIRONMENT_SHOW_DOCS
from src.exceptions import register_exception_handlers
from src.panorama.constants import STORAGE_BASE_DIR

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    from src.ai.client import get_gemini_client

    get_gemini_client()

    # Ensure panorama storage directory exists
    STORAGE_BASE_DIR.mkdir(parents=True, exist_ok=True)

    yield


app_config: dict[str, object] = {"title": "Inhabit API", "lifespan": lifespan}
if settings.environment not in ENVIRONMENT_SHOW_DOCS:
    app_config["openapi_url"] = None

app = FastAPI(**app_config)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

from src.floor_plan.router import router as floor_plan_router  # noqa: E402
from src.panorama.router import router as panorama_router  # noqa: E402

app.include_router(floor_plan_router, prefix=settings.api_v1_prefix)
app.include_router(panorama_router, prefix=settings.api_v1_prefix)

# Serve panorama images as static files
app.mount("/panoramas", StaticFiles(directory=str(STORAGE_BASE_DIR.parent)), name="panoramas")
