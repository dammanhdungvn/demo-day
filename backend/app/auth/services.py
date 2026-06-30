from __future__ import annotations

from datetime import datetime, timezone
from secrets import token_urlsafe
from typing import Literal

from fastapi import HTTPException, status

from app.core.config import _database_conninfo, _env_bool, _env_value
from app.core.errors import _auth_error, _extract_bearer_token

from .demo import DEMO_ACCOUNTS, DEMO_ACCOUNTS_BY_EMAIL
from .ports import AuthRepository, SupabaseAuthClient
from .repositories import InMemoryAuthRepository, PostgresAuthRepository
from .schemas import (
    AcceptInviteRequest,
    AuthProfileRecord,
    DemoLoginRequest,
    InviteCreateRequest,
    LoginRequest,
    LoginResponse,
    MessageResponse,
    OrganizationInviteResponse,
    PublicDemoAccount,
    RefreshSessionRequest,
    Role,
    SupabaseAuthUser,
    UserProfile,
)
from .supabase_client import SupabaseAuthRestClient

ACTIVE_DEMO_SESSIONS: dict[str, UserProfile] = {}
REGISTERED_DEMO_ACCOUNTS: dict[str, tuple[UserProfile, str]] = {}
MEMORY_AUTH_REPOSITORY = InMemoryAuthRepository()


def is_demo_login_enabled() -> bool:
    return _env_bool("ENABLE_DEMO_LOGIN", False)


def list_public_demo_accounts() -> list[PublicDemoAccount]:
    if not is_demo_login_enabled():
        return []
    return [account.public for account in DEMO_ACCOUNTS]


def reset_demo_sessions_for_tests() -> None:
    ACTIVE_DEMO_SESSIONS.clear()
    REGISTERED_DEMO_ACCOUNTS.clear()


def create_session_token(user: UserProfile) -> str:
    token = token_urlsafe(32)
    ACTIVE_DEMO_SESSIONS[token] = user
    return token


def get_auth_provider_mode() -> Literal["demo", "supabase"]:
    mode = (_env_value("AUTH_PROVIDER") or "demo").strip().lower()
    if mode in {"demo", "supabase"}:
        return mode
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="AUTH_PROVIDER must be either 'demo' or 'supabase'",
    )


def get_auth_repository(*, ensure_schema: bool = True) -> AuthRepository:
    mode = (
        _env_value("AUTH_REPOSITORY")
        or _env_value("LEARNING_REPOSITORY")
        or "memory"
    ).strip().lower()
    if mode == "memory":
        return MEMORY_AUTH_REPOSITORY
    if mode == "postgres":
        repository = PostgresAuthRepository(_database_conninfo())
        if ensure_schema:
            repository.ensure_schema()
        return repository
    raise RuntimeError("AUTH_REPOSITORY must be either 'memory' or 'postgres'")


def get_supabase_auth_client() -> SupabaseAuthClient:
    project_url = _env_value("URL_SUPABASE")
    anon_key = _env_value("PUBLIC_API_KEY_SUPABASE")
    missing = [
        name
        for name, value in {
            "URL_SUPABASE": project_url,
            "PUBLIC_API_KEY_SUPABASE": anon_key,
        }.items()
        if not value or value.startswith("replace-with-")
    ]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Supabase Auth is not configured: {', '.join(missing)}",
        )
    return SupabaseAuthRestClient(project_url=project_url, anon_key=anon_key)


def authenticate_demo_user(credentials: LoginRequest) -> LoginResponse:
    normalized_email = credentials.email.strip().lower()
    account = DEMO_ACCOUNTS_BY_EMAIL.get(normalized_email)
    if account is None or credentials.password != account.password:
        registered_account = REGISTERED_DEMO_ACCOUNTS.get(normalized_email)
        if (
            registered_account is None
            or credentials.password != registered_account[1]
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid demo account credentials",
            )
        user = registered_account[0]
        return LoginResponse(access_token=create_session_token(user), user=user)

    user = UserProfile(**account.public.model_dump(exclude={"label"}))
    return LoginResponse(access_token=create_session_token(user), user=user)


def authenticate_demo_account(payload: DemoLoginRequest) -> LoginResponse:
    if not is_demo_login_enabled():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo login is disabled",
        )

    account = next(
        (
            candidate
            for candidate in DEMO_ACCOUNTS
            if candidate.public.id == payload.account_id
        ),
        None,
    )
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo account not found",
        )

    user = UserProfile(**account.public.model_dump(exclude={"label"}))
    return LoginResponse(access_token=create_session_token(user), user=user)


def _public_profile(profile: AuthProfileRecord) -> UserProfile:
    return UserProfile(
        id=profile.id,
        email=profile.email,
        name=profile.name,
        role=profile.role,
        organization_id=profile.organization_id,
    )


def _ensure_active_profile(profile: AuthProfileRecord) -> None:
    if profile.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User profile is disabled",
        )


def _profile_for_supabase_user(
    auth_user: SupabaseAuthUser,
    auth_repository: AuthRepository,
) -> AuthProfileRecord:
    profile = auth_repository.get_profile(auth_user.id)
    if profile is None and auth_user.email:
        profile = auth_repository.get_profile_by_email(auth_user.email)

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User profile is not provisioned",
        )

    _ensure_active_profile(profile)
    return profile


def _parse_iso_datetime(value: str) -> datetime:
    normalized = value.strip().replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _is_expired(expires_at: str | None) -> bool:
    if not expires_at:
        return False
    return _parse_iso_datetime(expires_at) <= datetime.now(timezone.utc)


def authenticate_user(
    credentials: LoginRequest,
    auth_repository: AuthRepository | None = None,
    supabase_client: SupabaseAuthClient | None = None,
) -> LoginResponse:
    if get_auth_provider_mode() == "demo":
        return authenticate_demo_user(credentials)

    repository = auth_repository or get_auth_repository()
    client = supabase_client or get_supabase_auth_client()
    session = client.sign_in_with_password(credentials)
    profile = _profile_for_supabase_user(session.user, repository)
    return LoginResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_in=session.expires_in,
        user=_public_profile(profile),
    )


def refresh_auth_session(
    payload: RefreshSessionRequest,
    auth_repository: AuthRepository | None = None,
    supabase_client: SupabaseAuthClient | None = None,
) -> LoginResponse:
    if get_auth_provider_mode() != "supabase":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session refresh is only available for Supabase auth",
        )

    repository = auth_repository or get_auth_repository()
    client = supabase_client or get_supabase_auth_client()
    session = client.refresh_session(payload.refresh_token)
    profile = _profile_for_supabase_user(session.user, repository)
    return LoginResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_in=session.expires_in,
        user=_public_profile(profile),
    )


def get_current_user_from_authorization(
    authorization: str | None,
    auth_repository: AuthRepository | None = None,
    supabase_client: SupabaseAuthClient | None = None,
) -> UserProfile:
    token = _extract_bearer_token(authorization)
    if is_demo_login_enabled():
        demo_user = ACTIVE_DEMO_SESSIONS.get(token)
        if demo_user is not None:
            return demo_user

    if get_auth_provider_mode() == "supabase":
        repository = auth_repository or get_auth_repository()
        client = supabase_client or get_supabase_auth_client()
        auth_user = client.get_user(token)
        profile = _profile_for_supabase_user(auth_user, repository)
        return _public_profile(profile)

    user = ACTIVE_DEMO_SESSIONS.get(token)
    if user is None:
        raise _auth_error()

    return user


def logout_user_from_authorization(
    authorization: str | None,
    supabase_client: SupabaseAuthClient | None = None,
) -> MessageResponse:
    token = _extract_bearer_token(authorization)
    if token in ACTIVE_DEMO_SESSIONS:
        ACTIVE_DEMO_SESSIONS.pop(token)
        return MessageResponse(message="Logged out")

    if get_auth_provider_mode() == "supabase":
        client = supabase_client or get_supabase_auth_client()
        client.logout(token)
        return MessageResponse(message="Logged out")

    raise _auth_error()


def _normalize_invite_email(email: str) -> str:
    normalized_email = email.strip().lower()
    if "@" not in normalized_email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invite email must be valid",
        )
    return normalized_email


def _require_invite_admin(user: UserProfile) -> AuthProfileRecord:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can manage organization invites",
        )
    if not user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user is not assigned to an organization",
        )
    return AuthProfileRecord(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        organization_id=user.organization_id,
        auth_provider=(
            "demo"
            if any(account.public.id == user.id for account in DEMO_ACCOUNTS)
            else get_auth_provider_mode()
        ),
    )


def create_user_invite(
    payload: InviteCreateRequest,
    current_user: UserProfile,
    auth_repository: AuthRepository | None = None,
) -> OrganizationInviteResponse:
    admin = _require_invite_admin(current_user)
    if payload.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin invites are not enabled in this flow",
        )
    repository = auth_repository or get_auth_repository()
    repository.upsert_profile(admin)
    return repository.create_invite(
        email=_normalize_invite_email(payload.email),
        role=payload.role,
        organization_id=admin.organization_id,
        invited_by=admin.id,
    )


def accept_user_invite(
    payload: AcceptInviteRequest,
    auth_repository: AuthRepository | None = None,
    supabase_client: SupabaseAuthClient | None = None,
) -> LoginResponse:
    repository = auth_repository or get_auth_repository()
    normalized_email = _normalize_invite_email(payload.email)
    invite = repository.get_invite_by_code(payload.invite_code)
    if invite is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite was not found",
        )
    if invite.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite is no longer pending",
        )
    if _is_expired(invite.expires_at):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite has expired",
        )
    if normalized_email != invite.email.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invite email does not match",
        )

    existing_profile = repository.get_profile_by_email(normalized_email)
    if existing_profile is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A profile already exists for this email",
        )

    accepted_at = datetime.now(timezone.utc).isoformat()
    provider = get_auth_provider_mode()
    if provider == "supabase":
        client = supabase_client or get_supabase_auth_client()
        session = client.sign_up_with_password(
            payload.model_copy(update={"email": normalized_email})
        )
        if session.user.email and session.user.email.lower() != normalized_email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supabase signup email does not match invite",
            )
        profile = AuthProfileRecord(
            id=session.user.id,
            email=normalized_email,
            name=payload.name.strip(),
            role=invite.role,
            organization_id=invite.organization_id,
            auth_provider="supabase",
            status="active",
        )
        repository.accept_invite(
            invite_id=invite.id,
            profile=profile,
            accepted_at=accepted_at,
        )
        return LoginResponse(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            expires_in=session.expires_in,
            user=_public_profile(profile),
        )

    profile = AuthProfileRecord(
        id=f"accepted-{invite.id}",
        email=normalized_email,
        name=payload.name.strip(),
        role=invite.role,
        organization_id=invite.organization_id,
        auth_provider="demo",
        status="active",
    )
    repository.accept_invite(
        invite_id=invite.id,
        profile=profile,
        accepted_at=accepted_at,
    )
    user = _public_profile(profile)
    REGISTERED_DEMO_ACCOUNTS[normalized_email] = (user, payload.password)
    return LoginResponse(access_token=create_session_token(user), user=user)


def list_user_invites(
    current_user: UserProfile,
    auth_repository: AuthRepository | None = None,
) -> list[OrganizationInviteResponse]:
    admin = _require_invite_admin(current_user)
    repository = auth_repository or get_auth_repository()
    return repository.list_invites(organization_id=admin.organization_id)


def require_role(user: UserProfile, allowed_roles: set[Role]) -> UserProfile:
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this workspace",
        )

    return user
