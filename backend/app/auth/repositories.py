from __future__ import annotations

from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe
from typing import Any, Sequence

import psycopg
from fastapi import HTTPException
from psycopg.rows import dict_row

from app.core.time import _now_iso

from .demo import DEMO_ACCOUNTS
from .schemas import (
    AuthOrganizationResponse,
    AuthProfileRecord,
    DemoAccountRecord,
    OrganizationInviteRole,
    OrganizationInviteResponse,
    Role,
)

INVITE_TTL_DAYS = 7


def _iso_plus_days(days: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


def auth_schema_sql() -> str:
    return """
    create extension if not exists pgcrypto;

    create table if not exists organizations (
      id text primary key default gen_random_uuid()::text,
      name text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists profiles (
      id text primary key,
      email text not null unique,
      name text not null,
      role text not null constraint profiles_role_check
        check (role in ('system_admin', 'admin', 'teacher', 'student')),
      organization_id text not null references organizations(id) on delete restrict,
      auth_provider text not null default 'supabase',
      status text not null default 'active'
        check (status in ('active', 'disabled')),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists organization_invites (
      id text primary key default gen_random_uuid()::text,
      email text not null,
      role text not null constraint organization_invites_role_check
        check (role in ('admin', 'teacher', 'student')),
      status text not null default 'pending'
        check (status in ('pending', 'accepted', 'revoked')),
      organization_id text not null references organizations(id) on delete cascade,
      invited_by text not null references profiles(id) on delete restrict,
      invite_code text not null unique,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null default now() + interval '7 days',
      accepted_at timestamptz
    );

    alter table profiles
      add column if not exists status text not null default 'active';
    update profiles
      set status = 'active'
      where status is null or status not in ('active', 'disabled');

    alter table organization_invites
      add column if not exists expires_at timestamptz;
    update organization_invites
      set expires_at = created_at + interval '7 days'
      where expires_at is null;
    alter table organization_invites
      alter column expires_at set not null;

    insert into organizations (id, name)
    values ('org-platform', 'TeachFlow Platform')
    on conflict (id) do nothing;

    alter table profiles
      drop constraint if exists profiles_role_check;
    alter table profiles
      add constraint profiles_role_check
      check (role in ('system_admin', 'admin', 'teacher', 'student'));

    alter table organization_invites
      drop constraint if exists organization_invites_role_check;
    alter table organization_invites
      add constraint organization_invites_role_check
      check (role in ('admin', 'teacher', 'student'));

    create index if not exists idx_profiles_organization_role
      on profiles (organization_id, role);
    create index if not exists idx_organization_invites_org_status
      on organization_invites (organization_id, status, created_at desc);
    create unique index if not exists idx_organization_invites_pending_unique
      on organization_invites (organization_id, lower(email), role)
      where status = 'pending';

    alter table organizations enable row level security;
    alter table profiles enable row level security;
    alter table organization_invites enable row level security;

    revoke all on table organizations from anon, authenticated;
    revoke all on table profiles from anon, authenticated;
    revoke all on table organization_invites from anon, authenticated;
    """


class InMemoryAuthRepository:
    def __init__(
        self,
        demo_accounts: Sequence[DemoAccountRecord] | None = None,
    ) -> None:
        now = _now_iso()
        self.organizations: dict[str, AuthOrganizationResponse] = {
            "org-demo": AuthOrganizationResponse(
                id="org-demo",
                name="TeachFlow Demo Organization",
                created_at=now,
                updated_at=now,
            ),
            "org-platform": AuthOrganizationResponse(
                id="org-platform",
                name="TeachFlow Platform",
                created_at=now,
                updated_at=now,
            ),
        }
        self.profiles: dict[str, AuthProfileRecord] = {
            account.public.id: AuthProfileRecord(
                id=account.public.id,
                email=account.public.email,
                name=account.public.name,
                role=account.public.role,
                organization_id=account.public.organization_id or "org-demo",
                auth_provider="demo",
                status="active",
                created_at=now,
                updated_at=now,
            )
            for account in (demo_accounts or DEMO_ACCOUNTS)
        }
        self.invites: dict[str, OrganizationInviteResponse] = {}

    def ensure_schema(self) -> None:
        return None

    def get_profile(self, profile_id: str) -> AuthProfileRecord | None:
        return self.profiles.get(profile_id)

    def get_profile_by_email(self, email: str) -> AuthProfileRecord | None:
        normalized_email = email.strip().lower()
        return next(
            (
                profile
                for profile in self.profiles.values()
                if profile.email.lower() == normalized_email
            ),
            None,
        )

    def list_profiles(
        self,
        *,
        organization_id: str | None = None,
        role: Role | None = None,
        status: str | None = "active",
    ) -> list[AuthProfileRecord]:
        profiles = list(self.profiles.values())
        if organization_id is not None:
            profiles = [
                profile
                for profile in profiles
                if profile.organization_id == organization_id
            ]
        if role is not None:
            profiles = [profile for profile in profiles if profile.role == role]
        if status is not None:
            profiles = [
                profile for profile in profiles if profile.status == status
            ]
        return sorted(
            profiles,
            key=lambda profile: (profile.name.lower(), profile.email.lower()),
        )

    def upsert_profile(self, profile: AuthProfileRecord) -> AuthProfileRecord:
        self.profiles[profile.id] = profile
        if profile.organization_id not in self.organizations:
            self.organizations[profile.organization_id] = AuthOrganizationResponse(
                id=profile.organization_id,
                name=profile.organization_id,
                created_at=_now_iso(),
                updated_at=_now_iso(),
            )
        return profile

    def list_organizations(self) -> list[AuthOrganizationResponse]:
        return sorted(
            self.organizations.values(),
            key=lambda organization: organization.id,
        )

    def upsert_organization(
        self,
        organization: AuthOrganizationResponse,
    ) -> AuthOrganizationResponse:
        now = _now_iso()
        existing = self.organizations.get(organization.id)
        saved = AuthOrganizationResponse(
            id=organization.id,
            name=organization.name,
            created_at=existing.created_at if existing else now,
            updated_at=now,
        )
        self.organizations[organization.id] = saved
        return saved

    def get_invite_by_code(
        self,
        invite_code: str,
    ) -> OrganizationInviteResponse | None:
        normalized_code = invite_code.strip()
        return next(
            (
                invite
                for invite in self.invites.values()
                if invite.invite_code == normalized_code
            ),
            None,
        )

    def accept_invite(
        self,
        *,
        invite_id: str,
        profile: AuthProfileRecord,
        accepted_at: str,
    ) -> OrganizationInviteResponse:
        invite = self.invites.get(invite_id)
        if invite is None:
            raise HTTPException(
                status_code=404,
                detail="Invite was not found",
            )
        if invite.status != "pending":
            raise HTTPException(
                status_code=400,
                detail="Invite is no longer pending",
            )

        accepted_invite = invite.model_copy(
            update={"status": "accepted", "accepted_at": accepted_at}
        )
        self.invites[invite_id] = accepted_invite
        self.upsert_profile(profile)
        return accepted_invite

    def create_invite(
        self,
        *,
        email: str,
        role: OrganizationInviteRole,
        organization_id: str,
        invited_by: str,
    ) -> OrganizationInviteResponse:
        normalized_email = email.strip().lower()
        existing = next(
            (
                invite
                for invite in self.invites.values()
                if invite.organization_id == organization_id
                and invite.email == normalized_email
                and invite.role == role
                and invite.status == "pending"
            ),
            None,
        )
        if existing is not None:
            return existing

        invite = OrganizationInviteResponse(
            id=f"invite-{len(self.invites) + 1}",
            email=normalized_email,
            role=role,
            status="pending",
            organization_id=organization_id,
            invited_by=invited_by,
            invite_code=token_urlsafe(18),
            created_at=_now_iso(),
            expires_at=_iso_plus_days(INVITE_TTL_DAYS),
            accepted_at=None,
        )
        self.invites[invite.id] = invite
        return invite

    def list_invites(
        self,
        *,
        organization_id: str,
    ) -> list[OrganizationInviteResponse]:
        return sorted(
            [
                invite
                for invite in self.invites.values()
                if invite.organization_id == organization_id
            ],
            key=lambda invite: invite.created_at,
            reverse=True,
        )


class PostgresAuthRepository:
    def __init__(self, conninfo: str) -> None:
        self.conninfo = conninfo

    def _connect(self) -> psycopg.Connection[dict[str, Any]]:
        return psycopg.connect(
            self.conninfo,
            connect_timeout=20,
            prepare_threshold=None,
            row_factory=dict_row,
        )

    def ensure_schema(self) -> None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(auth_schema_sql())

    @staticmethod
    def _row_to_organization(row: dict[str, Any]) -> AuthOrganizationResponse:
        return AuthOrganizationResponse(
            id=str(row["id"]),
            name=row["name"],
            created_at=str(row["created_at"]) if row.get("created_at") else None,
            updated_at=str(row["updated_at"]) if row.get("updated_at") else None,
        )

    @staticmethod
    def _row_to_profile(row: dict[str, Any]) -> AuthProfileRecord:
        return AuthProfileRecord(
            id=str(row["id"]),
            email=row["email"],
            name=row["name"],
            role=row["role"],
            organization_id=row["organization_id"],
            auth_provider=row["auth_provider"],
            status=row.get("status") or "active",
            created_at=str(row["created_at"]) if row.get("created_at") else None,
            updated_at=str(row["updated_at"]) if row.get("updated_at") else None,
        )

    @staticmethod
    def _row_to_invite(row: dict[str, Any]) -> OrganizationInviteResponse:
        return OrganizationInviteResponse(
            id=str(row["id"]),
            email=row["email"],
            role=row["role"],
            status=row["status"],
            organization_id=row["organization_id"],
            invited_by=row["invited_by"],
            invite_code=row["invite_code"],
            created_at=str(row["created_at"]),
            expires_at=str(row["expires_at"]) if row.get("expires_at") else None,
            accepted_at=str(row["accepted_at"]) if row.get("accepted_at") else None,
        )

    def get_profile(self, profile_id: str) -> AuthProfileRecord | None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      id,
                      email,
                      name,
                      role,
                      organization_id,
                      auth_provider,
                      status,
                      created_at::text,
                      updated_at::text
                    from profiles
                    where id = %s
                    """,
                    (profile_id,),
                )
                row = cur.fetchone()
                return self._row_to_profile(row) if row else None

    def get_profile_by_email(self, email: str) -> AuthProfileRecord | None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      id,
                      email,
                      name,
                      role,
                      organization_id,
                      auth_provider,
                      status,
                      created_at::text,
                      updated_at::text
                    from profiles
                    where lower(email) = lower(%s)
                    """,
                    (email.strip(),),
                )
                row = cur.fetchone()
                return self._row_to_profile(row) if row else None

    def list_profiles(
        self,
        *,
        organization_id: str | None = None,
        role: Role | None = None,
        status: str | None = "active",
    ) -> list[AuthProfileRecord]:
        conditions: list[str] = []
        params: list[str] = []
        if organization_id is not None:
            conditions.append("organization_id = %s")
            params.append(organization_id)
        if role is not None:
            conditions.append("role = %s")
            params.append(role)
        if status is not None:
            conditions.append("status = %s")
            params.append(status)

        where_clause = f"where {' and '.join(conditions)}" if conditions else ""
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    select
                      id,
                      email,
                      name,
                      role,
                      organization_id,
                      auth_provider,
                      status,
                      created_at::text,
                      updated_at::text
                    from profiles
                    {where_clause}
                    order by lower(name), lower(email)
                    """,
                    tuple(params),
                )
                return [self._row_to_profile(row) for row in cur.fetchall()]

    def upsert_profile(self, profile: AuthProfileRecord) -> AuthProfileRecord:
        with self._connect() as conn:
            with conn.transaction():
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        insert into organizations (id, name)
                        values (%s, %s)
                        on conflict (id) do nothing
                        """,
                        (profile.organization_id, profile.organization_id),
                    )
                    cur.execute(
                        """
                        insert into profiles (
                          id,
                          email,
                          name,
                          role,
                          organization_id,
                          auth_provider,
                          status,
                          updated_at
                        )
                        values (%s, %s, %s, %s, %s, %s, %s, now())
                        on conflict (id) do update
                        set email = excluded.email,
                            name = excluded.name,
                            role = excluded.role,
                            organization_id = excluded.organization_id,
                            auth_provider = excluded.auth_provider,
                            status = excluded.status,
                            updated_at = now()
                        returning
                          id,
                          email,
                          name,
                          role,
                          organization_id,
                          auth_provider,
                          status,
                          created_at::text,
                          updated_at::text
                        """,
                        (
                            profile.id,
                            profile.email,
                            profile.name,
                            profile.role,
                            profile.organization_id,
                            profile.auth_provider,
                            profile.status,
                        ),
                    )
                    row = cur.fetchone()
                    if row is None:
                        raise HTTPException(
                            status_code=500,
                            detail="Could not save auth profile",
                        )
                    return self._row_to_profile(row)

    def list_organizations(self) -> list[AuthOrganizationResponse]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      id,
                      name,
                      created_at::text,
                      updated_at::text
                    from organizations
                    order by lower(name), id
                    """
                )
                return [
                    self._row_to_organization(row)
                    for row in cur.fetchall()
                ]

    def upsert_organization(
        self,
        organization: AuthOrganizationResponse,
    ) -> AuthOrganizationResponse:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    insert into organizations (id, name, updated_at)
                    values (%s, %s, now())
                    on conflict (id) do update
                    set name = excluded.name,
                        updated_at = now()
                    returning
                      id,
                      name,
                      created_at::text,
                      updated_at::text
                    """,
                    (organization.id, organization.name),
                )
                row = cur.fetchone()
                if row is None:
                    raise HTTPException(
                        status_code=500,
                        detail="Could not save organization",
                    )
                return self._row_to_organization(row)

    def get_invite_by_code(
        self,
        invite_code: str,
    ) -> OrganizationInviteResponse | None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      id,
                      email,
                      role,
                      status,
                      organization_id,
                      invited_by,
                      invite_code,
                      created_at::text,
                      expires_at::text,
                      accepted_at::text
                    from organization_invites
                    where invite_code = %s
                    limit 1
                    """,
                    (invite_code.strip(),),
                )
                row = cur.fetchone()
                return self._row_to_invite(row) if row else None

    def accept_invite(
        self,
        *,
        invite_id: str,
        profile: AuthProfileRecord,
        accepted_at: str,
    ) -> OrganizationInviteResponse:
        with self._connect() as conn:
            with conn.transaction():
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        insert into organizations (id, name)
                        values (%s, %s)
                        on conflict (id) do nothing
                        """,
                        (profile.organization_id, profile.organization_id),
                    )
                    cur.execute(
                        """
                        insert into profiles (
                          id,
                          email,
                          name,
                          role,
                          organization_id,
                          auth_provider,
                          status,
                          updated_at
                        )
                        values (%s, %s, %s, %s, %s, %s, %s, now())
                        on conflict (id) do update
                        set email = excluded.email,
                            name = excluded.name,
                            role = excluded.role,
                            organization_id = excluded.organization_id,
                            auth_provider = excluded.auth_provider,
                            status = excluded.status,
                            updated_at = now()
                        """,
                        (
                            profile.id,
                            profile.email,
                            profile.name,
                            profile.role,
                            profile.organization_id,
                            profile.auth_provider,
                            profile.status,
                        ),
                    )
                    cur.execute(
                        """
                        update organization_invites
                        set status = 'accepted',
                            accepted_at = %s
                        where id = %s
                          and status = 'pending'
                        returning
                          id,
                          email,
                          role,
                          status,
                          organization_id,
                          invited_by,
                          invite_code,
                          created_at::text,
                          expires_at::text,
                          accepted_at::text
                        """,
                        (accepted_at, invite_id),
                    )
                    row = cur.fetchone()
                    if row is None:
                        raise HTTPException(
                            status_code=400,
                            detail="Invite is no longer pending",
                        )
                    return self._row_to_invite(row)

    def create_invite(
        self,
        *,
        email: str,
        role: OrganizationInviteRole,
        organization_id: str,
        invited_by: str,
    ) -> OrganizationInviteResponse:
        normalized_email = email.strip().lower()
        with self._connect() as conn:
            with conn.transaction():
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        select
                          id,
                          email,
                          role,
                          status,
                          organization_id,
                          invited_by,
                          invite_code,
                          created_at::text,
                          expires_at::text,
                          accepted_at::text
                        from organization_invites
                        where organization_id = %s
                          and lower(email) = lower(%s)
                          and role = %s
                          and status = 'pending'
                        limit 1
                        """,
                        (organization_id, normalized_email, role),
                    )
                    existing = cur.fetchone()
                    if existing is not None:
                        return self._row_to_invite(existing)

                    cur.execute(
                        """
                        insert into organization_invites (
                          email,
                          role,
                          organization_id,
                          invited_by,
                          invite_code,
                          expires_at
                        )
                        values (%s, %s, %s, %s, %s, %s)
                        returning
                          id,
                          email,
                          role,
                          status,
                          organization_id,
                          invited_by,
                          invite_code,
                          created_at::text,
                          expires_at::text,
                          accepted_at::text
                        """,
                        (
                            normalized_email,
                            role,
                            organization_id,
                            invited_by,
                            token_urlsafe(18),
                            _iso_plus_days(INVITE_TTL_DAYS),
                        ),
                    )
                    row = cur.fetchone()
                    if row is None:
                        raise HTTPException(
                            status_code=500,
                            detail="Could not create invite",
                        )
                    return self._row_to_invite(row)

    def list_invites(
        self,
        *,
        organization_id: str,
    ) -> list[OrganizationInviteResponse]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      id,
                      email,
                      role,
                      status,
                      organization_id,
                      invited_by,
                      invite_code,
                      created_at::text,
                      expires_at::text,
                      accepted_at::text
                    from organization_invites
                    where organization_id = %s
                    order by created_at desc
                    """,
                    (organization_id,),
                )
                return [self._row_to_invite(row) for row in cur.fetchall()]
