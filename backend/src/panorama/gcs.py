"""Google Cloud Storage client for panorama image uploads."""

from __future__ import annotations

import io
import logging
from functools import lru_cache
from pathlib import Path

from PIL import Image

from src.config import settings

logger = logging.getLogger(__name__)


class GCSClient:
    """Upload and manage panorama images in Google Cloud Storage."""

    def __init__(self) -> None:
        from google.cloud import storage

        if settings.gcs_key_path:
            self._client = storage.Client.from_service_account_json(settings.gcs_key_path)
        else:
            self._client = storage.Client()

        self._bucket = self._client.bucket(settings.gcs_bucket)
        logger.info("GCS client initialised — bucket: %s", settings.gcs_bucket)

    def upload_image(self, image: Image.Image, path: str, quality: int = 90) -> str:
        """Upload a PIL Image to GCS and return its public URL.

        Parameters
        ----------
        image : PIL.Image.Image
            The image to upload.
        path : str
            Object path within the bucket, e.g. ``"abc123/rooms/room1.jpg"``.
        quality : int
            JPEG quality.

        Returns
        -------
        str
            Public URL of the uploaded image.
        """
        buf = io.BytesIO()
        image.save(buf, format="JPEG", quality=quality)
        buf.seek(0)

        blob = self._bucket.blob(path)
        blob.upload_from_file(buf, content_type="image/jpeg")

        url = f"https://storage.googleapis.com/{settings.gcs_bucket}/{path}"
        logger.info("Uploaded image to %s", url)
        return url

    def upload_file(self, local_path: Path, gcs_path: str) -> str:
        """Upload a local file to GCS and return its public URL."""
        blob = self._bucket.blob(gcs_path)
        blob.upload_from_filename(str(local_path), content_type="image/jpeg")

        url = f"https://storage.googleapis.com/{settings.gcs_bucket}/{gcs_path}"
        logger.info("Uploaded file to %s", url)
        return url

    def delete(self, path: str) -> None:
        """Delete an object from GCS."""
        blob = self._bucket.blob(path)
        blob.delete()

    def get_public_url(self, path: str) -> str:
        """Return the public URL for an object."""
        return f"https://storage.googleapis.com/{settings.gcs_bucket}/{path}"


@lru_cache(maxsize=1)
def get_gcs_client() -> GCSClient:
    """Singleton GCS client."""
    return GCSClient()
