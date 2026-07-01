from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any

from fastapi import HTTPException, status

from .schemas import (
    AcceptInviteRequest,
    LoginRequest,
    SupabaseAuthSession,
    SupabaseAuthUser,
)


class SupabaseAuthRestClient:
    def __init__(
        self,
        *,
        project_url: str,
        anon_key: str,
    ) -> None:
        self.project_url = project_url.rstrip("/")
        self.anon_key = anon_key

    def _request_json(
        self,
        *,
        path: str,
        method: str,
        payload: dict[str, object] | None = None,
        access_token: str | None = None,
    ) -> dict[str, Any]:
        headers = {
            "apikey": self.anon_key,
            "Content-Type": "application/json",
        }
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        data = json.dumps(payload or {}).encode("utf-8") if payload is not None else None
        request = urllib.request.Request(
            f"{self.project_url}/auth/v1{path}",
            data=data,
            headers=headers,
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                raw = response.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:600]
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED
                if exc.code in {400, 401, 403}
                else status.HTTP_502_BAD_GATEWAY,
                detail=f"Supabase Auth request failed with status {exc.code}: {detail}",
            ) from exc
        except urllib.error.URLError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Supabase Auth request failed: {exc.reason}",
            ) from exc

    @staticmethod
    def _session_from_payload(payload: dict[str, Any]) -> SupabaseAuthSession:
        user_payload = payload.get("user")
        if not isinstance(user_payload, dict):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Supabase Auth response did not include user",
            )
        user_metadata = user_payload.get("user_metadata")
        name = None
        if isinstance(user_metadata, dict):
            name = (
                user_metadata.get("name")
                or user_metadata.get("full_name")
                or user_metadata.get("display_name")
            )
        return SupabaseAuthSession(
            access_token=str(payload["access_token"]),
            refresh_token=(
                str(payload["refresh_token"])
                if payload.get("refresh_token") is not None
                else None
            ),
            expires_in=(
                int(payload["expires_in"])
                if payload.get("expires_in") is not None
                else None
            ),
            user=SupabaseAuthUser(
                id=str(user_payload["id"]),
                email=str(user_payload.get("email") or ""),
                name=str(name) if name else None,
            ),
        )

    @staticmethod
    def _user_from_payload(payload: dict[str, Any]) -> SupabaseAuthUser:
        user_metadata = payload.get("user_metadata")
        name = None
        if isinstance(user_metadata, dict):
            name = (
                user_metadata.get("name")
                or user_metadata.get("full_name")
                or user_metadata.get("display_name")
            )
        return SupabaseAuthUser(
            id=str(payload["id"]),
            email=str(payload.get("email") or ""),
            name=str(name) if name else None,
        )

    def sign_in_with_password(self, credentials: LoginRequest) -> SupabaseAuthSession:
        payload = self._request_json(
            path="/token?grant_type=password",
            method="POST",
            payload={
                "email": credentials.email,
                "password": credentials.password,
            },
        )
        return self._session_from_payload(payload)

    def sign_up_with_password(
        self,
        payload: AcceptInviteRequest,
    ) -> SupabaseAuthSession:
        response = self._request_json(
            path="/signup",
            method="POST",
            payload={
                "email": payload.email,
                "password": payload.password,
                "data": {"name": payload.name},
            },
        )
        return self._session_from_payload(response)

    def refresh_session(self, refresh_token: str) -> SupabaseAuthSession:
        payload = self._request_json(
            path="/token?grant_type=refresh_token",
            method="POST",
            payload={"refresh_token": refresh_token},
        )
        return self._session_from_payload(payload)

    def get_user(self, access_token: str) -> SupabaseAuthUser:
        payload = self._request_json(
            path="/user",
            method="GET",
            payload=None,
            access_token=access_token,
        )
        return self._user_from_payload(payload)

    def logout(self, access_token: str) -> None:
        self._request_json(
            path="/logout",
            method="POST",
            payload={},
            access_token=access_token,
        )
