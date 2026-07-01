from __future__ import annotations

import os
from pathlib import Path

from fastapi import HTTPException, status

API_BASE_PATH = os.getenv("API_BASE_PATH", "/api/v1")
APP_VERSION = "0.1.0"
EMBEDDING_DIMENSIONS = 384
DEFAULT_AI_ACTION_RATE_LIMIT_MAX_REQUESTS = 12
DEFAULT_AI_ACTION_RATE_LIMIT_WINDOW_SECONDS = 60 * 60


def _allowed_origins() -> list[str]:
    raw = os.getenv(
        "BACKEND_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def _read_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values

    for line in path.read_text().splitlines():
        raw = line.strip()
        if not raw or raw.startswith("#") or "=" not in raw:
            continue

        key, value = raw.split("=", 1)
        key = key.strip()
        if key.startswith("export "):
            key = key[7:].strip()

        values[key] = value.strip().strip('"').strip("'")

    return values


def _env_value(name: str) -> str | None:
    direct_value = os.getenv(name)
    if direct_value:
        return direct_value

    env_paths = (
        Path.cwd() / ".env.local",
        Path.cwd() / ".env",
        Path.cwd().parent / ".env.local",
        Path.cwd().parent / ".env",
    )
    for env_path in env_paths:
        file_value = _read_env_file(env_path).get(name)
        if file_value:
            return file_value

    return None


def _env_bool(name: str, default: bool) -> bool:
    value = _env_value(name)
    if value is None:
        return default
    return value.strip().lower() not in {"0", "false", "no", "off"}


def _env_int(name: str, default: int, *, minimum: int) -> int:
    value = _env_value(name)
    if value is None:
        return default
    try:
        parsed = int(value.strip())
    except ValueError:
        return default
    return max(minimum, parsed)


def _database_conninfo() -> str:
    conninfo = (
        _env_value("SUPABASE_POOLER_CONNECTING_STRING")
        or _env_value("DATABASE_URL")
        or _env_value("SUPABASE_DIRECT_CONNECTING_STRING")
    )
    if not conninfo:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase database connection is not configured",
        )

    return conninfo
