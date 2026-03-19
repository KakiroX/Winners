import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    from src.floor_plan.exceptions import SchemaGenerationError, PromptRejectedError
    from src.panorama.exceptions import (
        PanoramaGenerationError,
        RoomNotFoundError,
        WalkthroughNotFoundError,
        VersionNotFoundError,
    )

    @app.exception_handler(SchemaGenerationError)
    async def schema_generation_error_handler(
        request: Request, exc: SchemaGenerationError
    ) -> JSONResponse:
        logger.error("schema_generation_failed", extra={"detail": str(exc)})
        return JSONResponse(status_code=503, content={"detail": str(exc)})

    @app.exception_handler(PromptRejectedError)
    async def prompt_rejected_error_handler(
        request: Request, exc: PromptRejectedError
    ) -> JSONResponse:
        return JSONResponse(status_code=422, content={"detail": str(exc)})

    @app.exception_handler(PanoramaGenerationError)
    async def panorama_generation_error_handler(
        request: Request, exc: PanoramaGenerationError
    ) -> JSONResponse:
        logger.error("panorama_generation_failed", extra={"detail": str(exc)})
        return JSONResponse(status_code=503, content={"detail": str(exc)})

    @app.exception_handler(WalkthroughNotFoundError)
    async def walkthrough_not_found_handler(
        request: Request, exc: WalkthroughNotFoundError
    ) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    @app.exception_handler(RoomNotFoundError)
    async def room_not_found_handler(
        request: Request, exc: RoomNotFoundError
    ) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    @app.exception_handler(VersionNotFoundError)
    async def version_not_found_handler(
        request: Request, exc: VersionNotFoundError
    ) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": str(exc)})
