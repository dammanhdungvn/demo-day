from __future__ import annotations

from typing import Any

from main import app


def openapi_spec() -> dict[str, Any]:
    app.openapi_schema = None
    return app.openapi()


def operation(
    spec: dict[str, Any],
    path: str,
    method: str,
) -> dict[str, Any]:
    return spec["paths"][path][method.lower()]


def test_openapi_metadata_tags_and_docs_paths_are_configured() -> None:
    spec = openapi_spec()
    tag_names = {tag["name"] for tag in spec["tags"]}

    assert spec["info"]["title"] == "TeachFlow AI API"
    assert app.docs_url == "/api/v1/docs"
    assert app.openapi_url == "/api/v1/openapi.json"
    assert {
        "Health",
        "Auth",
        "System",
        "Learning",
        "Knowledge",
        "AI Generation",
        "Lessons",
        "Admin",
        "Student",
        "Jobs",
    } <= tag_names


def test_openapi_bearer_auth_scheme_and_endpoint_security() -> None:
    spec = openapi_spec()

    assert spec["components"]["securitySchemes"]["BearerAuth"] == {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Send the access token as: Bearer <token>.",
    }

    public_operations = [
        ("/api/v1/health", "get"),
        ("/api/v1/auth/demo-accounts", "get"),
        ("/api/v1/auth/login", "post"),
        ("/api/v1/auth/refresh", "post"),
        ("/api/v1/auth/invites/accept", "post"),
    ]
    for path, method in public_operations:
        assert "security" not in operation(spec, path, method)

    protected_operations = [
        ("/api/v1/me", "get"),
        ("/api/v1/auth/logout", "post"),
        ("/api/v1/auth/invites", "get"),
        ("/api/v1/auth/invites", "post"),
        ("/api/v1/auth/users/bulk-status", "patch"),
        ("/api/v1/auth/users/bulk-password-reset", "post"),
        ("/api/v1/system/dashboard", "get"),
        ("/api/v1/system/organizations", "get"),
        ("/api/v1/system/organizations", "post"),
        ("/api/v1/system/organizations/{organization_id}/admin-invites", "post"),
        ("/api/v1/courses", "get"),
        ("/api/v1/courses", "post"),
        ("/api/v1/documents", "get"),
        ("/api/v1/documents/upload", "post"),
        ("/api/v1/rag/retrieve", "post"),
        ("/api/v1/outlines/generate", "post"),
        ("/api/v1/lessons/{lesson_id}/exports", "get"),
        ("/api/v1/lessons/{lesson_id}/exports", "post"),
        ("/api/v1/admin/lesson-library", "get"),
        ("/api/v1/admin/reports", "get"),
        ("/api/v1/admin/activity", "get"),
        ("/api/v1/admin/settings", "get"),
        ("/api/v1/admin/settings", "patch"),
        ("/api/v1/student/lessons", "get"),
        ("/api/v1/generation-jobs", "get"),
        ("/api/v1/generation-jobs/{job_id}/retry", "post"),
        ("/api/v1/generation-jobs/{job_id}/cancel", "post"),
    ]
    for path, method in protected_operations:
        assert operation(spec, path, method)["security"] == [{"BearerAuth": []}]


def test_openapi_tags_key_paths_and_operation_ids_are_stable() -> None:
    spec = openapi_spec()
    expected_tags = {
        ("/api/v1/health", "get"): "Health",
        ("/api/v1/auth/login", "post"): "Auth",
        ("/api/v1/auth/invites/accept", "post"): "Auth",
        ("/api/v1/auth/users/bulk-status", "patch"): "Auth",
        ("/api/v1/auth/users/bulk-password-reset", "post"): "Auth",
        ("/api/v1/system/organizations", "post"): "System",
        (
            "/api/v1/system/organizations/{organization_id}/admin-invites",
            "post",
        ): "System",
        ("/api/v1/courses", "post"): "Learning",
        ("/api/v1/documents", "get"): "Knowledge",
        ("/api/v1/rag/retrieve", "post"): "Knowledge",
        ("/api/v1/outlines/generate", "post"): "AI Generation",
        ("/api/v1/lessons/generate", "post"): "AI Generation",
        ("/api/v1/lessons/{lesson_id}/exports", "post"): "Lessons",
        ("/api/v1/lesson-blocks/{block_id}/status", "post"): "Lessons",
        ("/api/v1/admin/lesson-library", "get"): "Admin",
        ("/api/v1/admin/reports", "get"): "Admin",
        ("/api/v1/admin/activity", "get"): "Admin",
        ("/api/v1/admin/settings", "get"): "Admin",
        ("/api/v1/admin/settings", "patch"): "Admin",
        ("/api/v1/admin/review-queue", "get"): "Admin",
        ("/api/v1/student/lessons", "get"): "Student",
        ("/api/v1/generation-jobs", "get"): "Jobs",
        ("/api/v1/generation-jobs/{job_id}/retry", "post"): "Jobs",
        ("/api/v1/generation-jobs/{job_id}/cancel", "post"): "Jobs",
    }
    for (path, method), tag in expected_tags.items():
        assert operation(spec, path, method)["tags"] == [tag]

    operation_ids = [
        operation_payload["operationId"]
        for path_payload in spec["paths"].values()
        for operation_payload in path_payload.values()
    ]
    assert len(operation_ids) == len(set(operation_ids))


def test_openapi_primary_examples_and_error_responses_are_documented() -> None:
    spec = openapi_spec()
    login_request = operation(spec, "/api/v1/auth/login", "post")["requestBody"]
    create_course_request = operation(spec, "/api/v1/courses", "post")["requestBody"]
    create_system_org_request = operation(
        spec,
        "/api/v1/system/organizations",
        "post",
    )["requestBody"]
    accept_invite_request = operation(
        spec,
        "/api/v1/auth/invites/accept",
        "post",
    )["requestBody"]
    documents_get = operation(spec, "/api/v1/documents", "get")

    assert login_request["content"]["application/json"]["example"] == {
        "email": "teacher@teachflow.local",
        "password": "teachflow-demo",
    }
    assert accept_invite_request["content"]["application/json"]["example"] == {
        "invite_code": "invite-code-from-admin",
        "email": "teacher@example.edu",
        "name": "Teacher Example",
        "password": "strong-password",
    }
    create_course_example = create_course_request["content"]["application/json"][
        "example"
    ]
    assert "learning_goals" in create_course_example
    assert "learning_objectives" not in create_course_example
    assert create_system_org_request["content"]["application/json"]["example"] == {
        "id": "org-training-center",
        "name": "Training Center",
    }
    assert {"401", "403", "422"} <= set(documents_get["responses"])
    assert (
        documents_get["responses"]["403"]["content"]["application/json"]["example"][
            "detail"
        ]
        == "You do not have permission to access this workspace"
    )
