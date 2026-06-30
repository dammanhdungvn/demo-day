from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

OPENAPI_TAGS = [
    {
        "name": "Health",
        "description": "Runtime health and service metadata.",
    },
    {
        "name": "Auth",
        "description": "Login, session refresh, logout, invite, and current-user APIs.",
    },
    {
        "name": "System",
        "description": "Platform owner APIs for organization bootstrap and first organization Admin invite.",
    },
    {
        "name": "Learning",
        "description": "Teacher courses, class profiles, class membership, and roster APIs.",
    },
    {
        "name": "Knowledge",
        "description": "Document library/contextual uploads, URL ingestion, RAG retrieval, and citation sources.",
    },
    {
        "name": "AI Generation",
        "description": "AI outline, lesson, and block generation APIs with schema validation and grounding.",
    },
    {
        "name": "Lessons",
        "description": "Lesson Studio review, audit, and teacher lesson lifecycle APIs.",
    },
    {
        "name": "Admin",
        "description": "Admin moderation, publish, reject, and review queue APIs.",
    },
    {
        "name": "Teacher",
        "description": "Teacher dashboard and class progress APIs.",
    },
    {
        "name": "Student",
        "description": "Student dashboard, class membership, published lesson, and progress APIs.",
    },
    {
        "name": "Jobs",
        "description": "Generation, ingestion, and re-index job status APIs.",
    },
]

PUBLIC_OPERATIONS = {
    ("GET", "/api/v1/health"),
    ("GET", "/api/v1/auth/demo-accounts"),
    ("POST", "/api/v1/auth/login"),
    ("POST", "/api/v1/auth/refresh"),
    ("POST", "/api/v1/auth/invites/accept"),
}

REQUEST_EXAMPLES: dict[tuple[str, str], dict[str, object]] = {
    ("POST", "/api/v1/auth/login"): {
        "email": "teacher@teachflow.local",
        "password": "teachflow-demo",
    },
    ("POST", "/api/v1/auth/invites/accept"): {
        "invite_code": "invite-code-from-admin",
        "email": "teacher@example.edu",
        "name": "Teacher Example",
        "password": "strong-password",
    },
    ("POST", "/api/v1/auth/invites"): {
        "email": "teacher@example.edu",
        "role": "teacher",
    },
    ("POST", "/api/v1/system/organizations"): {
        "id": "org-training-center",
        "name": "Training Center",
    },
    ("POST", "/api/v1/system/organizations/{organization_id}/admin-invites"): {
        "email": "admin@training-center.edu",
    },
    ("POST", "/api/v1/courses"): {
        "title": "Nhap mon Tri tue nhan tao",
        "description": "Course demo ve AI ung dung.",
        "learning_goals": "Hieu AI agents, RAG va workflow tao bai giang.",
        "teaching_language": "vi",
    },
    ("POST", "/api/v1/rag/retrieve"): {
        "topic": "Transformer Architecture",
        "selected_document_ids": [],
        "top_k": 5,
    },
    ("POST", "/api/v1/outlines/generate"): {
        "course_id": "course-id",
        "class_id": "class-id",
        "selected_document_ids": [],
        "topic": "Transformer Architecture",
        "top_k": 6,
    },
    ("POST", "/api/v1/lessons/{lesson_id}/exports"): {
        "export_format": "pdf",
        "delivery": "print",
        "file_name": "lesson.pdf",
        "client_metadata": {"source": "teacher_workspace"},
    },
    ("POST", "/api/v1/student/lessons/{lesson_id}/tutor"): {
        "question": "Tai sao buoc nay can citation?",
        "block_id": "block-id",
    },
}

PROTECTED_ERROR_RESPONSES = {
    "401": {
        "description": "Missing, malformed, expired, or revoked bearer token.",
        "detail": "Missing or invalid bearer token",
    },
    "403": {
        "description": "Authenticated user does not have the required role, organization, or membership.",
        "detail": "You do not have permission to access this workspace",
    },
}

COMMON_ERROR_RESPONSES = {
    "400": {
        "description": "Request is syntactically valid but violates business rules.",
        "detail": "Request could not be processed",
    },
    "404": {
        "description": "Requested resource was not found or is not visible to this user.",
        "detail": "Resource not found",
    },
    "422": {
        "description": "Request validation failed.",
        "detail": [
            {
                "loc": ["body", "field"],
                "msg": "Field required",
                "type": "missing",
            }
        ],
    },
    "429": {
        "description": "Rate limit exceeded for AI or expensive actions.",
        "detail": {
            "message": "Rate limit exceeded",
            "retry_after_seconds": 60,
        },
    },
}


def _tag_for_path(path: str) -> str:
    if path.endswith("/health"):
        return "Health"
    if "/auth/" in path or path.endswith("/me"):
        return "Auth"
    if path.startswith("/api/v1/system/"):
        return "System"
    if path.endswith("/generation-jobs"):
        return "Jobs"
    if "/admin/" in path:
        return "Admin"
    if "/student/lessons" in path or path.endswith("/student/dashboard"):
        return "Student"
    if path.endswith("/student/classes"):
        return "Student"
    if path.startswith("/api/v1/teacher/") or path.endswith("/teacher/dashboard"):
        return "Teacher"
    if "/documents" in path or "/rag/" in path:
        return "Knowledge"
    if "/outlines" in path or path.endswith("/lessons/generate"):
        return "AI Generation"
    if path.endswith("/regenerate"):
        return "AI Generation"
    if "/lesson-blocks/" in path or "/lessons/" in path:
        return "Lessons"
    if (
        path.endswith("/students")
        or "/courses" in path
        or "/classes/" in path
    ):
        return "Learning"
    return "Health"


def _error_response(status_code: str, payload: dict[str, object]) -> dict[str, object]:
    return {
        "description": str(payload["description"]),
        "content": {
            "application/json": {
                "schema": {"$ref": "#/components/schemas/ErrorResponse"},
                "example": {"detail": payload["detail"]},
            }
        },
    }


def _merge_error_responses(
    operation: dict[str, Any],
    *,
    protected: bool,
) -> None:
    responses = operation.setdefault("responses", {})
    for status_code, payload in COMMON_ERROR_RESPONSES.items():
        responses.setdefault(status_code, _error_response(status_code, payload))
    if protected:
        for status_code, payload in PROTECTED_ERROR_RESPONSES.items():
            responses[status_code] = _error_response(status_code, payload)


def _add_request_example(
    operation: dict[str, Any],
    *,
    method: str,
    path: str,
) -> None:
    example = REQUEST_EXAMPLES.get((method, path))
    if example is None:
        return
    request_body = operation.get("requestBody")
    if not isinstance(request_body, dict):
        return
    content = request_body.get("content")
    if not isinstance(content, dict):
        return
    json_content = content.get("application/json")
    if not isinstance(json_content, dict):
        return
    json_content.setdefault("example", example)


def configure_openapi(app: FastAPI) -> None:
    def custom_openapi() -> dict[str, Any]:
        if app.openapi_schema:
            return app.openapi_schema

        schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
            tags=OPENAPI_TAGS,
        )
        components = schema.setdefault("components", {})
        components.setdefault("schemas", {}).setdefault(
            "ErrorResponse",
            {
                "title": "ErrorResponse",
                "type": "object",
                "properties": {
                    "detail": {
                        "description": "Human-readable error detail or structured validation payload.",
                    }
                },
                "required": ["detail"],
            },
        )
        components.setdefault("securitySchemes", {})["BearerAuth"] = {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Send the access token as: Bearer <token>.",
        }

        for path, path_payload in schema.get("paths", {}).items():
            for method, operation in path_payload.items():
                method_upper = method.upper()
                if method_upper not in {"GET", "POST", "PUT", "PATCH", "DELETE"}:
                    continue

                protected = (method_upper, path) not in PUBLIC_OPERATIONS
                operation["tags"] = [_tag_for_path(path)]
                if protected:
                    operation["security"] = [{"BearerAuth": []}]
                else:
                    operation.pop("security", None)

                _merge_error_responses(operation, protected=protected)
                _add_request_example(operation, method=method_upper, path=path)

        app.openapi_schema = schema
        return app.openapi_schema

    app.openapi = custom_openapi  # type: ignore[method-assign]


__all__ = ["OPENAPI_TAGS", "configure_openapi"]
