from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header, Request

from .schemas import Role, UserProfile
from .services import get_current_user_from_authorization, require_role


def get_current_user(
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
) -> UserProfile:
    user = get_current_user_from_authorization(authorization)
    request.state.actor_context = {
        "actor_id": user.id,
        "role": user.role,
        "organization_id": user.organization_id or "",
    }
    return user


def require_roles(*allowed_roles: Role):
    role_set = set(allowed_roles)

    def dependency(
        current_user: Annotated[UserProfile, Depends(get_current_user)],
    ) -> UserProfile:
        return require_role(current_user, role_set)

    return dependency
