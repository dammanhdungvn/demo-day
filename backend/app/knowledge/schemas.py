from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

from ..jobs.schemas import GenerationJobResponse

DocumentStatus = Literal["processing", "completed", "failed"]
DocumentUploadJobStatus = Literal["processing", "completed", "failed", "skipped"]
DocumentIngestionAction = Literal["ingested", "skipped", "reingested", "failed"]
DocumentKnowledgeScope = Literal["library", "contextual"]
DocumentStorageStatus = Literal["metadata_only", "stored", "not_applicable"]


class DocumentRecord(BaseModel):
    id: str
    title: str
    file_name: str
    file_hash: str
    source_type: str
    status: DocumentStatus
    organization_id: str | None = None
    knowledge_scope: DocumentKnowledgeScope = "library"
    owner_user_id: str | None = None
    file_size_bytes: int | None = None
    storage_provider: str = "metadata"
    storage_bucket: str | None = None
    storage_path: str | None = None
    storage_status: DocumentStorageStatus = "metadata_only"
    retention_expires_at: str | None = None
    quota_limit_bytes: int | None = None
    quota_used_bytes: int | None = None
    provenance: dict[str, Any] = Field(default_factory=dict)
    chunk_count: int
    last_ingested_at: str | None
    error_message: str | None
    is_active: bool = True
    created_at: str
    updated_at: str


class DocumentMetadataUpdateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=300)

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Title must not be blank")
        return stripped


class DocumentUploadResponse(BaseModel):
    generation_job_id: str
    job_status: DocumentUploadJobStatus
    ingestion_action: DocumentIngestionAction
    document: DocumentRecord
    message: str


class UserKnowledgeExportResponse(BaseModel):
    user_id: str
    organization_id: str | None
    document_count: int
    documents: list[DocumentRecord]


class UserKnowledgeDeleteResponse(BaseModel):
    user_id: str
    organization_id: str | None
    archived_document_count: int
    document_ids: list[str]


class UrlIngestionRequest(BaseModel):
    url: str = Field(min_length=8, max_length=2000)

    @field_validator("url")
    @classmethod
    def url_must_not_be_blank(cls, value: str) -> str:
        url = value.strip()
        if not url:
            raise ValueError("URL must not be blank")
        return url


class FetchedWebPage(BaseModel):
    url: str
    content_type: str
    content: bytes


class ExtractedWebPage(BaseModel):
    url: str
    title: str
    text: str


class EmbeddingMetadata(BaseModel):
    provider: str
    model: str
    dimensions: int


class DocumentReindexResponse(BaseModel):
    document: DocumentRecord
    generation_job: GenerationJobResponse
    chunk_count: int
    embedding: EmbeddingMetadata
    message: str


class DocumentReindexResult(BaseModel):
    document: DocumentRecord
    chunk_count: int
    embedding: EmbeddingMetadata


class DocumentIngestionPlan(BaseModel):
    action: DocumentIngestionAction
    document_id: str | None = None


class RetrievedChunkRecord(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    source_url: str | None = None
    page_number: int | None
    chunk_index: int
    excerpt: str
    score: float


class RetrievalRequest(BaseModel):
    topic: str = Field(min_length=3, max_length=500)
    selected_document_ids: list[str] = Field(default_factory=list, max_length=20)
    top_k: int = Field(default=5, ge=1, le=10)


class RetrievalResponse(BaseModel):
    topic: str
    selected_document_ids: list[str]
    generation_job_id: str
    chunks: list[RetrievedChunkRecord]
