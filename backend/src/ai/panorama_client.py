"""Gemini image generation client for panorama creation and editing.

Ported from Winners2/panorama_backend/panorama_generator.py — uses the
google-genai SDK directly (not langchain) because we need IMAGE response
modality which langchain-google-genai does not support.
"""

from __future__ import annotations

import io
import logging
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

from PIL import Image

from src.config import settings

logger = logging.getLogger(__name__)


@dataclass
class PanoramaResult:
    """Result of a panorama generation or editing operation."""

    image: Image.Image
    description: str = ""
    prompt_used: str = ""

    def save(self, path: str | Path, quality: int = 95) -> Path:
        path = Path(path).resolve()
        path.parent.mkdir(parents=True, exist_ok=True)

        save_kwargs: dict[str, object] = {}
        if path.suffix.lower() in (".jpg", ".jpeg"):
            save_kwargs["quality"] = quality

        self.image.save(str(path), **save_kwargs)
        logger.info("Panorama saved to %s (%dx%d)", path, self.image.width, self.image.height)
        return path


@dataclass
class ChatSession:
    """Wraps a Gemini multi-turn chat for iterative panorama editing."""

    _chat: object = field(repr=False)
    history: list[str] = field(default_factory=list)


class PanoramaGenerator:
    """Generate and edit equirectangular panoramas using Gemini image models.

    Uses ``google-genai`` SDK with ``response_modalities=["TEXT", "IMAGE"]``.
    """

    def __init__(self, model: str | None = None) -> None:
        from google import genai

        self._client = genai.Client(api_key=settings.google_api_key)
        self._model = model or settings.gemini_image_model
        logger.info("PanoramaGenerator initialised with model: %s", self._model)

    def generate(self, prompt: str) -> PanoramaResult:
        """Generate a new equirectangular panorama from a text prompt."""
        from google.genai import types

        logger.info("Generating panorama — prompt length: %d chars", len(prompt))

        response = self._client.models.generate_content(
            model=self._model,
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )

        return self._parse_response(response, prompt)

    def edit(
        self,
        panorama: Image.Image,
        modification_request: str,
        edit_prompt: str,
        pitch: float | None = None,
        yaw: float | None = None,
    ) -> PanoramaResult:
        """Edit an existing panorama with location-aware context."""
        from google.genai import types

        context_images: list[Image.Image] = [panorama]

        if pitch is not None and yaw is not None:
            x = int(((yaw + 180) / 360) * panorama.width)
            y = int(((90 - pitch) / 180) * panorama.height)
            w, h = 512, 512
            left = max(0, x - w // 2)
            top = max(0, y - h // 2)
            right = min(panorama.width, left + w)
            bottom = min(panorama.height, top + h)

            crop = panorama.crop((left, top, right, bottom))
            context_images.append(crop)

        logger.info("Editing panorama — modification: %s", modification_request)

        response = self._client.models.generate_content(
            model=self._model,
            contents=[edit_prompt, *context_images],
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )

        return self._parse_response(response, edit_prompt)

    def start_session(self, system_prompt: str = "") -> ChatSession:
        """Start a multi-turn editing chat session."""
        from google.genai import types

        from src.ai.panorama_prompts import BASE_CONTEXT, SYSTEM_INSTRUCTIONS

        prompt = system_prompt or f"{SYSTEM_INSTRUCTIONS}\n\n{BASE_CONTEXT}"

        chat = self._client.chats.create(
            model=self._model,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
                system_instruction=prompt,
            ),
        )

        logger.info("Started multi-turn editing session")
        return ChatSession(_chat=chat)

    def iterate(
        self,
        session: ChatSession,
        modification_request: str,
        reference_image: Image.Image | None = None,
    ) -> PanoramaResult:
        """Send a modification request within a multi-turn session."""
        contents: list[object] = [modification_request]
        if reference_image is not None:
            contents.append(reference_image)

        logger.info("Iterating in session — request: %s", modification_request)
        response = session._chat.send_message(contents)  # type: ignore[union-attr]
        session.history.append(modification_request)

        return self._parse_response(response, modification_request)

    @staticmethod
    def _parse_response(response: object, prompt_used: str) -> PanoramaResult:
        """Extract image and text from a Gemini response."""
        image = None
        description_parts: list[str] = []

        for part in response.candidates[0].content.parts:  # type: ignore[union-attr]
            if part.text is not None:
                description_parts.append(part.text)
            elif part.inline_data is not None:
                image = Image.open(io.BytesIO(part.inline_data.data))

        if image is None:
            raise RuntimeError(
                "The model did not return an image. "
                f"Model response text: {' '.join(description_parts)}"
            )

        return PanoramaResult(
            image=image,
            description="\n".join(description_parts),
            prompt_used=prompt_used,
        )


@lru_cache(maxsize=1)
def get_panorama_generator() -> PanoramaGenerator:
    """Singleton panorama generator instance."""
    return PanoramaGenerator()
