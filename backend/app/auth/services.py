from __future__ import annotations

from datetime import datetime, timezone
import re
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
    AuthOrganizationResponse,
    AuthProfileRecord,
    DemoLoginRequest,
    InviteCreateRequest,
    LoginRequest,
    LoginResponse,
    ManagedUserResponse,
    ManagedUserRole,
    ManagedUserStatusUpdateRequest,
    ManagedUserUpdateRequest,
    MessageResponse,
    OrganizationInviteResponse,
    ProfileStatus,
    PublicDemoAccount,
    RefreshSessionRequest,
    Role,
    SystemAdminInviteCreateRequest,
    SystemOrganizationCreateRequest,
    SupabaseAuthUser,
    UserProfile,
)
from .supabase_client import SupabaseAuthRestClient

ACTIVE_DEMO_SESSIONS: dict[str, UserProfile] = {}
REGISTERED_DEMO_ACCOUNTS: dict[str, tuple[UserProfile, str]] = {}
MEMORY_AUTH_REPOSITORY = InMemoryAuthRepository()
SYSTEM_ADMIN_ORGANIZATION_ID = "org-platform"
SYSTEM_ADMIN_ORGANIZATION_NAME = "TeachFlow Platform"


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


def _env_csv(name: str) -> set[str]:
    raw_value = _env_value(name) or ""
    return {
        item.strip().lower()
        for item in raw_value.split(",")
        if item.strip()
    }


def _configured_system_admin_organization() -> AuthOrganizationResponse:
    organization_id = (
        _env_value("SYSTEM_ADMIN_ORGANIZATION_ID")
        or SYSTEM_ADMIN_ORGANIZATION_ID
    ).strip()
    organization_name = (
        _env_value("SYSTEM_ADMIN_ORGANIZATION_NAME")
        or SYSTEM_ADMIN_ORGANIZATION_NAME
    ).strip()
    return AuthOrganizationResponse(
        id=organization_id or SYSTEM_ADMIN_ORGANIZATION_ID,
        name=organization_name or SYSTEM_ADMIN_ORGANIZATION_NAME,
    )


def _is_configured_system_admin_user(auth_user: SupabaseAuthUser) -> bool:
    allowed_user_ids = _env_csv("SYSTEM_ADMIN_USER_IDS")
    allowed_emails = _env_csv("SYSTEM_ADMIN_EMAILS")
    return auth_user.id.lower() in allowed_user_ids or (
        auth_user.email.strip().lower() in allowed_emails
    )


def _bootstrap_system_admin_profile(
    auth_user: SupabaseAuthUser,
    auth_repository: AuthRepository,
    existing_profile: AuthProfileRecord | None,
) -> AuthProfileRecord:
    organization = _configured_system_admin_organization()
    auth_repository.upsert_organization(organization)
    profile = AuthProfileRecord(
        id=auth_user.id,
        email=auth_user.email.strip().lower(),
        name=auth_user.name or existing_profile.name if existing_profile else (
            auth_user.name or auth_user.email.split("@")[0]
        ),
        role="system_admin",
        organization_id=organization.id,
        auth_provider="supabase",
        status=existing_profile.status if existing_profile else "active",
    )
    saved_profile = auth_repository.upsert_profile(profile)
    _ensure_active_profile(saved_profile)
    return saved_profile


def _ensure_demo_profiles_seeded(
    auth_repository: AuthRepository | None = None,
) -> AuthRepository:
    repository = auth_repository or get_auth_repository()
    for account in DEMO_ACCOUNTS:
        existing_profile = repository.get_profile(account.public.id)
        if existing_profile is not None:
            continue
        repository.upsert_profile(
            AuthProfileRecord(
                id=account.public.id,
                email=account.public.email,
                name=account.public.name,
                role=account.public.role,
                organization_id=account.public.organization_id or "org-demo",
                auth_provider="demo",
                status="active",
            )
        )
    return repository


def authenticate_demo_user(
    credentials: LoginRequest,
    auth_repository: AuthRepository | None = None,
) -> LoginResponse:
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
        _ensure_login_profile_active(user, auth_repository)
        return LoginResponse(access_token=create_session_token(user), user=user)

    repository = _ensure_demo_profiles_seeded(auth_repository)
    user = UserProfile(**account.public.model_dump(exclude={"label"}))
    _ensure_login_profile_active(user, repository)
    return LoginResponse(access_token=create_session_token(user), user=user)


def authenticate_demo_account(
    payload: DemoLoginRequest,
    auth_repository: AuthRepository | None = None,
) -> LoginResponse:
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

    repository = _ensure_demo_profiles_seeded(auth_repository)
    user = UserProfile(**account.public.model_dump(exclude={"label"}))
    _ensure_login_profile_active(user, repository)
    return LoginResponse(access_token=create_session_token(user), user=user)


def _public_profile(profile: AuthProfileRecord) -> UserProfile:
    return UserProfile(
        id=profile.id,
        email=profile.email,
        name=profile.name,
        role=profile.role,
        organization_id=profile.organization_id,
    )


def _managed_user_response(profile: AuthProfileRecord) -> ManagedUserResponse:
    if profile.role not in {"teacher", "student"}:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Managed user response can only include teachers or students",
        )
    return ManagedUserResponse(
        id=profile.id,
        email=profile.email,
        name=profile.name,
        role=profile.role,
        status=profile.status,
        organization_id=profile.organization_id,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


def _ensure_active_profile(profile: AuthProfileRecord) -> None:
    if profile.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User profile is disabled",
        )


def _ensure_login_profile_active(
    user: UserProfile,
    auth_repository: AuthRepository | None = None,
) -> None:
    repository = auth_repository or get_auth_repository()
    profile = repository.get_profile(user.id)
    if profile is not None:
        _ensure_active_profile(profile)


def _profile_for_supabase_user(
    auth_user: SupabaseAuthUser,
    auth_repository: AuthRepository,
) -> AuthProfileRecord:
    profile = auth_repository.get_profile(auth_user.id)
    if profile is None and auth_user.email:
        profile = auth_repository.get_profile_by_email(auth_user.email)

    if _is_configured_system_admin_user(auth_user):
        return _bootstrap_system_admin_profile(
            auth_user,
            auth_repository,
            profile,
        )

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
        return authenticate_demo_user(credentials, auth_repository)

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
            repository = auth_repository or get_auth_repository()
            profile = repository.get_profile(demo_user.id)
            if profile is not None:
                _ensure_active_profile(profile)
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


def _require_user_management_admin(user: UserProfile) -> AuthProfileRecord:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can manage organization users",
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


def list_managed_users(
    current_user: UserProfile,
    auth_repository: AuthRepository | None = None,
    *,
    role_filter: ManagedUserRole | None = None,
    status_filter: ProfileStatus | None = None,
) -> list[ManagedUserResponse]:
    admin = _require_user_management_admin(current_user)
    repository = auth_repository or get_auth_repository()
    profiles = repository.list_profiles(
        organization_id=admin.organization_id,
        role=role_filter,
        status=status_filter,
    )
    return [
        _managed_user_response(profile)
        for profile in profiles
        if profile.role in {"teacher", "student"}
    ]


def update_managed_user_status(
    profile_id: str,
    payload: ManagedUserStatusUpdateRequest,
    current_user: UserProfile,
    auth_repository: AuthRepository | None = None,
) -> ManagedUserResponse:
    return update_managed_user(
        profile_id,
        ManagedUserUpdateRequest(status=payload.status),
        current_user,
        auth_repository,
    )


def update_managed_user(
    profile_id: str,
    payload: ManagedUserUpdateRequest,
    current_user: UserProfile,
    auth_repository: AuthRepository | None = None,
) -> ManagedUserResponse:
    admin = _require_user_management_admin(current_user)
    repository = auth_repository or get_auth_repository()
    profile = repository.get_profile(profile_id)
    if profile is None or profile.organization_id != admin.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Managed user was not found",
        )
    if profile.role not in {"teacher", "student"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins can only manage Teacher or Student profiles",
        )

    updates: dict[str, str] = {}
    if payload.name is not None:
        updates["name"] = payload.name.strip()
    if payload.email is not None:
        normalized_email = _normalize_invite_email(payload.email)
        existing = repository.get_profile_by_email(normalized_email)
        if existing is not None and existing.id != profile.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A profile already exists for this email",
            )
        updates["email"] = normalized_email
    if payload.status is not None:
        updates["status"] = payload.status
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No managed user fields were provided",
        )

    updated_profile = profile.model_copy(
        update={
            **updates,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    saved_profile = repository.upsert_profile(updated_profile)
    return _managed_user_response(saved_profile)


def _require_system_admin(user: UserProfile) -> AuthProfileRecord:
    if user.role != "system_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only system admins can manage platform organizations",
        )
    if not user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current system admin is not assigned to an organization",
        )
    return AuthProfileRecord(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        organization_id=user.organization_id,
        auth_provider=get_auth_provider_mode(),
    )


def _organization_id_from_name(name: str) -> str:
    slug = re.sub(r"[^a-z0-9_-]+", "-", name.strip().lower()).strip("-_")
    return f"org-{slug}" if slug and not slug.startswith("org-") else slug


def _normalize_organization_id(organization_id: str | None, name: str) -> str:
    candidate = (organization_id or _organization_id_from_name(name)).strip().lower()
    candidate = re.sub(r"[^a-z0-9_-]+", "-", candidate).strip("-_")
    if len(candidate) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Organization id must include at least 2 URL-safe characters",
        )
    return candidate[:80]


def list_system_organizations(
    current_user: UserProfile,
    auth_repository: AuthRepository | None = None,
) -> list[AuthOrganizationResponse]:
    _require_system_admin(current_user)
    repository = auth_repository or get_auth_repository()
    return repository.list_organizations()


def create_system_organization(
    payload: SystemOrganizationCreateRequest,
    current_user: UserProfile,
    auth_repository: AuthRepository | None = None,
) -> AuthOrganizationResponse:
    system_admin = _require_system_admin(current_user)
    repository = auth_repository or get_auth_repository()
    repository.upsert_profile(system_admin)
    organization = AuthOrganizationResponse(
        id=_normalize_organization_id(payload.id, payload.name),
        name=payload.name.strip(),
    )
    return repository.upsert_organization(organization)


def create_system_admin_invite(
    organization_id: str,
    payload: SystemAdminInviteCreateRequest,
    current_user: UserProfile,
    auth_repository: AuthRepository | None = None,
) -> OrganizationInviteResponse:
    system_admin = _require_system_admin(current_user)
    repository = auth_repository or get_auth_repository()
    organizations = {
        organization.id
        for organization in repository.list_organizations()
    }
    if organization_id not in organizations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization was not found",
        )
    repository.upsert_profile(system_admin)
    return repository.create_invite(
        email=_normalize_invite_email(payload.email),
        role="admin",
        organization_id=organization_id,
        invited_by=system_admin.id,
    )


def require_role(user: UserProfile, allowed_roles: set[Role]) -> UserProfile:
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this workspace",
        )

    return user
