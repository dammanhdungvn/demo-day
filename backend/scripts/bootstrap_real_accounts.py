from __future__ import annotations

import argparse
import json
import os
import secrets
import string
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Protocol

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.auth.repositories import PostgresAuthRepository  # noqa: E402
from app.auth.schemas import (  # noqa: E402
    AuthOrganizationResponse,
    AuthProfileRecord,
    Role,
    SupabaseAuthUser,
)
from app.core.config import _database_conninfo, _env_value  # noqa: E402


SYSTEM_ORGANIZATION_ID = "org-platform"
SYSTEM_ORGANIZATION_NAME = "TeachFlow Platform"
QA_ENV_DEFAULTS = {
    "TEACHFLOW_BOOTSTRAP_OWNER_EMAIL": "owner.qa@example.edu",
    "TEACHFLOW_BOOTSTRAP_ADMIN_EMAIL": "admin.qa@example.edu",
    "TEACHFLOW_BOOTSTRAP_TEACHER_EMAIL": "teacher.qa@example.edu",
    "TEACHFLOW_BOOTSTRAP_STUDENT_EMAIL": "student.qa@example.edu",
}
QA_ENV_ORDER = (
    "TEACHFLOW_BOOTSTRAP_OWNER_EMAIL",
    "TEACHFLOW_BOOTSTRAP_OWNER_PASSWORD",
    "TEACHFLOW_BOOTSTRAP_ADMIN_EMAIL",
    "TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD",
    "TEACHFLOW_BOOTSTRAP_TEACHER_EMAIL",
    "TEACHFLOW_BOOTSTRAP_TEACHER_PASSWORD",
    "TEACHFLOW_BOOTSTRAP_STUDENT_EMAIL",
    "TEACHFLOW_BOOTSTRAP_STUDENT_PASSWORD",
    "TEACHFLOW_QA_ADMIN_EMAIL",
    "TEACHFLOW_QA_ADMIN_PASSWORD",
)
SENSITIVE_ENV_NAMES = (
    "SECRET_API_KEY_SUPABASE",
    "SUPABASE_POOLER_CONNECTING_STRING",
    "SUPABASE_DIRECT_CONNECTING_STRING",
    "DATABASE_URL",
    "TEACHFLOW_BOOTSTRAP_OWNER_PASSWORD",
    "TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD",
    "TEACHFLOW_BOOTSTRAP_TEACHER_PASSWORD",
    "TEACHFLOW_BOOTSTRAP_STUDENT_PASSWORD",
    "TEACHFLOW_QA_ADMIN_PASSWORD",
)


@dataclass(frozen=True)
class BootstrapAccountSpec:
    email: str
    name: str
    organization_id: str
    password: str | None
    password_env: str
    role: Role


@dataclass(frozen=True)
class BootstrapResult:
    action: str
    email: str
    profile_id: str | None
    role: Role


class AuthAdminClient(Protocol):
    def create_user(
        self,
        *,
        email: str,
        name: str,
        password: str,
    ) -> SupabaseAuthUser:
        ...


class SupabaseAuthAdminRestClient:
    def __init__(self, *, project_url: str, service_key: str) -> None:
        self.project_url = project_url.rstrip("/")
        self.service_key = service_key

    def create_user(
        self,
        *,
        email: str,
        name: str,
        password: str,
    ) -> SupabaseAuthUser:
        payload = {
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"name": name},
        }
        request = urllib.request.Request(
            f"{self.project_url}/auth/v1/admin/users",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.service_key}",
                "apikey": self.service_key,
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                response_payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:600]
            raise RuntimeError(
                f"Supabase Auth admin create user failed with status {exc.code}: {detail}"
            ) from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(
                f"Supabase Auth admin create user failed: {exc.reason}"
            ) from exc

        return SupabaseAuthUser(
            id=str(response_payload["id"]),
            email=str(response_payload.get("email") or email),
            name=name,
        )


def _email_arg(value: str | None, env_name: str) -> str | None:
    return (value or _env_value(env_name) or "").strip().lower() or None


def _password_for(env_name: str, *, require_password: bool) -> str | None:
    password = _env_value(env_name) or ""
    if password:
        return password
    if require_password:
        raise ValueError(
            f"Missing {env_name}; set it in the shell or .env.local before running --apply"
        )
    return None


def redact_sensitive_values(message: str) -> str:
    redacted = message
    for env_name in SENSITIVE_ENV_NAMES:
        secret_value = _env_value(env_name)
        if secret_value:
            redacted = redacted.replace(secret_value, "<redacted>")
    return redacted


def _generated_password(length: int = 24) -> str:
    alphabet = string.ascii_letters + string.digits + "-_"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _parse_env_lines(lines: list[str]) -> dict[str, str]:
    values: dict[str, str] = {}
    for line in lines:
        raw = line.strip()
        if not raw or raw.startswith("#") or "=" not in raw:
            continue
        key, value = raw.split("=", 1)
        key = key.strip()
        if key.startswith("export "):
            key = key[7:].strip()
        values[key] = value.strip().strip('"').strip("'")
    return values


def _upsert_env_values(
    *,
    env_path: Path,
    updates: dict[str, str],
    existing_values: dict[str, str],
) -> list[str]:
    lines = env_path.read_text().splitlines() if env_path.exists() else []
    remaining = dict(updates)
    output_lines: list[str] = []
    updated_keys: list[str] = []

    for line in lines:
        raw = line.strip()
        if not raw or raw.startswith("#") or "=" not in raw:
            output_lines.append(line)
            continue
        key, _value = raw.split("=", 1)
        key = key.strip()
        prefix = ""
        if key.startswith("export "):
            prefix = "export "
            key = key[7:].strip()
        if key not in remaining:
            output_lines.append(line)
            continue
        if existing_values.get(key):
            output_lines.append(line)
            remaining.pop(key)
            continue
        output_lines.append(f"{prefix}{key}={remaining.pop(key)}")
        updated_keys.append(key)

    missing_keys = [key for key in QA_ENV_ORDER if key in remaining]
    if missing_keys:
        if output_lines and output_lines[-1].strip():
            output_lines.append("")
        output_lines.append("# Optional real-account bootstrap/QA. Generated locally; do not commit.")
        for key in missing_keys:
            output_lines.append(f"{key}={remaining.pop(key)}")
            updated_keys.append(key)

    env_path.write_text("\n".join(output_lines).rstrip() + "\n")
    return updated_keys


def prepare_qa_env_local(
    env_path: Path,
    *,
    password_factory: Callable[[], str] = _generated_password,
    rotate_passwords: bool = False,
) -> list[str]:
    lines = env_path.read_text().splitlines() if env_path.exists() else []
    existing_values = _parse_env_lines(lines)

    def value_or_default(key: str, default: str) -> str:
        return existing_values.get(key) or default

    def password_or_generated(key: str) -> str:
        if rotate_passwords:
            return password_factory()
        return existing_values.get(key) or password_factory()

    admin_email = value_or_default(
        "TEACHFLOW_BOOTSTRAP_ADMIN_EMAIL",
        QA_ENV_DEFAULTS["TEACHFLOW_BOOTSTRAP_ADMIN_EMAIL"],
    )
    admin_password = password_or_generated("TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD")
    desired = {
        "TEACHFLOW_BOOTSTRAP_OWNER_EMAIL": value_or_default(
            "TEACHFLOW_BOOTSTRAP_OWNER_EMAIL",
            QA_ENV_DEFAULTS["TEACHFLOW_BOOTSTRAP_OWNER_EMAIL"],
        ),
        "TEACHFLOW_BOOTSTRAP_OWNER_PASSWORD": password_or_generated(
            "TEACHFLOW_BOOTSTRAP_OWNER_PASSWORD"
        ),
        "TEACHFLOW_BOOTSTRAP_ADMIN_EMAIL": admin_email,
        "TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD": admin_password,
        "TEACHFLOW_BOOTSTRAP_TEACHER_EMAIL": value_or_default(
            "TEACHFLOW_BOOTSTRAP_TEACHER_EMAIL",
            QA_ENV_DEFAULTS["TEACHFLOW_BOOTSTRAP_TEACHER_EMAIL"],
        ),
        "TEACHFLOW_BOOTSTRAP_TEACHER_PASSWORD": password_or_generated(
            "TEACHFLOW_BOOTSTRAP_TEACHER_PASSWORD"
        ),
        "TEACHFLOW_BOOTSTRAP_STUDENT_EMAIL": value_or_default(
            "TEACHFLOW_BOOTSTRAP_STUDENT_EMAIL",
            QA_ENV_DEFAULTS["TEACHFLOW_BOOTSTRAP_STUDENT_EMAIL"],
        ),
        "TEACHFLOW_BOOTSTRAP_STUDENT_PASSWORD": password_or_generated(
            "TEACHFLOW_BOOTSTRAP_STUDENT_PASSWORD"
        ),
        "TEACHFLOW_QA_ADMIN_EMAIL": value_or_default(
            "TEACHFLOW_QA_ADMIN_EMAIL",
            admin_email,
        ),
        "TEACHFLOW_QA_ADMIN_PASSWORD": (
            admin_password
            if rotate_passwords
            else value_or_default("TEACHFLOW_QA_ADMIN_PASSWORD", admin_password)
        ),
    }
    updates = {
        key: desired[key]
        for key in QA_ENV_ORDER
        if not existing_values.get(key)
        or (rotate_passwords and key.endswith("_PASSWORD"))
    }
    if not updates:
        return []
    upsert_existing_values = dict(existing_values)
    if rotate_passwords:
        for key in QA_ENV_ORDER:
            if key.endswith("_PASSWORD"):
                upsert_existing_values[key] = ""
    return _upsert_env_values(
        env_path=env_path,
        updates=updates,
        existing_values=upsert_existing_values,
    )


def build_account_specs(
    args: argparse.Namespace,
    *,
    require_passwords: bool,
) -> list[BootstrapAccountSpec]:
    specs: list[BootstrapAccountSpec] = []
    account_inputs: list[tuple[str | None, Role, str, str, str, str, str]] = [
        (
            args.owner_email,
            "system_admin",
            args.owner_name,
            "System Owner",
            "TEACHFLOW_BOOTSTRAP_OWNER_EMAIL",
            "TEACHFLOW_BOOTSTRAP_OWNER_PASSWORD",
            SYSTEM_ORGANIZATION_ID,
        ),
        (
            args.admin_email,
            "admin",
            args.admin_name,
            "Organization Admin",
            "TEACHFLOW_BOOTSTRAP_ADMIN_EMAIL",
            "TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD",
            args.organization_id,
        ),
        (
            args.teacher_email,
            "teacher",
            args.teacher_name,
            "Teacher",
            "TEACHFLOW_BOOTSTRAP_TEACHER_EMAIL",
            "TEACHFLOW_BOOTSTRAP_TEACHER_PASSWORD",
            args.organization_id,
        ),
        (
            args.student_email,
            "student",
            args.student_name,
            "Student",
            "TEACHFLOW_BOOTSTRAP_STUDENT_EMAIL",
            "TEACHFLOW_BOOTSTRAP_STUDENT_PASSWORD",
            args.organization_id,
        ),
    ]
    for email_arg, role, name_arg, default_name, email_env, password_env, org_id in account_inputs:
        email = _email_arg(email_arg, email_env)
        if email is None:
            continue
        specs.append(
            BootstrapAccountSpec(
                email=email,
                name=(name_arg or default_name).strip(),
                organization_id=org_id,
                password=_password_for(password_env, require_password=require_passwords),
                password_env=password_env,
                role=role,
            )
        )
    if not specs:
        raise ValueError(
            "No account email was provided. Use --admin-email/--teacher-email/--student-email "
            "or the TEACHFLOW_BOOTSTRAP_*_EMAIL env vars."
        )
    return specs


def bootstrap_real_accounts(
    *,
    apply_changes: bool,
    auth_client: AuthAdminClient,
    organization: AuthOrganizationResponse,
    repository: PostgresAuthRepository,
    specs: list[BootstrapAccountSpec],
) -> list[BootstrapResult]:
    results: list[BootstrapResult] = []
    if not apply_changes:
        return [
            BootstrapResult(
                action="planned",
                email=spec.email,
                profile_id=None,
                role=spec.role,
            )
            for spec in specs
        ]

    repository.ensure_schema()
    repository.upsert_organization(organization)
    for spec in specs:
        existing_profile = repository.get_profile_by_email(spec.email)
        if existing_profile is not None:
            results.append(
                BootstrapResult(
                    action="skipped-existing-profile",
                    email=spec.email,
                    profile_id=existing_profile.id,
                    role=existing_profile.role,
                )
            )
            continue

        if spec.password is None:
            raise ValueError(f"Missing password for {spec.email}")
        auth_user = auth_client.create_user(
            email=spec.email,
            name=spec.name,
            password=spec.password,
        )
        profile = repository.upsert_profile(
            AuthProfileRecord(
                id=auth_user.id,
                email=auth_user.email,
                name=spec.name,
                role=spec.role,
                organization_id=spec.organization_id,
                auth_provider="supabase",
                status="active",
            )
        )
        results.append(
            BootstrapResult(
                action="created",
                email=profile.email,
                profile_id=profile.id,
                role=profile.role,
            )
        )
    return results


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Bootstrap real Supabase Auth users and Postgres profiles for QA."
    )
    parser.add_argument("--apply", action="store_true", help="Write to Supabase Auth/Postgres.")
    parser.add_argument("--organization-id", default="org-demo")
    parser.add_argument("--organization-name", default="TeachFlow Demo Organization")
    parser.add_argument("--owner-email")
    parser.add_argument("--owner-name", default="System Owner")
    parser.add_argument("--admin-email")
    parser.add_argument("--admin-name", default="Organization Admin")
    parser.add_argument("--teacher-email")
    parser.add_argument("--teacher-name", default="Teacher")
    parser.add_argument("--student-email")
    parser.add_argument("--student-name", default="Student")
    parser.add_argument(
        "--prepare-qa-env-local",
        action="store_true",
        help=(
            "Fill missing TEACHFLOW_BOOTSTRAP_* and TEACHFLOW_QA_ADMIN_* keys "
            "in the repo .env.local without printing secret values."
        ),
    )
    parser.add_argument(
        "--rotate-qa-env-local",
        action="store_true",
        help=(
            "Regenerate local QA password values in .env.local without printing "
            "secret values. Implies --prepare-qa-env-local."
        ),
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    if args.prepare_qa_env_local or args.rotate_qa_env_local:
        env_path = Path(__file__).resolve().parents[2] / ".env.local"
        updated_keys = prepare_qa_env_local(
            env_path,
            rotate_passwords=args.rotate_qa_env_local,
        )
        if updated_keys:
            print(
                ".env.local updated keys: "
                + ", ".join(updated_keys)
                + " (values hidden)"
            )
        else:
            print(".env.local already has real-account bootstrap/QA keys.")

    try:
        specs = build_account_specs(args, require_passwords=args.apply)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    if not args.apply:
        results = bootstrap_real_accounts(
            apply_changes=False,
            auth_client=SupabaseAuthAdminRestClient(
                project_url="https://dry-run.supabase.co",
                service_key="dry-run",
            ),
            organization=AuthOrganizationResponse(
                id=args.organization_id,
                name=args.organization_name,
            ),
            repository=PostgresAuthRepository("postgresql://dry-run"),
            specs=specs,
        )
        print("DRY RUN: no Supabase Auth/Postgres writes were made.")
    else:
        project_url = _env_value("URL_SUPABASE")
        service_key = _env_value("SECRET_API_KEY_SUPABASE")
        if not project_url or not service_key:
            print(
                "ERROR: URL_SUPABASE and SECRET_API_KEY_SUPABASE are required for --apply.",
                file=sys.stderr,
            )
            return 2
        try:
            results = bootstrap_real_accounts(
                apply_changes=True,
                auth_client=SupabaseAuthAdminRestClient(
                    project_url=project_url,
                    service_key=service_key,
                ),
                organization=AuthOrganizationResponse(
                    id=args.organization_id,
                    name=args.organization_name,
                ),
                repository=PostgresAuthRepository(_database_conninfo()),
                specs=specs,
            )
        except Exception as exc:
            print(
                "ERROR: bootstrap apply failed: "
                + redact_sensitive_values(str(exc)),
                file=sys.stderr,
            )
            return 1

    for result in results:
        print(
            f"{result.action}: role={result.role} email={result.email} "
            f"profile_id={result.profile_id or '<pending>'}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
