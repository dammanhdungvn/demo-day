from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Header, Query

from app.core.config import API_BASE_PATH

from .dependencies import get_current_user, require_roles
from .schemas import (
    AcceptInviteRequest,
    AuthOrganizationResponse,
    DemoLoginRequest,
    InviteCreateRequest,
    LoginRequest,
    LoginResponse,
    ManagedUserResponse,
    ManagedUserRole,
    ManagedUserUpdateRequest,
    MessageResponse,
    OrganizationInviteResponse,
    ProfileStatus,
    PublicDemoAccount,
    RefreshSessionRequest,
    SystemAdminInviteCreateRequest,
    SystemOrganizationCreateRequest,
    UserProfile,
)
from .services import (
    accept_user_invite,
    authenticate_demo_account,
    authenticate_user,
    create_system_admin_invite,
    create_system_organization,
    create_user_invite,
    list_managed_users,
    list_system_organizations,
    list_public_demo_accounts,
    list_user_invites,
    logout_user_from_authorization,
    refresh_auth_session,
    update_managed_user,
)

router = APIRouter(prefix=API_BASE_PATH)


@router.get(
    "/auth/demo-accounts",
    response_model=list[PublicDemoAccount],
)
def demo_accounts() -> list[PublicDemoAccount]:
    return list_public_demo_accounts()


@router.post("/auth/demo-login", response_model=LoginResponse)
def demo_login(payload: DemoLoginRequest) -> LoginResponse:
    return authenticate_demo_account(payload)


@router.post("/auth/login", response_model=LoginResponse)
def login(credentials: LoginRequest) -> LoginResponse:
    return authenticate_user(credentials)


@router.post("/auth/refresh", response_model=LoginResponse)
def refresh_session(payload: RefreshSessionRequest) -> LoginResponse:
    return refresh_auth_session(payload)


@router.post("/auth/logout", response_model=MessageResponse)
def logout(
    authorization: Annotated[str | None, Header()] = None,
) -> MessageResponse:
    return logout_user_from_authorization(authorization)


@router.post("/auth/invites/accept", response_model=LoginResponse)
def accept_auth_invite(payload: AcceptInviteRequest) -> LoginResponse:
    return accept_user_invite(payload)


@router.get(
    "/auth/invites",
    response_model=list[OrganizationInviteResponse],
)
def auth_invites(
    current_user: Annotated[UserProfile, Depends(require_roles("admin"))],
) -> list[OrganizationInviteResponse]:
    return list_user_invites(current_user)


@router.post(
    "/auth/invites",
    response_model=OrganizationInviteResponse,
)
def create_auth_invite(
    payload: InviteCreateRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("admin"))],
) -> OrganizationInviteResponse:
    return create_user_invite(payload, current_user)


@router.get(
    "/auth/users",
    response_model=list[ManagedUserResponse],
)
def auth_managed_users(
    current_user: Annotated[UserProfile, Depends(require_roles("admin"))],
    role: ManagedUserRole | None = None,
    status_filter: Annotated[
        ProfileStatus | None,
        Query(alias="status"),
    ] = None,
) -> list[ManagedUserResponse]:
    return list_managed_users(
        current_user,
        role_filter=role,
        status_filter=status_filter,
    )


@router.patch(
    "/auth/users/{profile_id}",
    response_model=ManagedUserResponse,
)
def update_auth_managed_user(
    profile_id: str,
    payload: ManagedUserUpdateRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("admin"))],
) -> ManagedUserResponse:
    return update_managed_user(profile_id, payload, current_user)


@router.get(
    "/system/organizations",
    response_model=list[AuthOrganizationResponse],
)
def system_organizations(
    current_user: Annotated[UserProfile, Depends(require_roles("system_admin"))],
) -> list[AuthOrganizationResponse]:
    return list_system_organizations(current_user)


@router.post(
    "/system/organizations",
    response_model=AuthOrganizationResponse,
)
def create_system_organization_route(
    payload: SystemOrganizationCreateRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("system_admin"))],
) -> AuthOrganizationResponse:
    return create_system_organization(payload, current_user)


@router.post(
    "/system/organizations/{organization_id}/admin-invites",
    response_model=OrganizationInviteResponse,
)
def create_system_organization_admin_invite(
    organization_id: str,
    payload: SystemAdminInviteCreateRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("system_admin"))],
) -> OrganizationInviteResponse:
    return create_system_admin_invite(organization_id, payload, current_user)


@router.get("/me", response_model=UserProfile)
def me(
    current_user: Annotated[UserProfile, Depends(get_current_user)],
) -> UserProfile:
    return current_user
