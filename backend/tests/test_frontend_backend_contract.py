from __future__ import annotations

from pathlib import Path
import re

from main import app


REPO_ROOT = Path(__file__).resolve().parents[2]
FRONTEND_API_FILES = (
    REPO_ROOT / "frontend/src/api/auth.ts",
    REPO_ROOT / "frontend/src/api/health.ts",
    REPO_ROOT / "frontend/src/api/learning.ts",
)
API_BASE_PATH = "/api/v1"

BUILD_API_URL_RE = re.compile(
    r"buildApiUrl\(\s*"
    r"(?P<expression>"
    r"'[^']+'|"
    r'"[^"]+"|'
    r"`[^`]+`|"
    r"roleDashboardPath\(role\)|"
    r"path"
    r")\s*,",
    re.DOTALL,
)


def normalize_frontend_path(expression: str) -> list[str]:
    if expression == "roleDashboardPath(role)":
        return [
            "/system/dashboard",
            "/admin/dashboard",
            "/teacher/dashboard",
            "/student/dashboard",
        ]
    if expression == "path":
        return ["/auth/users"]

    path = expression[1:-1]
    path = re.sub(r"\$\{[^}]+\}", "{param}", path)
    path = path.split("?", 1)[0]
    return [path]


def openapi_path_matches(frontend_path: str, backend_paths: set[str]) -> bool:
    full_path = (
        frontend_path
        if frontend_path.startswith(API_BASE_PATH)
        else f"{API_BASE_PATH}{frontend_path}"
    )
    if full_path in backend_paths:
        return True

    frontend_pattern = re.sub(r"\{param\}", "{}", full_path)
    return any(
        frontend_pattern == re.sub(r"\{[^}]+}", "{}", backend_path)
        for backend_path in backend_paths
    )


def frontend_api_paths() -> set[tuple[str, str]]:
    paths: set[tuple[str, str]] = set()
    for file_path in FRONTEND_API_FILES:
        source = file_path.read_text()
        for match in BUILD_API_URL_RE.finditer(source):
            for frontend_path in normalize_frontend_path(match.group("expression")):
                paths.add((str(file_path.relative_to(REPO_ROOT)), frontend_path))
    return paths


def test_frontend_api_paths_have_backend_openapi_routes() -> None:
    backend_paths = set(app.openapi()["paths"])
    missing = [
        f"{file_path}: {frontend_path}"
        for file_path, frontend_path in sorted(frontend_api_paths())
        if not openapi_path_matches(frontend_path, backend_paths)
    ]

    assert missing == []
