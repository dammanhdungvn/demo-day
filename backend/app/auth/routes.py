from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Header

from app.core.config import API_BASE_PATH

from .dependencies import get_current_user, require_roles
from .schemas import (
    AcceptInviteRequest,
    DemoLoginRequest,
    InviteCreateRequest,
    LoginRequest,
    LoginResponse,
    MessageResponse,
    OrganizationInviteResponse,
    PublicDemoAccount,
    RefreshSessionRequest,
    UserProfile,
)
from .services import (
    accept_user_invite,
    authenticate_demo_account,
    authenticate_user,
    create_user_invite,
    list_public_demo_accounts,
    list_user_invites,
    logout_user_from_authorization,
    refresh_auth_session,
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


@router.get("/me", response_model=UserProfile)
def me(
    current_user: Annotated[UserProfile, Depends(get_current_user)],
) -> UserProfile:
    return current_user
