from datetime import datetime
from types import SimpleNamespace

import pytest
from fastapi import HTTPException, status

from app.core.errors import (
    _auth_error,
    _extract_bearer_token,
    _not_found,
    _safe_generation_job_error,
)
from app.core.security import (
    _entity_organization_id,
    _same_organization,
    _user_organization_id,
)
from app.core.time import _now_iso


def test_now_iso_returns_timezone_aware_timestamp() -> None:
    timestamp = _now_iso()

    parsed = datetime.fromisoformat(timestamp)

    assert parsed.tzinfo is not None


def test_common_http_error_helpers_preserve_status_and_detail() -> None:
    not_found = _not_found("Lesson not found")
    auth_error = _auth_error()

    assert not_found.status_code == status.HTTP_404_NOT_FOUND
    assert not_found.detail == "Lesson not found"
    assert auth_error.status_code == status.HTTP_401_UNAUTHORIZED
    assert auth_error.detail == "Authentication required"
    assert auth_error.headers == {"WWW-Authenticate": "Bearer"}


def test_extract_bearer_token_requires_valid_bearer_scheme() -> None:
    assert _extract_bearer_token("Bearer token-123") == "token-123"

    with pytest.raises(HTTPException) as missing_error:
        _extract_bearer_token(None)
    with pytest.raises(HTTPException) as invalid_error:
        _extract_bearer_token("Basic token-123")

    assert missing_error.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert invalid_error.value.status_code == status.HTTP_401_UNAUTHORIZED


def test_safe_generation_job_error_does_not_leak_unexpected_exception_detail() -> None:
    structured_error = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={"message": "Rate limit exceeded"},
    )

    assert _safe_generation_job_error(structured_error) == '{"message": "Rate limit exceeded"}'
    assert _safe_generation_job_error(RuntimeError("secret stack detail")) == (
        "Unexpected AI generation error"
    )


def test_organization_helpers_keep_demo_fallback() -> None:
    demo_user = SimpleNamespace(organization_id=None)
    tenant_user = SimpleNamespace(organization_id="org-tenant")

    assert _user_organization_id(demo_user) == "org-demo"
    assert _entity_organization_id(None) == "org-demo"
    assert _same_organization(None, demo_user) is True
    assert _same_organization("org-tenant", tenant_user) is True
    assert _same_organization("org-other", tenant_user) is False
