from __future__ import annotations

from typing import Protocol

from .schemas import (
    AcceptInviteRequest,
    AuthProfileRecord,
    LoginRequest,
    OrganizationInviteResponse,
    ProfileStatus,
    Role,
    SupabaseAuthSession,
    SupabaseAuthUser,
)


class SupabaseAuthClient(Protocol):
    def sign_in_with_password(self, credentials: LoginRequest) -> SupabaseAuthSession: ...

    def sign_up_with_password(self, payload: AcceptInviteRequest) -> SupabaseAuthSession: ...

    def refresh_session(self, refresh_token: str) -> SupabaseAuthSession: ...

    def get_user(self, access_token: str) -> SupabaseAuthUser: ...

    def logout(self, access_token: str) -> None: ...


class AuthRepository(Protocol):
    def ensure_schema(self) -> None: ...

    def get_profile(self, profile_id: str) -> AuthProfileRecord | None: ...

    def get_profile_by_email(self, email: str) -> AuthProfileRecord | None: ...

    def list_profiles(
        self,
        *,
        organization_id: str | None = None,
        role: Role | None = None,
        status: ProfileStatus | None = "active",
    ) -> list[AuthProfileRecord]: ...

    def upsert_profile(self, profile: AuthProfileRecord) -> AuthProfileRecord: ...

    def get_invite_by_code(self, invite_code: str) -> OrganizationInviteResponse | None: ...

    def accept_invite(
        self,
        *,
        invite_id: str,
        profile: AuthProfileRecord,
        accepted_at: str,
    ) -> OrganizationInviteResponse: ...

    def create_invite(
        self,
        *,
        email: str,
        role: Role,
        organization_id: str,
        invited_by: str,
    ) -> OrganizationInviteResponse: ...

    def list_invites(
        self,
        *,
        organization_id: str,
    ) -> list[OrganizationInviteResponse]: ...
