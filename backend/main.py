from __future__ import annotations

import os
from datetime import UTC, datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

API_BASE_PATH = os.getenv("API_BASE_PATH", "/api/v1")
APP_VERSION = "0.1.0"


def _allowed_origins() -> list[str]:
    raw = os.getenv(
        "BACKEND_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


app = FastAPI(
    title="TeachFlow AI API",
    version=APP_VERSION,
    docs_url=f"{API_BASE_PATH}/docs",
    openapi_url=f"{API_BASE_PATH}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(f"{API_BASE_PATH}/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "teachflow-api",
        "version": APP_VERSION,
        "timestamp": datetime.now(UTC).isoformat(),
    }
