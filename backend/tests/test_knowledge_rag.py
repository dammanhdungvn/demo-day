from fastapi import HTTPException
import pytest

from main import (
    DocumentRecord,
    LoginRequest,
    RetrievedChunkRecord,
    RetrievalRequest,
    UserProfile,
    authenticate_demo_user,
    list_source_documents,
    reset_demo_sessions_for_tests,
    retrieve_relevant_chunks,
)


class FakeKnowledgeRepository:
    def __init__(
        self,
        documents: list[DocumentRecord],
        chunks: list[RetrievedChunkRecord] | None = None,
    ) -> None:
        self.documents = documents
        self.chunks = chunks or []
        self.last_selected_document_ids: list[str] = []
        self.saved_jobs: list[dict[str, object]] = []

    def list_documents(self) -> list[DocumentRecord]:
        return self.documents

    def get_documents_by_ids(self, document_ids: list[str]) -> list[DocumentRecord]:
        selected_ids = set(document_ids)
        return [doc for doc in self.documents if doc.id in selected_ids]

    def search_chunks(
        self,
        *,
        topic: str,
        selected_document_ids: list[str],
        query_embedding: list[float],
        top_k: int,
    ) -> list[RetrievedChunkRecord]:
        self.last_selected_document_ids = selected_document_ids
        assert topic == "Transformer Architecture"
        assert len(query_embedding) == 384
        allowed_ids = set(selected_document_ids)
        return [chunk for chunk in self.chunks if chunk.document_id in allowed_ids][
            :top_k
        ]

    def save_retrieval_job(
        self,
        *,
        topic: str,
        selected_document_ids: list[str],
        chunks: list[RetrievedChunkRecord],
    ) -> str:
        self.saved_jobs.append(
            {
                "topic": topic,
                "selected_document_ids": selected_document_ids,
                "chunk_ids": [chunk.chunk_id for chunk in chunks],
            }
        )
        return "job-1"


@pytest.fixture(autouse=True)
def clear_state() -> None:
    reset_demo_sessions_for_tests()


def teacher_user() -> UserProfile:
    return authenticate_demo_user(
        LoginRequest(email="teacher@teachflow.local", password="teachflow-demo")
    ).user


def student_user() -> UserProfile:
    return authenticate_demo_user(
        LoginRequest(email="student@teachflow.local", password="teachflow-demo")
    ).user


def sample_documents() -> list[DocumentRecord]:
    return [
        DocumentRecord(
            id="doc-completed",
            title="Building Applications with AI Agents",
            file_name="building applications with ai agents.pdf",
            file_hash="hash-a",
            source_type="pdf",
            status="completed",
            chunk_count=12,
            last_ingested_at="2026-06-28T00:00:00+00:00",
            error_message=None,
            created_at="2026-06-28T00:00:00+00:00",
            updated_at="2026-06-28T00:00:00+00:00",
        ),
        DocumentRecord(
            id="doc-failed",
            title="Failed Source",
            file_name="failed.pdf",
            file_hash="hash-b",
            source_type="pdf",
            status="failed",
            chunk_count=0,
            last_ingested_at=None,
            error_message="extract failed",
            created_at="2026-06-28T00:00:00+00:00",
            updated_at="2026-06-28T00:00:00+00:00",
        ),
    ]


def test_teacher_lists_source_documents_with_status_metadata() -> None:
    repository = FakeKnowledgeRepository(sample_documents())

    documents = list_source_documents(
        current_user=teacher_user(),
        repository=repository,
    )

    assert [doc.id for doc in documents] == ["doc-completed", "doc-failed"]
    assert documents[0].chunk_count == 12
    assert documents[1].status == "failed"
    assert documents[1].error_message == "extract failed"


def test_student_cannot_list_source_documents() -> None:
    repository = FakeKnowledgeRepository(sample_documents())

    with pytest.raises(HTTPException) as exc_info:
        list_source_documents(current_user=student_user(), repository=repository)

    assert exc_info.value.status_code == 403


def test_retrieval_uses_only_selected_completed_documents_and_saves_context() -> None:
    repository = FakeKnowledgeRepository(
        sample_documents(),
        chunks=[
            RetrievedChunkRecord(
                chunk_id="chunk-1",
                document_id="doc-completed",
                document_title="Building Applications with AI Agents",
                page_number=42,
                chunk_index=3,
                excerpt="Transformer agents use context windows and tool calls.",
                score=0.91,
            ),
            RetrievedChunkRecord(
                chunk_id="chunk-other",
                document_id="doc-other",
                document_title="Other Source",
                page_number=1,
                chunk_index=0,
                excerpt="This must not be returned.",
                score=0.5,
            ),
        ],
    )

    response = retrieve_relevant_chunks(
        payload=RetrievalRequest(
            topic="Transformer Architecture",
            selected_document_ids=["doc-completed"],
            top_k=5,
        ),
        current_user=teacher_user(),
        repository=repository,
    )

    assert repository.last_selected_document_ids == ["doc-completed"]
    assert response.generation_job_id == "job-1"
    assert [chunk.chunk_id for chunk in response.chunks] == ["chunk-1"]
    assert response.chunks[0].document_title == "Building Applications with AI Agents"
    assert response.chunks[0].page_number == 42
    assert repository.saved_jobs == [
        {
            "topic": "Transformer Architecture",
            "selected_document_ids": ["doc-completed"],
            "chunk_ids": ["chunk-1"],
        }
    ]


def test_retrieval_rejects_failed_or_missing_documents() -> None:
    repository = FakeKnowledgeRepository(sample_documents())

    for selected_ids in (["doc-failed"], ["doc-missing"]):
        with pytest.raises(HTTPException) as exc_info:
            retrieve_relevant_chunks(
                payload=RetrievalRequest(
                    topic="Transformer Architecture",
                    selected_document_ids=selected_ids,
                    top_k=5,
                ),
                current_user=teacher_user(),
                repository=repository,
            )

        assert exc_info.value.status_code == 400


def test_student_cannot_run_retrieval() -> None:
    repository = FakeKnowledgeRepository(sample_documents())

    with pytest.raises(HTTPException) as exc_info:
        retrieve_relevant_chunks(
            payload=RetrievalRequest(
                topic="Transformer Architecture",
                selected_document_ids=["doc-completed"],
                top_k=5,
            ),
            current_user=student_user(),
            repository=repository,
        )

    assert exc_info.value.status_code == 403
