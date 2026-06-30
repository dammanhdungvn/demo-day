from __future__ import annotations

import asyncio
import json
import logging
from types import SimpleNamespace
from typing import Any

from fastapi import Response

from app.auth.dependencies import get_current_user as auth_dependency_get_current_user
from app.observability import (
    build_observability_event,
    log_observability_event,
    request_logging_dispatch,
    sanitize_log_payload,
)
from main import (
    DocumentRecord,
    EmbeddingMetadata,
    LoginRequest,
    RetrievedChunkRecord,
    RetrievalRequest,
    UserProfile,
    authenticate_demo_user,
    reset_demo_sessions_for_tests,
    retrieve_relevant_chunks,
)


class FakeEmbeddingProvider:
    def metadata(self) -> EmbeddingMetadata:
        return EmbeddingMetadata(provider="local", model="test-embedding", dimensions=3)

    def embed_text(self, text: str) -> list[float]:
        assert text == "Transformer Architecture"
        return [0.1, 0.2, 0.3]


class FakeRetrievalRepository:
    def __init__(self) -> None:
        now = "2026-06-29T00:00:00+00:00"
        self.documents = [
            DocumentRecord(
                id="library-doc",
                title="Library Doc",
                file_name="library.pdf",
                file_hash="hash-library",
                source_type="pdf",
                status="completed",
                organization_id="org-demo",
                knowledge_scope="library",
                owner_user_id=None,
                chunk_count=1,
                last_ingested_at=now,
                error_message=None,
                is_active=True,
                created_at=now,
                updated_at=now,
            ),
            DocumentRecord(
                id="context-doc",
                title="Context Doc",
                file_name="context.pdf",
                file_hash="hash-context",
                source_type="pdf",
                status="completed",
                organization_id="org-demo",
                knowledge_scope="contextual",
                owner_user_id="demo-teacher",
                chunk_count=1,
                last_ingested_at=now,
                error_message=None,
                is_active=True,
                created_at=now,
                updated_at=now,
            ),
        ]
        self.chunks = [
            RetrievedChunkRecord(
                chunk_id="chunk-library",
                document_id="library-doc",
                document_title="Library Doc",
                page_number=1,
                chunk_index=0,
                excerpt="Library grounding",
                score=0.9,
            ),
            RetrievedChunkRecord(
                chunk_id="chunk-context",
                document_id="context-doc",
                document_title="Context Doc",
                page_number=2,
                chunk_index=0,
                excerpt="Context grounding",
                score=0.8,
            ),
        ]

    def list_documents(self) -> list[DocumentRecord]:
        return self.documents

    def get_documents_by_ids(self, document_ids: list[str]) -> list[DocumentRecord]:
        selected = set(document_ids)
        return [document for document in self.documents if document.id in selected]

    def search_chunks(
        self,
        *,
        topic: str,
        selected_document_ids: list[str],
        query_embedding: list[float],
        top_k: int,
    ) -> list[RetrievedChunkRecord]:
        allowed = set(selected_document_ids)
        return [chunk for chunk in self.chunks if chunk.document_id in allowed][:top_k]

    def save_retrieval_job(
        self,
        *,
        topic: str,
        selected_document_ids: list[str],
        chunks: list[RetrievedChunkRecord],
    ) -> str:
        return "job-retrieval-1"


class FakeHeaders(dict[str, str]):
    def get(self, key: str, default: str | None = None) -> str | None:
        return super().get(key) or super().get(key.lower()) or default


def fake_request(
    *,
    path: str,
    request_id: str | None = None,
    actor_context: dict[str, str] | None = None,
) -> SimpleNamespace:
    headers = FakeHeaders()
    if request_id:
        headers["X-Request-ID"] = request_id
    state = SimpleNamespace()
    if actor_context is not None:
        state.actor_context = actor_context
    return SimpleNamespace(
        headers=headers,
        state=state,
        method="GET",
        url=SimpleNamespace(path=path),
        scope={"route": SimpleNamespace(path=path)},
    )


def logged_json(caplog: Any) -> list[dict[str, Any]]:
    payloads = []
    for record in caplog.records:
        try:
            payloads.append(json.loads(record.getMessage()))
        except json.JSONDecodeError:
            continue
    return payloads


def test_sanitize_log_payload_redacts_secret_values() -> None:
    payload = {
        "Authorization": "Bearer secret-token",
        "OPENAI_API_KEY": "sk-secret",
        "nested": {
            "password": "secret-password",
            "safe": "visible",
            "items": [{"refresh_token": "refresh-secret"}],
        },
    }

    sanitized = sanitize_log_payload(payload)

    assert sanitized["Authorization"] == "[REDACTED]"
    assert sanitized["OPENAI_API_KEY"] == "[REDACTED]"
    assert sanitized["nested"]["password"] == "[REDACTED]"
    assert sanitized["nested"]["items"][0]["refresh_token"] == "[REDACTED]"
    assert sanitized["nested"]["safe"] == "visible"


def test_build_observability_event_has_required_fields_and_redacts() -> None:
    event = build_observability_event(
        "rag.retrieval.completed",
        request_id="request-1",
        actor_id="demo-teacher",
        role="teacher",
        organization_id="org-demo",
        job_id="job-1",
        top_k=5,
        selected_document_count=2,
        Authorization="Bearer secret",
    )

    assert event["event"] == "rag.retrieval.completed"
    assert event["request_id"] == "request-1"
    assert event["actor_id"] == "demo-teacher"
    assert event["role"] == "teacher"
    assert event["organization_id"] == "org-demo"
    assert event["job_id"] == "job-1"
    assert event["top_k"] == 5
    assert event["selected_document_count"] == 2
    assert event["Authorization"] == "[REDACTED]"
    assert event["timestamp"]


def test_request_id_middleware_preserves_header_and_logs_request(
    caplog: Any,
) -> None:
    caplog.set_level(logging.INFO, logger="teachflow.observability")

    async def call_next(_: Any) -> Response:
        log_observability_event("workflow.inside")
        return Response(status_code=200)

    response = asyncio.run(
        request_logging_dispatch(
            fake_request(path="/api/v1/health", request_id="manual-request-1"),
            call_next,
        )
    )
    payloads = logged_json(caplog)

    assert response.status_code == 200
    assert response.headers["x-request-id"] == "manual-request-1"
    assert any(
        payload["event"] == "api.request.completed"
        and payload["request_id"] == "manual-request-1"
        and payload["method"] == "GET"
        and payload["path"] == "/api/v1/health"
        and payload["status_code"] == 200
        and isinstance(payload["duration_ms"], int | float)
        for payload in payloads
    )
    assert any(
        payload["event"] == "workflow.inside"
        and payload["request_id"] == "manual-request-1"
        for payload in payloads
    )


def test_request_log_includes_actor_context_for_authenticated_request(
    caplog: Any,
) -> None:
    reset_demo_sessions_for_tests()
    session = authenticate_demo_user(
        LoginRequest(email="teacher@teachflow.local", password="teachflow-demo")
    )
    dependency_request = SimpleNamespace(state=SimpleNamespace())
    current_user = auth_dependency_get_current_user(
        dependency_request,
        authorization=f"Bearer {session.access_token}",
    )
    caplog.set_level(logging.INFO, logger="teachflow.observability")

    async def call_next(_: Any) -> Response:
        return Response(status_code=200)

    response = asyncio.run(
        request_logging_dispatch(
            fake_request(
                path="/api/v1/me",
                request_id="auth-request-1",
                actor_context=dependency_request.state.actor_context,
            ),
            call_next,
        )
    )
    payloads = logged_json(caplog)

    assert current_user.id == "demo-teacher"
    assert response.status_code == 200
    assert response.headers["x-request-id"] == "auth-request-1"
    assert any(
        payload["event"] == "api.request.completed"
        and payload["request_id"] == "auth-request-1"
        and payload["actor_id"] == "demo-teacher"
        and payload["role"] == "teacher"
        and payload["organization_id"] == "org-demo"
        for payload in payloads
    )


def test_rag_retrieval_logs_semantic_flow_event(caplog: Any) -> None:
    caplog.set_level(logging.INFO, logger="teachflow.observability")
    teacher = UserProfile(
        id="demo-teacher",
        email="teacher@teachflow.local",
        name="Teacher Demo",
        role="teacher",
        organization_id="org-demo",
    )

    response = retrieve_relevant_chunks(
        RetrievalRequest(
            topic="Transformer Architecture",
            selected_document_ids=["context-doc"],
            top_k=5,
        ),
        teacher,
        FakeRetrievalRepository(),
        embedding_provider=FakeEmbeddingProvider(),
    )

    payloads = logged_json(caplog)

    assert response.generation_job_id == "job-retrieval-1"
    assert any(
        payload["event"] == "rag.retrieval.completed"
        and payload["actor_id"] == "demo-teacher"
        and payload["role"] == "teacher"
        and payload["organization_id"] == "org-demo"
        and payload["generation_job_id"] == "job-retrieval-1"
        and payload["selected_contextual_document_count"] == 1
        and payload["contextual_candidate_count"] == 1
        and payload["active_library_document_count"] == 1
        and payload["candidate_document_count"] == 2
        and payload["retrieved_chunk_count"] == 2
        and payload["embedding_provider"] == "local"
        and payload["embedding_model"] == "test-embedding"
        for payload in payloads
    )
