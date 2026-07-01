from pathlib import Path

from fastapi import HTTPException
from pydantic import ValidationError
import pytest

from main import (
    AcceptInviteRequest,
    AuthProfileRecord,
    DemoLoginRequest,
    InMemoryAuthRepository,
    InviteCreateRequest,
    LoginRequest,
    ManagedUserBulkPasswordResetRequest,
    ManagedUserBulkStatusUpdateRequest,
    ManagedUserStatusUpdateRequest,
    ManagedUserUpdateRequest,
    RefreshSessionRequest,
    SystemAdminInviteCreateRequest,
    SystemOrganizationCreateRequest,
    SupabaseAuthSession,
    SupabaseAuthUser,
    UserProfile,
    accept_user_invite,
    authenticate_demo_account,
    authenticate_demo_user,
    authenticate_user,
    bulk_request_managed_user_password_resets,
    bulk_update_managed_user_status,
    create_session_token,
    create_system_admin_invite,
    create_system_organization,
    create_user_invite,
    get_current_user_from_authorization,
    list_managed_users,
    list_system_organizations,
    list_user_invites,
    list_public_demo_accounts,
    refresh_auth_session,
    require_role,
    reset_demo_sessions_for_tests,
    update_managed_user,
    update_managed_user_status,
)


@pytest.fixture(autouse=True)
def clear_demo_sessions() -> None:
    reset_demo_sessions_for_tests()


def test_demo_accounts_include_all_required_roles_without_passwords(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "demo")
    monkeypatch.setenv("ENABLE_DEMO_LOGIN", "true")
    accounts = list_public_demo_accounts()

    assert {account.role for account in accounts} == {"admin", "teacher", "student"}
    assert all(account.email.endswith("@teachflow.local") for account in accounts)


def test_demo_quick_login_is_explicitly_gated(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "demo")
    monkeypatch.setenv("ENABLE_DEMO_LOGIN", "false")

    assert list_public_demo_accounts() == []
    with pytest.raises(HTTPException) as exc_info:
        authenticate_demo_account(DemoLoginRequest(account_id="demo-teacher"))

    assert exc_info.value.status_code == 404


def test_demo_quick_login_is_disabled_by_default(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "supabase")
    monkeypatch.delenv("ENABLE_DEMO_LOGIN", raising=False)

    assert list_public_demo_accounts() == []
    with pytest.raises(HTTPException) as exc_info:
        authenticate_demo_account(DemoLoginRequest(account_id="demo-admin"))

    assert exc_info.value.status_code == 404


def test_env_example_defaults_to_real_account_auth() -> None:
    env_example = Path(__file__).resolve().parents[2] / ".env.example"
    values: dict[str, str] = {}
    for raw_line in env_example.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()

    assert values["AUTH_PROVIDER"] == "supabase"
    assert values["AUTH_REPOSITORY"] == "postgres"
    assert values["LEARNING_REPOSITORY"] == "postgres"
    assert values["ENABLE_DEMO_LOGIN"] == "false"


def test_demo_quick_login_issues_session_without_frontend_password(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "demo")
    monkeypatch.setenv("ENABLE_DEMO_LOGIN", "true")

    response = authenticate_demo_account(DemoLoginRequest(account_id="demo-teacher"))

    assert response.token_type == "bearer"
    assert response.access_token
    assert response.user.email == "teacher@teachflow.local"
    assert response.user.role == "teacher"


def test_demo_quick_login_seeds_managed_profiles_for_empty_repository(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "demo")
    monkeypatch.setenv("ENABLE_DEMO_LOGIN", "true")
    repository = InMemoryAuthRepository(demo_accounts=[])

    response = authenticate_demo_account(
        DemoLoginRequest(account_id="demo-admin"),
        auth_repository=repository,
    )
    users = list_managed_users(response.user, repository)

    assert {user.id for user in users} == {"demo-teacher", "demo-student"}
    assert repository.get_profile("demo-admin") is not None


def test_demo_profile_seed_does_not_reactivate_disabled_user(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "demo")
    monkeypatch.setenv("ENABLE_DEMO_LOGIN", "true")
    repository = InMemoryAuthRepository(demo_accounts=[])
    repository.upsert_profile(
        AuthProfileRecord(
            id="demo-teacher",
            email="teacher@teachflow.local",
            name="Teacher Demo",
            role="teacher",
            organization_id="org-demo",
            auth_provider="demo",
            status="disabled",
        )
    )

    authenticate_demo_account(
        DemoLoginRequest(account_id="demo-admin"),
        auth_repository=repository,
    )

    assert repository.get_profile("demo-teacher").status == "disabled"


def test_demo_quick_login_still_works_with_supabase_provider(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "supabase")
    monkeypatch.setenv("ENABLE_DEMO_LOGIN", "true")

    accounts = list_public_demo_accounts()
    response = authenticate_demo_account(DemoLoginRequest(account_id="demo-admin"))
    current_user = get_current_user_from_authorization(
        f"Bearer {response.access_token}",
        auth_repository=InMemoryAuthRepository(),
        supabase_client=FakeSupabaseAuthClient(),
    )

    assert {account.role for account in accounts} == {"admin", "teacher", "student"}
    assert current_user.id == "demo-admin"
    assert current_user.role == "admin"


def test_login_success_returns_user_with_role_and_token() -> None:
    response = authenticate_demo_user(
        LoginRequest(email="teacher@teachflow.local", password="teachflow-demo")
    )

    assert response.token_type == "bearer"
    assert response.access_token
    assert response.user.role == "teacher"


def test_login_rejects_invalid_credentials() -> None:
    with pytest.raises(HTTPException) as exc_info:
        authenticate_demo_user(
            LoginRequest(email="teacher@teachflow.local", password="wrong")
        )

    assert exc_info.value.status_code == 401


def test_me_requires_valid_bearer_token() -> None:
    user = authenticate_demo_user(
        LoginRequest(email="student@teachflow.local", password="teachflow-demo")
    ).user
    token = create_session_token(user)

    current_user = get_current_user_from_authorization(f"Bearer {token}")

    assert current_user.id == user.id
    assert current_user.role == "student"


def test_me_rejects_missing_or_invalid_token() -> None:
    for authorization in (None, "", "Token bad", "Bearer bad"):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user_from_authorization(authorization)

        assert exc_info.value.status_code == 401


def test_role_guard_allows_matching_role_and_rejects_wrong_role() -> None:
    teacher = authenticate_demo_user(
        LoginRequest(email="teacher@teachflow.local", password="teachflow-demo")
    ).user
    student = authenticate_demo_user(
        LoginRequest(email="student@teachflow.local", password="teachflow-demo")
    ).user

    assert require_role(teacher, {"teacher"}).id == teacher.id

    with pytest.raises(HTTPException) as exc_info:
        require_role(student, {"teacher"})

    assert exc_info.value.status_code == 403


class FakeSupabaseAuthClient:
    def __init__(self, auth_user: SupabaseAuthUser | None = None) -> None:
        self.signed_in: list[LoginRequest] = []
        self.refreshed: list[str] = []
        user = auth_user or SupabaseAuthUser(
            id="auth-teacher",
            email="teacher@example.edu",
            name="Teacher Real",
        )
        self.users_by_token = {
            "supabase-access-token": user,
            "refreshed-access-token": user,
        }

    def sign_in_with_password(self, credentials: LoginRequest) -> SupabaseAuthSession:
        self.signed_in.append(credentials)
        return SupabaseAuthSession(
            access_token="supabase-access-token",
            refresh_token="supabase-refresh-token",
            expires_in=3600,
            user=self.users_by_token["supabase-access-token"],
        )

    def refresh_session(self, refresh_token: str) -> SupabaseAuthSession:
        self.refreshed.append(refresh_token)
        return SupabaseAuthSession(
            access_token="refreshed-access-token",
            refresh_token="next-refresh-token",
            expires_in=3600,
            user=self.users_by_token["refreshed-access-token"],
        )

    def get_user(self, access_token: str) -> SupabaseAuthUser:
        if access_token not in self.users_by_token:
            raise HTTPException(status_code=401, detail="Invalid Supabase token")
        return self.users_by_token[access_token]

    def logout(self, access_token: str) -> None:
        return None


def auth_repository_with_teacher() -> InMemoryAuthRepository:
    repository = InMemoryAuthRepository()
    repository.upsert_profile(
        AuthProfileRecord(
            id="auth-teacher",
            email="teacher@example.edu",
            name="Teacher Real",
            role="teacher",
            organization_id="org-demo",
            auth_provider="supabase",
        )
    )
    return repository


def test_supabase_login_maps_auth_user_to_profile(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "supabase")
    repository = auth_repository_with_teacher()
    client = FakeSupabaseAuthClient()

    response = authenticate_user(
        LoginRequest(email="teacher@example.edu", password="secret"),
        auth_repository=repository,
        supabase_client=client,
    )

    assert response.access_token == "supabase-access-token"
    assert response.refresh_token == "supabase-refresh-token"
    assert response.expires_in == 3600
    assert response.user.id == "auth-teacher"
    assert response.user.role == "teacher"
    assert response.user.organization_id == "org-demo"


def test_supabase_login_requires_provisioned_profile(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "supabase")
    monkeypatch.delenv("SYSTEM_ADMIN_EMAILS", raising=False)
    monkeypatch.delenv("SYSTEM_ADMIN_USER_IDS", raising=False)

    with pytest.raises(HTTPException) as exc_info:
        authenticate_user(
            LoginRequest(email="teacher@example.edu", password="secret"),
            auth_repository=InMemoryAuthRepository(),
            supabase_client=FakeSupabaseAuthClient(),
        )

    assert exc_info.value.status_code == 403


def test_supabase_login_bootstraps_configured_system_admin(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "supabase")
    monkeypatch.setenv("SYSTEM_ADMIN_EMAILS", "owner@example.edu")
    repository = InMemoryAuthRepository()
    client = FakeSupabaseAuthClient(
        SupabaseAuthUser(
            id="auth-owner",
            email="owner@example.edu",
            name="TeachFlow Owner",
        )
    )

    response = authenticate_user(
        LoginRequest(email="owner@example.edu", password="secret"),
        auth_repository=repository,
        supabase_client=client,
    )

    assert response.user.role == "system_admin"
    assert response.user.organization_id == "org-platform"
    saved_profile = repository.get_profile("auth-owner")
    assert saved_profile is not None
    assert saved_profile.role == "system_admin"
    assert saved_profile.auth_provider == "supabase"


def test_supabase_me_validates_token_with_auth_server(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "supabase")
    repository = auth_repository_with_teacher()
    client = FakeSupabaseAuthClient()

    current_user = get_current_user_from_authorization(
        "Bearer supabase-access-token",
        auth_repository=repository,
        supabase_client=client,
    )

    assert current_user.email == "teacher@example.edu"
    assert current_user.role == "teacher"


def test_supabase_refresh_session_returns_new_access_token(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "supabase")
    repository = auth_repository_with_teacher()
    client = FakeSupabaseAuthClient()

    response = refresh_auth_session(
        RefreshSessionRequest(refresh_token="supabase-refresh-token"),
        auth_repository=repository,
        supabase_client=client,
    )

    assert response.access_token == "refreshed-access-token"
    assert response.refresh_token == "next-refresh-token"
    assert response.user.id == "auth-teacher"
    assert client.refreshed == ["supabase-refresh-token"]


def test_admin_creates_and_lists_idempotent_pending_invites() -> None:
    repository = InMemoryAuthRepository()
    admin = repository.get_profile("demo-admin")
    assert admin is not None

    payload = InviteCreateRequest(email="new.teacher@example.edu", role="teacher")
    first = create_user_invite(payload, admin, repository)
    second = create_user_invite(payload, admin, repository)

    assert first.id == second.id
    assert first.status == "pending"
    assert first.organization_id == admin.organization_id
    assert first.invited_by == admin.id

    invites = list_user_invites(admin, repository)
    assert [invite.email for invite in invites] == ["new.teacher@example.edu"]


def test_normal_invite_payload_cannot_request_system_admin_role() -> None:
    with pytest.raises(ValidationError):
        InviteCreateRequest(email="owner@example.edu", role="system_admin")


def test_system_admin_creates_organization_and_first_admin_invite() -> None:
    repository = InMemoryAuthRepository()
    system_admin = UserProfile(
        id="owner-1",
        email="owner@example.edu",
        name="TeachFlow Owner",
        role="system_admin",
        organization_id="org-platform",
    )

    organization = create_system_organization(
        SystemOrganizationCreateRequest(
            id="org-training-center",
            name="Training Center",
        ),
        system_admin,
        repository,
    )
    invite = create_system_admin_invite(
        organization.id,
        SystemAdminInviteCreateRequest(email="admin@training.edu"),
        system_admin,
        repository,
    )

    assert organization.id == "org-training-center"
    assert organization.name == "Training Center"
    assert invite.role == "admin"
    assert invite.organization_id == organization.id
    assert invite.invited_by == system_admin.id
    assert [
        organization.id
        for organization in list_system_organizations(system_admin, repository)
    ] == ["org-demo", "org-platform", "org-training-center"]


def test_org_admin_cannot_call_system_admin_services() -> None:
    repository = InMemoryAuthRepository()
    admin = repository.get_profile("demo-admin")
    assert admin is not None

    with pytest.raises(HTTPException) as exc_info:
        create_system_organization(
            SystemOrganizationCreateRequest(name="Blocked Org"),
            admin,
            repository,
        )

    assert exc_info.value.status_code == 403


def test_create_invite_upserts_current_admin_profile_for_persistence() -> None:
    repository = InMemoryAuthRepository(demo_accounts=[])
    admin = UserProfile(
        id="demo-admin",
        email="admin@teachflow.local",
        name="Admin Demo",
        role="admin",
        organization_id="org-demo",
    )

    invite = create_user_invite(
        InviteCreateRequest(email="new.teacher@example.edu", role="teacher"),
        admin,
        repository,
    )

    saved_admin = repository.get_profile("demo-admin")
    assert saved_admin is not None
    assert saved_admin.auth_provider == "demo"
    assert invite.invited_by == "demo-admin"


def test_admin_lists_managed_teacher_student_profiles_in_organization() -> None:
    repository = InMemoryAuthRepository()
    admin = repository.get_profile("demo-admin")
    assert admin is not None
    repository.upsert_profile(
        AuthProfileRecord(
            id="disabled-teacher",
            email="disabled.teacher@example.edu",
            name="Disabled Teacher",
            role="teacher",
            organization_id=admin.organization_id,
            auth_provider="demo",
            status="disabled",
        )
    )
    repository.upsert_profile(
        AuthProfileRecord(
            id="other-student",
            email="other.student@example.edu",
            name="Other Student",
            role="student",
            organization_id="org-other",
            auth_provider="demo",
            status="active",
        )
    )

    users = list_managed_users(admin, repository)
    user_ids = {user.id for user in users}

    assert "demo-teacher" in user_ids
    assert "demo-student" in user_ids
    assert "disabled-teacher" in user_ids
    assert "demo-admin" not in user_ids
    assert "other-student" not in user_ids
    assert {user.role for user in users} == {"teacher", "student"}

    disabled_users = list_managed_users(
        admin,
        repository,
        status_filter="disabled",
    )
    assert [user.id for user in disabled_users] == ["disabled-teacher"]

    teacher_users = list_managed_users(admin, repository, role_filter="teacher")
    assert {user.id for user in teacher_users} == {"demo-teacher", "disabled-teacher"}


def test_admin_disables_and_reactivates_managed_teacher_student() -> None:
    repository = InMemoryAuthRepository()
    admin = repository.get_profile("demo-admin")
    assert admin is not None

    disabled = update_managed_user_status(
        "demo-teacher",
        ManagedUserStatusUpdateRequest(status="disabled"),
        admin,
        repository,
    )

    assert disabled.status == "disabled"
    assert repository.get_profile("demo-teacher").status == "disabled"

    reactivated = update_managed_user_status(
        "demo-teacher",
        ManagedUserStatusUpdateRequest(status="active"),
        admin,
        repository,
    )

    assert reactivated.status == "active"
    assert repository.get_profile("demo-teacher").status == "active"


def test_admin_bulk_updates_managed_user_status_org_scoped() -> None:
    repository = InMemoryAuthRepository()
    admin = repository.get_profile("demo-admin")
    assert admin is not None
    repository.upsert_profile(
        AuthProfileRecord(
            id="other-student",
            email="other.student@example.edu",
            name="Other Student",
            role="student",
            organization_id="org-other",
            auth_provider="supabase",
            status="active",
        )
    )

    response = bulk_update_managed_user_status(
        ManagedUserBulkStatusUpdateRequest(
            user_ids=["demo-teacher", "demo-student", "demo-teacher"],
            status="disabled",
        ),
        admin,
        repository,
    )

    assert response.updated_count == 2
    assert {user.id for user in response.users} == {"demo-teacher", "demo-student"}
    assert repository.get_profile("demo-teacher").status == "disabled"
    assert repository.get_profile("demo-student").status == "disabled"

    with pytest.raises(HTTPException) as cross_org_error:
        bulk_update_managed_user_status(
            ManagedUserBulkStatusUpdateRequest(
                user_ids=["other-student"],
                status="disabled",
            ),
            admin,
            repository,
        )
    assert cross_org_error.value.status_code == 404

    with pytest.raises(HTTPException) as admin_target_error:
        bulk_update_managed_user_status(
            ManagedUserBulkStatusUpdateRequest(
                user_ids=["demo-admin"],
                status="disabled",
            ),
            admin,
            repository,
        )
    assert admin_target_error.value.status_code == 403


def test_admin_updates_managed_user_profile_fields_without_role_change() -> None:
    repository = InMemoryAuthRepository()
    admin = repository.get_profile("demo-admin")
    assert admin is not None

    updated = update_managed_user(
        "demo-teacher",
        ManagedUserUpdateRequest(
            name="Lead Teacher",
            email="lead.teacher@example.edu",
            status="disabled",
        ),
        admin,
        repository,
    )

    saved = repository.get_profile("demo-teacher")
    assert updated.name == "Lead Teacher"
    assert updated.email == "lead.teacher@example.edu"
    assert updated.status == "disabled"
    assert updated.role == "teacher"
    assert saved is not None
    assert saved.name == "Lead Teacher"
    assert saved.email == "lead.teacher@example.edu"
    assert saved.role == "teacher"
    assert saved.organization_id == admin.organization_id


def test_disabled_demo_profile_cannot_login_or_use_existing_session(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "demo")
    monkeypatch.setenv("ENABLE_DEMO_LOGIN", "true")
    repository = InMemoryAuthRepository()
    admin = repository.get_profile("demo-admin")
    assert admin is not None

    active_session = authenticate_demo_user(
        LoginRequest(email="teacher@teachflow.local", password="teachflow-demo"),
        auth_repository=repository,
    )
    update_managed_user_status(
        "demo-teacher",
        ManagedUserStatusUpdateRequest(status="disabled"),
        admin,
        repository,
    )

    with pytest.raises(HTTPException) as login_exc:
        authenticate_demo_user(
            LoginRequest(email="teacher@teachflow.local", password="teachflow-demo"),
            auth_repository=repository,
        )
    assert login_exc.value.status_code == 403

    with pytest.raises(HTTPException) as session_exc:
        get_current_user_from_authorization(
            f"Bearer {active_session.access_token}",
            auth_repository=repository,
        )
    assert session_exc.value.status_code == 403


def test_admin_user_management_rejects_wrong_role_admin_and_cross_org() -> None:
    repository = InMemoryAuthRepository()
    admin = repository.get_profile("demo-admin")
    teacher = repository.get_profile("demo-teacher")
    assert admin is not None
    assert teacher is not None
    repository.upsert_profile(
        AuthProfileRecord(
            id="other-student",
            email="other.student@example.edu",
            name="Other Student",
            role="student",
            organization_id="org-other",
            auth_provider="demo",
            status="active",
        )
    )

    with pytest.raises(HTTPException) as wrong_role:
        list_managed_users(teacher, repository)
    assert wrong_role.value.status_code == 403

    with pytest.raises(HTTPException) as admin_target:
        update_managed_user_status(
            "demo-admin",
            ManagedUserStatusUpdateRequest(status="disabled"),
            admin,
            repository,
        )
    assert admin_target.value.status_code == 403

    with pytest.raises(HTTPException) as cross_org:
        update_managed_user_status(
            "other-student",
            ManagedUserStatusUpdateRequest(status="disabled"),
            admin,
            repository,
        )
    assert cross_org.value.status_code == 404


class FakeSupabasePasswordResetClient:
    def __init__(self) -> None:
        self.reset_requests: list[tuple[str, str | None]] = []

    def reset_password_for_email(
        self,
        email: str,
        *,
        redirect_to: str | None = None,
    ) -> None:
        self.reset_requests.append((email, redirect_to))


def test_admin_bulk_password_reset_sends_only_active_supabase_users() -> None:
    repository = InMemoryAuthRepository()
    admin = repository.get_profile("demo-admin")
    assert admin is not None
    repository.upsert_profile(
        AuthProfileRecord(
            id="supabase-teacher",
            email="teacher.supabase@example.edu",
            name="Supabase Teacher",
            role="teacher",
            organization_id=admin.organization_id,
            auth_provider="supabase",
            status="active",
        )
    )
    repository.upsert_profile(
        AuthProfileRecord(
            id="disabled-supabase-student",
            email="disabled.student@example.edu",
            name="Disabled Student",
            role="student",
            organization_id=admin.organization_id,
            auth_provider="supabase",
            status="disabled",
        )
    )
    reset_client = FakeSupabasePasswordResetClient()

    response = bulk_request_managed_user_password_resets(
        ManagedUserBulkPasswordResetRequest(
            user_ids=[
                "supabase-teacher",
                "demo-teacher",
                "disabled-supabase-student",
            ],
            redirect_to="https://teachflow.example/reset-password",
        ),
        admin,
        repository,
        reset_client,
    )

    assert response.requested_count == 3
    assert response.sent_count == 1
    assert response.skipped_count == 2
    assert response.skipped_user_ids == [
        "demo-teacher",
        "disabled-supabase-student",
    ]
    assert reset_client.reset_requests == [
        ("teacher.supabase@example.edu", "https://teachflow.example/reset-password")
    ]


def test_accept_invite_registers_user_and_marks_invite_accepted(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "demo")
    repository = InMemoryAuthRepository()
    admin = repository.get_profile("demo-admin")
    assert admin is not None
    invite = create_user_invite(
        InviteCreateRequest(email="new.teacher@example.edu", role="teacher"),
        admin,
        repository,
    )

    response = accept_user_invite(
        AcceptInviteRequest(
            invite_code=invite.invite_code,
            email="New.Teacher@Example.edu",
            name="New Teacher",
            password="strong-password",
        ),
        auth_repository=repository,
    )

    assert response.user.email == "new.teacher@example.edu"
    assert response.user.role == "teacher"
    assert response.user.organization_id == admin.organization_id
    assert response.access_token
    assert repository.invites[invite.id].status == "accepted"
    assert repository.invites[invite.id].accepted_at is not None

    login_response = authenticate_user(
        LoginRequest(email="new.teacher@example.edu", password="strong-password"),
        auth_repository=repository,
    )
    assert login_response.user.id == response.user.id


def test_accept_invite_rejects_wrong_email_or_reuse(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "demo")
    repository = InMemoryAuthRepository()
    admin = repository.get_profile("demo-admin")
    assert admin is not None
    invite = create_user_invite(
        InviteCreateRequest(email="new.student@example.edu", role="student"),
        admin,
        repository,
    )

    with pytest.raises(HTTPException) as wrong_email:
        accept_user_invite(
            AcceptInviteRequest(
                invite_code=invite.invite_code,
                email="other@example.edu",
                name="Other",
                password="strong-password",
            ),
            auth_repository=repository,
        )
    assert wrong_email.value.status_code == 403

    accept_user_invite(
        AcceptInviteRequest(
            invite_code=invite.invite_code,
            email=invite.email,
            name="Student",
            password="strong-password",
        ),
        auth_repository=repository,
    )

    with pytest.raises(HTTPException) as reused:
        accept_user_invite(
            AcceptInviteRequest(
                invite_code=invite.invite_code,
                email=invite.email,
                name="Student Again",
                password="strong-password",
            ),
            auth_repository=repository,
        )
    assert reused.value.status_code == 400


def test_accept_invite_rejects_expired_invite(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "demo")
    repository = InMemoryAuthRepository()
    admin = repository.get_profile("demo-admin")
    assert admin is not None
    invite = create_user_invite(
        InviteCreateRequest(email="expired.teacher@example.edu", role="teacher"),
        admin,
        repository,
    )
    repository.invites[invite.id] = invite.model_copy(
        update={"expires_at": "2020-01-01T00:00:00+00:00"}
    )

    with pytest.raises(HTTPException) as exc_info:
        accept_user_invite(
            AcceptInviteRequest(
                invite_code=invite.invite_code,
                email=invite.email,
                name="Expired Teacher",
                password="strong-password",
            ),
            auth_repository=repository,
        )

    assert exc_info.value.status_code == 400


def test_student_cannot_create_invite() -> None:
    repository = InMemoryAuthRepository()
    student = repository.get_profile("demo-student")
    assert student is not None

    with pytest.raises(HTTPException) as exc_info:
        create_user_invite(
            InviteCreateRequest(email="new.teacher@example.edu", role="teacher"),
            student,
            repository,
        )

    assert exc_info.value.status_code == 403


def test_disabled_profile_cannot_use_existing_supabase_token(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "supabase")
    repository = InMemoryAuthRepository()
    repository.upsert_profile(
        AuthProfileRecord(
            id="auth-teacher",
            email="teacher@example.edu",
            name="Teacher Real",
            role="teacher",
            organization_id="org-demo",
            auth_provider="supabase",
            status="disabled",
        )
    )

    with pytest.raises(HTTPException) as exc_info:
        get_current_user_from_authorization(
            "Bearer supabase-access-token",
            auth_repository=repository,
            supabase_client=FakeSupabaseAuthClient(),
        )

    assert exc_info.value.status_code == 403
