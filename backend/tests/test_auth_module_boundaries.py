from typing import get_args

import pytest
from fastapi import HTTPException
from fastapi.routing import APIRoute

from app.auth.dependencies import (
    get_current_user as dependency_get_current_user,
    require_roles as dependency_require_roles,
)
from app.auth.ports import AuthRepository, SupabaseAuthClient
from app.auth.repositories import (
    InMemoryAuthRepository,
    PostgresAuthRepository,
    auth_schema_sql,
)
from app.auth.schemas import (
    AuthProfileRecord,
    LoginRequest,
    LoginResponse,
    Role,
    SupabaseAuthSession,
    SupabaseAuthUser,
    UserProfile,
)
from app.auth.services import (
    authenticate_demo_user as service_authenticate_demo_user,
    get_current_user_from_authorization as service_get_current_user_from_authorization,
    logout_user_from_authorization as service_logout_user_from_authorization,
    reset_demo_sessions_for_tests as service_reset_demo_sessions_for_tests,
    require_role as service_require_role,
)
from app.auth.routes import router as auth_router
from app.auth.supabase_client import SupabaseAuthRestClient
from main import app
from main import authenticate_demo_user as MainAuthenticateDemoUser
from main import get_current_user as MainGetCurrentUserDependency
from main import get_current_user_from_authorization as MainGetCurrentUser
from main import InMemoryAuthRepository as MainInMemoryAuthRepository
from main import LoginRequest as MainLoginRequest
from main import PostgresAuthRepository as MainPostgresAuthRepository
from main import require_role as MainRequireRole
from main import require_roles as MainRequireRoles
from main import SupabaseAuthRestClient as MainSupabaseAuthRestClient
from main import UserProfile as MainUserProfile


def test_auth_schema_module_exports_role_and_user_models() -> None:
    assert set(get_args(Role)) == {"admin", "teacher", "student"}

    user = UserProfile(
        id="teacher-1",
        email="teacher@example.edu",
        name="Teacher",
        role="teacher",
        organization_id="org-demo",
    )

    assert user.role == "teacher"
    assert MainUserProfile is UserProfile


def test_auth_schema_module_exports_login_and_supabase_payloads() -> None:
    credentials = LoginRequest(email="teacher@example.edu", password="secret")
    auth_user = SupabaseAuthUser(
        id="auth-user-1",
        email="teacher@example.edu",
        name="Teacher",
    )
    session = SupabaseAuthSession(
        access_token="access-token",
        refresh_token="refresh-token",
        expires_in=3600,
        user=auth_user,
    )
    profile = AuthProfileRecord(
        id=auth_user.id,
        email=auth_user.email,
        name=auth_user.name or "Teacher",
        role="teacher",
        organization_id="org-demo",
        auth_provider="supabase",
    )
    response = LoginResponse(access_token=session.access_token, user=profile)

    assert credentials.email == "teacher@example.edu"
    assert response.user.organization_id == "org-demo"
    assert MainLoginRequest is LoginRequest


def test_auth_ports_module_exports_protocol_contracts() -> None:
    assert hasattr(SupabaseAuthClient, "sign_in_with_password")
    assert hasattr(SupabaseAuthClient, "refresh_session")
    assert hasattr(SupabaseAuthClient, "get_user")
    assert hasattr(SupabaseAuthClient, "logout")
    assert hasattr(AuthRepository, "get_profile")
    assert hasattr(AuthRepository, "list_profiles")
    assert hasattr(AuthRepository, "create_invite")


def test_auth_repository_module_exports_adapters_and_schema_sql() -> None:
    repository = InMemoryAuthRepository()

    invite = repository.create_invite(
        email="Student@Example.edu",
        role="student",
        organization_id="org-demo",
        invited_by="admin-1",
    )
    duplicate = repository.create_invite(
        email="student@example.edu",
        role="student",
        organization_id="org-demo",
        invited_by="admin-1",
    )

    assert invite.id == duplicate.id
    assert invite.email == "student@example.edu"
    assert [
        profile.email for profile in repository.list_profiles(role="student")
    ] == ["student@teachflow.local"]
    assert "create table if not exists profiles" in auth_schema_sql()
    assert "create table if not exists organization_invites" in auth_schema_sql()
    assert MainInMemoryAuthRepository is InMemoryAuthRepository
    assert MainPostgresAuthRepository is PostgresAuthRepository


def test_supabase_auth_client_module_keeps_main_compatibility_export() -> None:
    client = SupabaseAuthRestClient(
        project_url="https://example.supabase.co/",
        anon_key="anon-key",
    )

    assert client.project_url == "https://example.supabase.co"
    assert MainSupabaseAuthRestClient is SupabaseAuthRestClient


def test_auth_services_module_keeps_session_and_main_compatibility() -> None:
    service_reset_demo_sessions_for_tests()
    session = service_authenticate_demo_user(
        LoginRequest(email="teacher@teachflow.local", password="teachflow-demo")
    )

    current_user = service_get_current_user_from_authorization(
        f"Bearer {session.access_token}"
    )
    logout_response = service_logout_user_from_authorization(
        f"Bearer {session.access_token}"
    )

    assert current_user.id == session.user.id
    assert logout_response.message == "Logged out"
    with pytest.raises(HTTPException) as exc_info:
        service_get_current_user_from_authorization(f"Bearer {session.access_token}")
    assert exc_info.value.status_code == 401
    assert service_require_role(current_user, {"teacher"}).id == current_user.id
    assert MainAuthenticateDemoUser is service_authenticate_demo_user
    assert MainGetCurrentUser is service_get_current_user_from_authorization
    assert MainRequireRole is service_require_role


def test_auth_dependencies_module_keeps_main_compatibility_export() -> None:
    teacher = UserProfile(
        id="teacher-1",
        email="teacher@example.edu",
        name="Teacher",
        role="teacher",
        organization_id="org-demo",
    )
    student = UserProfile(
        id="student-1",
        email="student@example.edu",
        name="Student",
        role="student",
        organization_id="org-demo",
    )
    dependency = dependency_require_roles("teacher")

    assert dependency(teacher).id == "teacher-1"
    with pytest.raises(HTTPException) as exc_info:
        dependency(student)
    assert exc_info.value.status_code == 403
    assert MainGetCurrentUserDependency is dependency_get_current_user
    assert MainRequireRoles is dependency_require_roles


def test_auth_routes_module_registers_expected_paths_on_main_app() -> None:
    expected_routes = {
        "/api/v1/auth/demo-accounts": {"GET"},
        "/api/v1/auth/login": {"POST"},
        "/api/v1/auth/refresh": {"POST"},
        "/api/v1/auth/logout": {"POST"},
        "/api/v1/auth/invites": {"GET", "POST"},
        "/api/v1/me": {"GET"},
    }
    router_routes = [
        route for route in auth_router.routes if isinstance(route, APIRoute)
    ]
    for path, methods in expected_routes.items():
        router_methods = {
            method
            for route in router_routes
            if route.path == path
            for method in route.methods
        }
        assert methods <= router_methods

    assert any(
        getattr(route, "original_router", None) is auth_router
        for route in app.routes
    )
