from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Role = Literal["admin", "teacher", "student"]
ProfileStatus = Literal["active", "disabled"]


class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    role: Role
    organization_id: str | None = None


class PublicDemoAccount(UserProfile):
    label: str


class DemoAccountRecord(BaseModel):
    public: PublicDemoAccount
    password: str


class LoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=1)


class DemoLoginRequest(BaseModel):
    account_id: str = Field(min_length=1, max_length=120)


class LoginResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserProfile
    refresh_token: str | None = None
    expires_in: int | None = None


class RefreshSessionRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class AuthOrganizationResponse(BaseModel):
    id: str
    name: str
    created_at: str | None = None
    updated_at: str | None = None


class AuthProfileRecord(UserProfile):
    organization_id: str
    auth_provider: str
    status: ProfileStatus = "active"
    created_at: str | None = None
    updated_at: str | None = None


class InviteCreateRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    role: Role


class AcceptInviteRequest(BaseModel):
    invite_code: str = Field(min_length=8, max_length=256)
    email: str = Field(min_length=3, max_length=320)
    name: str = Field(min_length=1, max_length=160)
    password: str = Field(min_length=8, max_length=256)


class OrganizationInviteResponse(BaseModel):
    id: str
    email: str
    role: Role
    status: Literal["pending", "accepted", "revoked"]
    organization_id: str
    invited_by: str
    invite_code: str
    created_at: str
    expires_at: str | None = None
    accepted_at: str | None = None


class SupabaseAuthUser(BaseModel):
    id: str
    email: str
    name: str | None = None


class SupabaseAuthSession(BaseModel):
    access_token: str
    refresh_token: str | None = None
    expires_in: int | None = None
    user: SupabaseAuthUser


class MessageResponse(BaseModel):
    message: str
