import pytest
from pydantic import ValidationError

from app.knowledge.schemas import (
    DocumentIngestionAction,
    DocumentIngestionPlan,
    DocumentKnowledgeScope,
    DocumentRecord,
    DocumentReindexResponse,
    DocumentReindexResult,
    DocumentStatus,
    DocumentUploadJobStatus,
    DocumentUploadResponse,
    EmbeddingMetadata,
    ExtractedWebPage,
    FetchedWebPage,
    RetrievedChunkRecord,
    RetrievalRequest,
    RetrievalResponse,
    UrlIngestionRequest,
)
from main import DocumentIngestionAction as MainDocumentIngestionAction
from main import DocumentIngestionPlan as MainDocumentIngestionPlan
from main import DocumentKnowledgeScope as MainDocumentKnowledgeScope
from main import DocumentRecord as MainDocumentRecord
from main import DocumentReindexResponse as MainDocumentReindexResponse
from main import DocumentReindexResult as MainDocumentReindexResult
from main import DocumentStatus as MainDocumentStatus
from main import DocumentUploadJobStatus as MainDocumentUploadJobStatus
from main import DocumentUploadResponse as MainDocumentUploadResponse
from main import EmbeddingMetadata as MainEmbeddingMetadata
from main import ExtractedWebPage as MainExtractedWebPage
from main import FetchedWebPage as MainFetchedWebPage
from main import RetrievedChunkRecord as MainRetrievedChunkRecord
from main import RetrievalRequest as MainRetrievalRequest
from main import RetrievalResponse as MainRetrievalResponse
from main import UrlIngestionRequest as MainUrlIngestionRequest


def sample_document() -> DocumentRecord:
    return DocumentRecord(
        id="doc-1",
        title="AI Agents",
        file_name="agents.pdf",
        file_hash="hash-1",
        source_type="pdf",
        status="completed",
        organization_id="org-demo",
        knowledge_scope="library",
        owner_user_id=None,
        chunk_count=12,
        last_ingested_at="2026-06-29T00:00:00+00:00",
        error_message=None,
        created_at="2026-06-29T00:00:00+00:00",
        updated_at="2026-06-29T00:00:00+00:00",
    )


def sample_chunk() -> RetrievedChunkRecord:
    return RetrievedChunkRecord(
        chunk_id="chunk-1",
        document_id="doc-1",
        document_title="AI Agents",
        source_url=None,
        page_number=3,
        chunk_index=2,
        excerpt="Agents use tools and memory.",
        score=0.92,
    )


def test_knowledge_schemas_keep_main_compatibility_exports() -> None:
    assert MainDocumentStatus is DocumentStatus
    assert MainDocumentUploadJobStatus is DocumentUploadJobStatus
    assert MainDocumentIngestionAction is DocumentIngestionAction
    assert MainDocumentKnowledgeScope is DocumentKnowledgeScope
    assert MainDocumentRecord is DocumentRecord
    assert MainDocumentUploadResponse is DocumentUploadResponse
    assert MainUrlIngestionRequest is UrlIngestionRequest
    assert MainFetchedWebPage is FetchedWebPage
    assert MainExtractedWebPage is ExtractedWebPage
    assert MainEmbeddingMetadata is EmbeddingMetadata
    assert MainDocumentReindexResponse is DocumentReindexResponse
    assert MainDocumentReindexResult is DocumentReindexResult
    assert MainDocumentIngestionPlan is DocumentIngestionPlan
    assert MainRetrievedChunkRecord is RetrievedChunkRecord
    assert MainRetrievalRequest is RetrievalRequest
    assert MainRetrievalResponse is RetrievalResponse


def test_knowledge_schemas_validate_document_retrieval_and_url_shapes() -> None:
    document = sample_document()
    chunk = sample_chunk()
    embedding = EmbeddingMetadata(
        provider="local-hash",
        model="local-hash-v1",
        dimensions=384,
    )

    assert document.is_active is True
    assert document.knowledge_scope == "library"
    assert document.owner_user_id is None
    assert chunk.source_url is None
    assert DocumentIngestionPlan(action="ingested").document_id is None
    assert DocumentUploadResponse(
        generation_job_id="job-1",
        job_status="completed",
        ingestion_action="ingested",
        document=document,
        message="Uploaded.",
    ).document is document
    assert DocumentReindexResult(
        document=document,
        chunk_count=12,
        embedding=embedding,
    ).embedding is embedding
    assert DocumentReindexResponse(
        document=document,
        generation_job={
            "id": "job-1",
            "job_type": "embedding_reindex",
            "status": "completed",
            "actor_id": "teacher-1",
            "actor_role": "teacher",
            "input": {},
            "retrieved_context": [],
            "output": {},
            "error_message": None,
            "created_at": "2026-06-29T00:00:00+00:00",
            "updated_at": "2026-06-29T00:00:00+00:00",
        },
        chunk_count=12,
        embedding=embedding,
        message="Re-indexed.",
    ).chunk_count == 12
    assert RetrievalResponse(
        topic="Transformer Architecture",
        selected_document_ids=["doc-1"],
        generation_job_id="job-1",
        chunks=[chunk],
    ).chunks == [chunk]
    assert UrlIngestionRequest(url="  https://docs.example.edu/agents  ").url == (
        "https://docs.example.edu/agents"
    )
    assert FetchedWebPage(
        url="https://docs.example.edu/agents",
        content_type="text/html",
        content=b"<html>Agents</html>",
    ).content_type == "text/html"
    assert ExtractedWebPage(
        url="https://docs.example.edu/agents",
        title="Agents",
        text="Agents use tools.",
    ).title == "Agents"

    with pytest.raises(ValidationError):
        RetrievalRequest(
            topic="AI",
            selected_document_ids=["doc-1"],
            top_k=11,
        )

    with pytest.raises(ValidationError):
        UrlIngestionRequest(url="   ")
