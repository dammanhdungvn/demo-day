from __future__ import annotations

from typing import Protocol


class UserWithOrganization(Protocol):
    organization_id: str | None


def _user_organization_id(user: UserWithOrganization) -> str:
    return user.organization_id or "org-demo"


def _entity_organization_id(organization_id: str | None) -> str:
    return organization_id or "org-demo"


def _same_organization(
    entity_organization_id: str | None,
    user: UserWithOrganization,
) -> bool:
    return _entity_organization_id(entity_organization_id) == _user_organization_id(user)
