from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ROOT_ENV = Path(__file__).parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(_ROOT_ENV, ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    google_api_key: str
    gemini_model: str = "gemini-3-flash-preview"
    gemini_image_model: str = "gemini-3-pro-image-preview"
    gemini_temperature: float = 0.7
    gemini_max_retries: int = 3

    environment: str = "local"
    cors_origins: list[str] = [
        "http://localhost:3000",
        "https://dehabit.tech",
        "https://www.dehabit.tech",
    ]
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = "postgresql+asyncpg://inhabit:inhabit@localhost:5432/inhabit"

    # Google Cloud Storage
    gcs_bucket: str = "inhabit-panoramas"
    gcs_key_path: str = ""

    # JWT
    jwt_secret_key: str = "change-me-in-production-use-a-long-random-string"
    jwt_expire_days: int = 30


settings = Settings()
