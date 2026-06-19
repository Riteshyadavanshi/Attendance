from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    database_url: str = f"sqlite+aiosqlite:///{(_BACKEND_DIR / 'hr_attendance.db').as_posix()}"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    face_service_url: str = "http://localhost:8001"
    face_match_threshold: float = 0.5
    liveness_threshold: float = 0.85
    geofence_default_radius_m: int = 300
    max_gps_accuracy_m: float = 50.0
    encryption_key: str = "dev-encryption-key-change-me!!"
    cors_origins: str = "*"
    mfa_issuer: str = "HR Attendance"
    check_in_early_buffer_minutes: int = 60


@lru_cache
def get_settings() -> Settings:
    return Settings()
