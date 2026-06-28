from datetime import datetime

from fastapi.routing import APIRoute

from main import app, health


def test_health_route_is_registered() -> None:
    routes = [route for route in app.routes if isinstance(route, APIRoute)]

    assert any(
        route.path == "/api/v1/health" and "GET" in route.methods
        for route in routes
    )


def test_health_payload_returns_ok() -> None:
    payload = health()

    assert payload["status"] == "ok"
    assert payload["service"] == "teachflow-api"
    assert payload["version"]
    assert datetime.fromisoformat(payload["timestamp"])
