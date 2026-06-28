from fastapi import HTTPException
import pytest

from main import (
    LoginRequest,
    authenticate_demo_user,
    create_session_token,
    get_current_user_from_authorization,
    list_public_demo_accounts,
    require_role,
    reset_demo_sessions_for_tests,
)


@pytest.fixture(autouse=True)
def clear_demo_sessions() -> None:
    reset_demo_sessions_for_tests()


def test_demo_accounts_include_all_required_roles_without_passwords() -> None:
    accounts = list_public_demo_accounts()

    assert {account.role for account in accounts} == {"admin", "teacher", "student"}
    assert all(account.email.endswith("@teachflow.local") for account in accounts)


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
