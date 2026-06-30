from fastapi import HTTPException
import pytest

from main import (
    AcceptInviteRequest,
    AuthProfileRecord,
    DemoLoginRequest,
    InMemoryAuthRepository,
    InviteCreateRequest,
    LoginRequest,
    RefreshSessionRequest,
    SupabaseAuthSession,
    SupabaseAuthUser,
    UserProfile,
    accept_user_invite,
    authenticate_demo_account,
    authenticate_demo_user,
    authenticate_user,
    create_session_token,
    create_user_invite,
    get_current_user_from_authorization,
    list_user_invites,
    list_public_demo_accounts,
    refresh_auth_session,
    require_role,
    reset_demo_sessions_for_tests,
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
    def __init__(self) -> None:
        self.signed_in: list[LoginRequest] = []
        self.refreshed: list[str] = []
        self.users_by_token = {
            "supabase-access-token": SupabaseAuthUser(
                id="auth-teacher",
                email="teacher@example.edu",
                name="Teacher Real",
            ),
            "refreshed-access-token": SupabaseAuthUser(
                id="auth-teacher",
                email="teacher@example.edu",
                name="Teacher Real",
            ),
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

    with pytest.raises(HTTPException) as exc_info:
        authenticate_user(
            LoginRequest(email="teacher@example.edu", password="secret"),
            auth_repository=InMemoryAuthRepository(),
            supabase_client=FakeSupabaseAuthClient(),
        )

    assert exc_info.value.status_code == 403


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
