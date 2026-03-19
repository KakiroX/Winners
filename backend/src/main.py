import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.constants import ENVIRONMENT_SHOW_DOCS
from src.exceptions import register_exception_handlers

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    from src.ai.client import get_gemini_client
    from src.database import Base, engine

    get_gemini_client()

    # Create all tables on startup (lightweight for dev/hackathon)
    async with engine.begin() as conn:
        # Import models so they register with Base
        import src.panorama.models  # noqa: F401
        import src.users.models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)

    yield

    await engine.dispose()


app_config: dict[str, object] = {"title": "Dehabit API", "lifespan": lifespan}
if settings.environment not in ENVIRONMENT_SHOW_DOCS:
    app_config["openapi_url"] = None

app = FastAPI(**app_config)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

from src.floor_plan.router import router as floor_plan_router  # noqa: E402
from src.panorama.router import router as panorama_router  # noqa: E402
from src.users.router import router as auth_router  # noqa: E402

app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(floor_plan_router, prefix=settings.api_v1_prefix)
app.include_router(panorama_router, prefix=settings.api_v1_prefix)
