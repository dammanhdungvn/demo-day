from __future__ import annotations

import argparse

from app.auth.repositories import InMemoryAuthRepository
from app.auth.schemas import AuthOrganizationResponse, SupabaseAuthUser
from scripts.bootstrap_real_accounts import (
    BootstrapAccountSpec,
    bootstrap_real_accounts,
    build_account_specs,
    prepare_qa_env_local,
    redact_sensitive_values,
)


class FakeAuthAdminClient:
    def __init__(self) -> None:
        self.created_users: list[tuple[str, str]] = []

    def create_user(
        self,
        *,
        email: str,
        name: str,
        password: str,
    ) -> SupabaseAuthUser:
        self.created_users.append((email, password))
        return SupabaseAuthUser(
            id=f"auth-{len(self.created_users)}",
            email=email,
            name=name,
        )


def test_build_account_specs_keeps_passwords_shell_only(
    monkeypatch,
    tmp_path,
) -> None:
    args = argparse.Namespace(
        admin_email="Admin@Example.edu",
        admin_name="Admin One",
        organization_id="org-demo",
        owner_email=None,
        owner_name="Owner",
        teacher_email=None,
        teacher_name="Teacher",
        student_email=None,
        student_name="Student",
    )
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD", "strong-admin-password")

    specs = build_account_specs(args, require_passwords=True)

    assert specs == [
        BootstrapAccountSpec(
            email="admin@example.edu",
            name="Admin One",
            organization_id="org-demo",
            password="strong-admin-password",
            password_env="TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD",
            role="admin",
        )
    ]


def test_build_account_specs_reads_optional_env_local(
    monkeypatch,
    tmp_path,
) -> None:
    args = argparse.Namespace(
        admin_email=None,
        admin_name="Admin One",
        organization_id="org-demo",
        owner_email=None,
        owner_name="Owner",
        teacher_email=None,
        teacher_name="Teacher",
        student_email=None,
        student_name="Student",
    )
    (tmp_path / ".env.local").write_text(
        "TEACHFLOW_BOOTSTRAP_ADMIN_EMAIL=admin.local@example.edu\n"
        "TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD=local-admin-password\n"
    )
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("TEACHFLOW_BOOTSTRAP_ADMIN_EMAIL", raising=False)
    monkeypatch.delenv("TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD", raising=False)

    specs = build_account_specs(args, require_passwords=True)

    assert specs == [
        BootstrapAccountSpec(
            email="admin.local@example.edu",
            name="Admin One",
            organization_id="org-demo",
            password="local-admin-password",
            password_env="TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD",
            role="admin",
        )
    ]


def test_prepare_qa_env_local_adds_default_accounts_and_passwords(
    monkeypatch,
    tmp_path,
) -> None:
    env_path = tmp_path / ".env.local"
    env_path.write_text(
        "TEACHFLOW_BOOTSTRAP_ADMIN_EMAIL=existing-admin@example.edu\n"
        "TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD=existing-password\n"
        "URL_SUPABASE=https://project.supabase.co\n"
    )
    passwords = iter(
        [
            "owner-generated-password",
            "teacher-generated-password",
            "student-generated-password",
        ]
    )

    updated_keys = prepare_qa_env_local(
        env_path,
        password_factory=lambda: next(passwords),
    )
    values = {
        line.split("=", 1)[0]: line.split("=", 1)[1]
        for line in env_path.read_text().splitlines()
        if line and not line.startswith("#") and "=" in line
    }

    assert "TEACHFLOW_BOOTSTRAP_OWNER_EMAIL" in updated_keys
    assert "TEACHFLOW_BOOTSTRAP_OWNER_PASSWORD" in updated_keys
    assert "TEACHFLOW_BOOTSTRAP_ADMIN_EMAIL" not in updated_keys
    assert "TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD" not in updated_keys
    assert values["TEACHFLOW_BOOTSTRAP_ADMIN_EMAIL"] == "existing-admin@example.edu"
    assert values["TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD"] == "existing-password"
    assert values["TEACHFLOW_BOOTSTRAP_OWNER_EMAIL"] == "owner.qa@example.edu"
    assert values["TEACHFLOW_BOOTSTRAP_TEACHER_EMAIL"] == "teacher.qa@example.edu"
    assert values["TEACHFLOW_BOOTSTRAP_STUDENT_EMAIL"] == "student.qa@example.edu"
    assert values["TEACHFLOW_QA_ADMIN_EMAIL"] == "existing-admin@example.edu"
    assert values["TEACHFLOW_QA_ADMIN_PASSWORD"] == "existing-password"
    assert values["URL_SUPABASE"] == "https://project.supabase.co"


def test_prepare_qa_env_local_can_rotate_passwords(
    tmp_path,
) -> None:
    env_path = tmp_path / ".env.local"
    env_path.write_text(
        "TEACHFLOW_BOOTSTRAP_ADMIN_EMAIL=existing-admin@example.edu\n"
        "TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD=old-admin-password\n"
        "TEACHFLOW_QA_ADMIN_EMAIL=existing-admin@example.edu\n"
        "TEACHFLOW_QA_ADMIN_PASSWORD=old-admin-password\n"
    )
    passwords = iter(
        [
            "new-admin-password",
            "new-owner-password",
            "new-teacher-password",
            "new-student-password",
        ]
    )

    updated_keys = prepare_qa_env_local(
        env_path,
        password_factory=lambda: next(passwords),
        rotate_passwords=True,
    )
    values = {
        line.split("=", 1)[0]: line.split("=", 1)[1]
        for line in env_path.read_text().splitlines()
        if line and not line.startswith("#") and "=" in line
    }

    assert "TEACHFLOW_BOOTSTRAP_ADMIN_EMAIL" not in updated_keys
    assert "TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD" in updated_keys
    assert "TEACHFLOW_QA_ADMIN_PASSWORD" in updated_keys
    assert values["TEACHFLOW_BOOTSTRAP_ADMIN_EMAIL"] == "existing-admin@example.edu"
    assert values["TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD"] == "new-admin-password"
    assert values["TEACHFLOW_QA_ADMIN_PASSWORD"] == "new-admin-password"


def test_redact_sensitive_values_hides_env_secrets(monkeypatch) -> None:
    monkeypatch.setenv("SECRET_API_KEY_SUPABASE", "service-role-secret")
    monkeypatch.setenv("SUPABASE_POOLER_CONNECTING_STRING", "postgres://pooler-secret")
    monkeypatch.setenv("TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD", "admin-secret")

    redacted = redact_sensitive_values(
        "failed service-role-secret postgres://pooler-secret admin-secret"
    )

    assert "service-role-secret" not in redacted
    assert "postgres://pooler-secret" not in redacted
    assert "admin-secret" not in redacted
    assert redacted.count("<redacted>") == 3


def test_bootstrap_real_accounts_dry_run_does_not_mutate_repository() -> None:
    repository = InMemoryAuthRepository(demo_accounts=[])
    client = FakeAuthAdminClient()
    specs = [
        BootstrapAccountSpec(
            email="admin@example.edu",
            name="Admin One",
            organization_id="org-demo",
            password=None,
            password_env="TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD",
            role="admin",
        )
    ]

    results = bootstrap_real_accounts(
        apply_changes=False,
        auth_client=client,
        organization=AuthOrganizationResponse(
            id="org-demo",
            name="TeachFlow Demo Organization",
        ),
        repository=repository,
        specs=specs,
    )

    assert results[0].action == "planned"
    assert client.created_users == []
    assert repository.get_profile_by_email("admin@example.edu") is None


def test_bootstrap_real_accounts_creates_supabase_profiles() -> None:
    repository = InMemoryAuthRepository(demo_accounts=[])
    client = FakeAuthAdminClient()
    specs = [
        BootstrapAccountSpec(
            email="admin@example.edu",
            name="Admin One",
            organization_id="org-demo",
            password="admin-password",
            password_env="TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD",
            role="admin",
        ),
        BootstrapAccountSpec(
            email="student@example.edu",
            name="Student One",
            organization_id="org-demo",
            password="student-password",
            password_env="TEACHFLOW_BOOTSTRAP_STUDENT_PASSWORD",
            role="student",
        ),
    ]

    results = bootstrap_real_accounts(
        apply_changes=True,
        auth_client=client,
        organization=AuthOrganizationResponse(
            id="org-demo",
            name="TeachFlow Demo Organization",
        ),
        repository=repository,
        specs=specs,
    )

    assert [result.action for result in results] == ["created", "created"]
    assert client.created_users == [
        ("admin@example.edu", "admin-password"),
        ("student@example.edu", "student-password"),
    ]
    assert repository.get_profile_by_email("admin@example.edu").role == "admin"
    assert repository.get_profile_by_email("admin@example.edu").auth_provider == "supabase"
    assert repository.get_profile_by_email("student@example.edu").role == "student"


def test_bootstrap_real_accounts_skips_existing_profile() -> None:
    repository = InMemoryAuthRepository(demo_accounts=[])
    client = FakeAuthAdminClient()
    first_spec = BootstrapAccountSpec(
        email="admin@example.edu",
        name="Admin One",
        organization_id="org-demo",
        password="admin-password",
        password_env="TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD",
        role="admin",
    )
    bootstrap_real_accounts(
        apply_changes=True,
        auth_client=client,
        organization=AuthOrganizationResponse(
            id="org-demo",
            name="TeachFlow Demo Organization",
        ),
        repository=repository,
        specs=[first_spec],
    )

    results = bootstrap_real_accounts(
        apply_changes=True,
        auth_client=client,
        organization=AuthOrganizationResponse(
            id="org-demo",
            name="TeachFlow Demo Organization",
        ),
        repository=repository,
        specs=[first_spec],
    )

    assert results[0].action == "skipped-existing-profile"
    assert client.created_users == [("admin@example.edu", "admin-password")]
