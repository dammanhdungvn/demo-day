from __future__ import annotations

import json
import logging
import re
from contextvars import ContextVar
from datetime import UTC, datetime
from time import perf_counter
from typing import Any, Awaitable, Callable
from uuid import uuid4

from fastapi import Request, Response

REQUEST_ID_HEADER = "X-Request-ID"
OBSERVABILITY_LOGGER_NAME = "teachflow.observability"
SECRET_KEY_PATTERN = re.compile(
    r"(authorization|cookie|password|secret|token|api[_-]?key|service[_-]?role)",
    re.IGNORECASE,
)
SAFE_REQUEST_ID_PATTERN = re.compile(r"^[a-zA-Z0-9._:-]{1,128}$")

logger = logging.getLogger(OBSERVABILITY_LOGGER_NAME)
CURRENT_REQUEST_ID: ContextVar[str | None] = ContextVar(
    "teachflow_request_id",
    default=None,
)


def configure_observability_logger() -> None:
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter("%(message)s"))
        logger.addHandler(handler)


configure_observability_logger()


def request_id_from_headers(request: Request) -> str:
    incoming = request.headers.get(REQUEST_ID_HEADER)
    if incoming and SAFE_REQUEST_ID_PATTERN.match(incoming):
        return incoming
    return str(uuid4())


def sanitize_log_payload(value: Any) -> Any:
    if isinstance(value, dict):
        sanitized: dict[str, Any] = {}
        for key, nested_value in value.items():
            if SECRET_KEY_PATTERN.search(str(key)):
                sanitized[str(key)] = "[REDACTED]"
            else:
                sanitized[str(key)] = sanitize_log_payload(nested_value)
        return sanitized
    if isinstance(value, list):
        return [sanitize_log_payload(item) for item in value]
    if isinstance(value, tuple):
        return [sanitize_log_payload(item) for item in value]
    return value


def build_observability_event(
    event: str,
    *,
    level: str = "info",
    **fields: Any,
) -> dict[str, Any]:
    request_id = fields.pop("request_id", None) or CURRENT_REQUEST_ID.get()
    payload = {
        "timestamp": datetime.now(UTC).isoformat(),
        "level": level,
        "event": event,
        **fields,
    }
    if request_id:
        payload["request_id"] = request_id
    return sanitize_log_payload(payload)


def log_observability_event(
    event: str,
    *,
    level: int = logging.INFO,
    **fields: Any,
) -> dict[str, Any]:
    payload = build_observability_event(
        event,
        level=logging.getLevelName(level).lower(),
        **fields,
    )
    logger.log(level, json.dumps(payload, ensure_ascii=False, sort_keys=True))
    return payload


def actor_context_from_request(request: Request) -> dict[str, str]:
    context = getattr(request.state, "actor_context", None)
    if not isinstance(context, dict):
        return {}
    return {
        key: value
        for key, value in context.items()
        if key in {"actor_id", "role", "organization_id"} and isinstance(value, str)
    }


async def request_logging_dispatch(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    request_id = request_id_from_headers(request)
    request_id_token = CURRENT_REQUEST_ID.set(request_id)
    request.state.request_id = request_id
    started_at = perf_counter()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception:
        try:
            log_observability_event(
                "api.request.failed",
                level=logging.ERROR,
                request_id=request_id,
                method=request.method,
                path=request.url.path,
                route=getattr(request.scope.get("route"), "path", request.url.path),
                status_code=status_code,
                duration_ms=round((perf_counter() - started_at) * 1000, 2),
                **actor_context_from_request(request),
            )
        finally:
            CURRENT_REQUEST_ID.reset(request_id_token)
        raise

    try:
        response.headers[REQUEST_ID_HEADER] = request_id
        log_observability_event(
            "api.request.completed",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            route=getattr(
                request.scope.get("route"),
                "path",
                request.url.path,
            ),
            status_code=status_code,
            duration_ms=round((perf_counter() - started_at) * 1000, 2),
            **actor_context_from_request(request),
        )
    finally:
        CURRENT_REQUEST_ID.reset(request_id_token)
    return response


def install_request_logging_middleware(app: Any) -> None:
    @app.middleware("http")
    async def request_logging_middleware(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        return await request_logging_dispatch(request, call_next)


__all__ = [
    "OBSERVABILITY_LOGGER_NAME",
    "REQUEST_ID_HEADER",
    "build_observability_event",
    "configure_observability_logger",
    "install_request_logging_middleware",
    "log_observability_event",
    "request_logging_dispatch",
    "request_id_from_headers",
    "sanitize_log_payload",
]
