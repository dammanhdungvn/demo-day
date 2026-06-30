import pytest


@pytest.fixture(autouse=True)
def default_backend_test_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AUTH_PROVIDER", "demo")
    monkeypatch.setenv("AUTH_REPOSITORY", "memory")
    monkeypatch.setenv("LEARNING_REPOSITORY", "memory")
    monkeypatch.setenv("ENABLE_DEMO_LOGIN", "true")
