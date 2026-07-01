from __future__ import annotations

import json

from fastapi import HTTPException, status


def _not_found(message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)


def _auth_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise _auth_error()

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise _auth_error()

    return token.strip()


def _safe_generation_job_error(error: Exception) -> str:
    if isinstance(error, HTTPException):
        detail = error.detail
        if isinstance(detail, str):
            return detail
        try:
            return json.dumps(detail, ensure_ascii=False)
        except TypeError:
            return "Request failed during AI generation"
    return "Unexpected AI generation error"
