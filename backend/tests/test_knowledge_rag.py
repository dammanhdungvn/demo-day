from fastapi import HTTPException
import asyncio
import inspect
import json
import socket
import urllib.request
import pytest
from pypdf.errors import DependencyError, WrongPasswordError

import app.main as app_main_module
from main import (
    DocumentMetadataUpdateRequest,
    DocumentUploadResponse,
    EmbeddingMetadata,
    FetchedWebPage,
    InMemoryGenerationJobRepository,
    DocumentRecord,
    LoginRequest,
    PdfUploadChunk,
    RetrievedChunkRecord,
    RetrievalRequest,
    SafeWebRedirectHandler,
    SupabaseKnowledgeRepository,
    UrlIngestionRequest,
    UserProfile,
    archive_source_document,
    authenticate_demo_user,
    delete_user_contextual_knowledge,
    determine_document_ingestion_action,
    document_scope_for_upload,
    export_user_contextual_knowledge,
    extract_web_page_text,
    ingest_source_url,
    list_source_documents,
    pdf_extraction_failure_message,
    queue_source_document_upload,
    reindex_source_document,
    reset_demo_sessions_for_tests,
    retrieve_relevant_chunks,
    retry_embedding_reindex_job,
    upload_source_document,
    validate_web_ingestion_url,
    update_source_document_metadata,
)


def governance_fields(governance: dict[str, object] | None) -> dict[str, object]:
    governance = governance or {}
    return {
        "file_size_bytes": governance.get("file_size_bytes"),
        "storage_provider": governance.get("storage_provider", "metadata"),
        "storage_bucket": governance.get("storage_bucket"),
        "storage_path": governance.get("storage_path"),
        "storage_status": governance.get("storage_status", "metadata_only"),
        "retention_expires_at": governance.get("retention_expires_at"),
        "quota_limit_bytes": governance.get("quota_limit_bytes"),
        "quota_used_bytes": governance.get("quota_used_bytes"),
        "provenance": governance.get("provenance", {}),
    }


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
        self.uploads: list[dict[str, object]] = []
        self.queued_uploads: list[dict[str, object]] = []
        self.processed_jobs: list[dict[str, object]] = []
        self.reindexed_documents: list[dict[str, object]] = []
        self.last_query_embedding: list[float] = []

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
        self.last_query_embedding = query_embedding
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

    def ingest_uploaded_pdf(
        self,
        *,
        file_name: str,
        file_bytes: bytes,
        uploaded_by: UserProfile,
        governance: dict[str, object] | None = None,
    ) -> DocumentUploadResponse:
        knowledge_scope, owner_user_id = document_scope_for_upload(uploaded_by)
        self.uploads.append(
            {
                "file_name": file_name,
                "file_bytes": file_bytes,
                "uploaded_by": uploaded_by.id,
                "knowledge_scope": knowledge_scope,
                "owner_user_id": owner_user_id,
                "governance": governance or {},
            }
        )
        document = DocumentRecord(
            id="doc-upload",
            title="Uploaded Knowledge",
            file_name=file_name,
            file_hash="hash-upload",
            source_type="pdf",
            status="completed",
            knowledge_scope=knowledge_scope,
            owner_user_id=owner_user_id,
            **governance_fields(governance),
            chunk_count=2,
            last_ingested_at="2026-06-28T00:00:00+00:00",
            error_message=None,
            created_at="2026-06-28T00:00:00+00:00",
            updated_at="2026-06-28T00:00:00+00:00",
        )
        return DocumentUploadResponse(
            generation_job_id="job-upload",
            job_status="completed",
            document=document,
            ingestion_action="ingested",
            message="Upload processed.",
        )

    def queue_uploaded_pdf_ingestion(
        self,
        *,
        file_name: str,
        file_bytes: bytes,
        uploaded_by: UserProfile,
        governance: dict[str, object] | None = None,
    ) -> DocumentUploadResponse:
        knowledge_scope, owner_user_id = document_scope_for_upload(uploaded_by)
        self.queued_uploads.append(
            {
                "file_name": file_name,
                "file_bytes": file_bytes,
                "uploaded_by": uploaded_by.id,
                "knowledge_scope": knowledge_scope,
                "owner_user_id": owner_user_id,
                "governance": governance or {},
            }
        )
        document = DocumentRecord(
            id="doc-upload",
            title="Uploaded Knowledge",
            file_name=file_name,
            file_hash="hash-upload",
            source_type="pdf",
            status="processing",
            knowledge_scope=knowledge_scope,
            owner_user_id=owner_user_id,
            **governance_fields(governance),
            chunk_count=0,
            last_ingested_at=None,
            error_message=None,
            created_at="2026-06-28T00:00:00+00:00",
            updated_at="2026-06-28T00:00:00+00:00",
        )
        return DocumentUploadResponse(
            generation_job_id="job-upload",
            job_status="processing",
            document=document,
            ingestion_action="ingested",
            message="Document ingestion queued.",
        )

    def process_uploaded_pdf_ingestion(
        self,
        *,
        generation_job_id: str,
        document_id: str,
        file_name: str,
        file_bytes: bytes,
        uploaded_by: UserProfile,
    ) -> None:
        self.processed_jobs.append(
            {
                "generation_job_id": generation_job_id,
                "document_id": document_id,
                "file_name": file_name,
                "file_bytes": file_bytes,
                "uploaded_by": uploaded_by.id,
            }
        )

    def archive_document(
        self,
        *,
        document_id: str,
        archived_by: UserProfile,
    ) -> DocumentRecord:
        for index, document in enumerate(self.documents):
            if document.id == document_id:
                archived_document = document.model_copy(update={"is_active": False})
                self.documents[index] = archived_document
                return archived_document
        raise HTTPException(status_code=404, detail="Document not found")

    def update_document_metadata(
        self,
        *,
        document_id: str,
        title: str,
        updated_by: UserProfile,
    ) -> DocumentRecord:
        for index, document in enumerate(self.documents):
            if document.id == document_id:
                updated_document = document.model_copy(
                    update={
                        "title": title,
                        "updated_at": "2026-06-30T00:00:00+00:00",
                    }
                )
                self.documents[index] = updated_document
                return updated_document
        raise HTTPException(status_code=404, detail="Document not found")

    def reindex_document_embeddings(
        self,
        *,
        document_id: str,
        embedding_provider,
    ):
        document = next(
            (candidate for candidate in self.documents if candidate.id == document_id),
            None,
        )
        if document is None:
            raise HTTPException(status_code=404, detail="Document not found")
        if document.status != "completed" or not document.is_active:
            raise HTTPException(status_code=400, detail="Only active completed documents can be re-indexed")
        metadata = embedding_provider.metadata()
        self.reindexed_documents.append(
            {
                "document_id": document_id,
                "embedding_model": metadata.model,
                "embedding_provider": metadata.provider,
                "embedding_dimensions": metadata.dimensions,
            }
        )
        return {
            "document": document,
            "chunk_count": 2,
            "embedding": metadata,
        }

    def ingest_web_page(
        self,
        *,
        url: str,
        title: str,
        text: str,
        ingested_by: UserProfile,
        governance: dict[str, object] | None = None,
    ) -> DocumentUploadResponse:
        knowledge_scope, owner_user_id = document_scope_for_upload(ingested_by)
        self.uploads.append(
            {
                "url": url,
                "title": title,
                "text": text,
                "ingested_by": ingested_by.id,
                "organization_id": ingested_by.organization_id,
                "knowledge_scope": knowledge_scope,
                "owner_user_id": owner_user_id,
                "governance": governance or {},
            }
        )
        document = DocumentRecord(
            id="doc-web",
            title=title,
            file_name=url,
            file_hash="hash-web",
            source_type="web",
            status="completed",
            organization_id=ingested_by.organization_id,
            knowledge_scope=knowledge_scope,
            owner_user_id=owner_user_id,
            **governance_fields(governance),
            chunk_count=1,
            last_ingested_at="2026-06-28T00:00:00+00:00",
            error_message=None,
            created_at="2026-06-28T00:00:00+00:00",
            updated_at="2026-06-28T00:00:00+00:00",
        )
        return DocumentUploadResponse(
            generation_job_id="job-web",
            job_status="completed",
            document=document,
            ingestion_action="ingested",
            message="Web page ingested.",
        )


class FakeEmbeddingProvider:
    def metadata(self) -> EmbeddingMetadata:
        return EmbeddingMetadata(
            provider="fake",
            model="fake-embedding-v1",
            dimensions=384,
        )

    def embed_text(self, text: str) -> list[float]:
        vector = [0.0] * 384
        vector[0] = 0.25
        return vector


class FakeUploadFile:
    def __init__(
        self,
        *,
        filename: str,
        content_type: str,
        content: bytes,
    ) -> None:
        self.filename = filename
        self.content_type = content_type
        self._content = content
        self._offset = 0

    async def read(self, size: int = -1) -> bytes:
        if size < 0:
            remaining = self._content[self._offset :]
            self._offset = len(self._content)
            return remaining

        end = min(self._offset + size, len(self._content))
        chunk = self._content[self._offset : end]
        self._offset = end
        return chunk


class FakeBackgroundTasks:
    def __init__(self) -> None:
        self.tasks: list[tuple[object, tuple[object, ...], dict[str, object]]] = []

    def add_task(self, func, *args, **kwargs) -> None:
        self.tasks.append((func, args, kwargs))

    def run_all(self) -> None:
        for func, args, kwargs in self.tasks:
            func(*args, **kwargs)


class RecordingCursor:
    def __init__(self) -> None:
        self.statements: list[str] = []
        self.params: list[tuple[object, ...] | object] = []
        self.failed_document_error: str | None = None
        self.failed_job_error: str | None = None

    def __enter__(self):
        return self

    def __exit__(self, *_args) -> None:
        return None

    def execute(self, statement: str, params: tuple[object, ...] | object = ()) -> None:
        self.statements.append(statement)
        self.params.append(params)
        normalized = " ".join(statement.lower().split())
        if "update documents set status = 'failed'" in normalized:
            self.failed_document_error = str(params[0]) if isinstance(params, tuple) else ""
        if "update generation_jobs" in normalized and isinstance(params, tuple):
            job_payload = json.loads(str(params[1]))
            self.failed_job_error = job_payload["error_message"]

    def executemany(self, statement: str, rows) -> None:
        self.statements.append(statement)
        self.params.append(tuple(rows))

    def fetchone(self):
        return None

    def fetchall(self):
        return []


class RecordingConnection:
    def __init__(self, cursor: RecordingCursor) -> None:
        self.cursor_instance = cursor

    def __enter__(self):
        return self

    def __exit__(self, *_args) -> None:
        return None

    def transaction(self):
        return self

    def cursor(self):
        return self.cursor_instance


@pytest.fixture(autouse=True)
def clear_state() -> None:
    reset_demo_sessions_for_tests()


@pytest.fixture(autouse=True)
def stub_public_dns_for_tests(monkeypatch) -> None:
    def fake_getaddrinfo(host, port, *args, **kwargs):
        return [
            (
                socket.AF_INET,
                socket.SOCK_STREAM,
                6,
                "",
                ("93.184.216.34", port),
            )
        ]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)


def teacher_user() -> UserProfile:
    return authenticate_demo_user(
        LoginRequest(email="teacher@teachflow.local", password="teachflow-demo")
    ).user


def student_user() -> UserProfile:
    return authenticate_demo_user(
        LoginRequest(email="student@teachflow.local", password="teachflow-demo")
    ).user


def admin_user() -> UserProfile:
    return authenticate_demo_user(
        LoginRequest(email="admin@teachflow.local", password="teachflow-demo")
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
            knowledge_scope="library",
            owner_user_id=None,
            chunk_count=12,
            last_ingested_at="2026-06-28T00:00:00+00:00",
            error_message=None,
            is_active=True,
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
            knowledge_scope="library",
            owner_user_id=None,
            chunk_count=0,
            last_ingested_at=None,
            error_message="extract failed",
            is_active=True,
            created_at="2026-06-28T00:00:00+00:00",
            updated_at="2026-06-28T00:00:00+00:00",
        ),
    ]


def test_incremental_ingestion_detects_new_file() -> None:
    plan = determine_document_ingestion_action(
        file_name="new-source.pdf",
        file_hash="hash-new",
        existing_by_file_hash=None,
        existing_by_file_name=None,
    )

    assert plan.action == "ingested"
    assert plan.document_id is None


def test_incremental_ingestion_skips_unchanged_file() -> None:
    document = sample_documents()[0]

    plan = determine_document_ingestion_action(
        file_name=document.file_name,
        file_hash=document.file_hash,
        existing_by_file_hash=document,
        existing_by_file_name=document,
    )

    assert plan.action == "skipped"
    assert plan.document_id == document.id


def test_failed_same_hash_upload_retries_ingestion() -> None:
    document = sample_documents()[1]

    plan = determine_document_ingestion_action(
        file_name=document.file_name,
        file_hash=document.file_hash,
        existing_by_file_hash=document,
        existing_by_file_name=document,
    )

    assert plan.action == "reingested"
    assert plan.document_id == document.id


def test_incremental_ingestion_reingests_changed_file_by_file_name() -> None:
    document = sample_documents()[0]

    plan = determine_document_ingestion_action(
        file_name=document.file_name,
        file_hash="hash-new-content",
        existing_by_file_hash=None,
        existing_by_file_name=document,
    )

    assert plan.action == "reingested"
    assert plan.document_id == document.id


def test_supabase_duplicate_lookup_scopes_to_document_owner_and_scope() -> None:
    cursor = RecordingCursor()
    repository = SupabaseKnowledgeRepository("postgresql://example")

    repository._load_document_by_field(
        cursor,
        field_name="file_hash",
        field_value="hash-a",
        organization_id="org-demo",
        knowledge_scope="contextual",
        owner_user_id="demo-teacher",
    )

    statement = " ".join(cursor.statements[-1].lower().split())
    assert "organization_id = %s" in statement
    assert "knowledge_scope = %s" in statement
    assert "owner_user_id = %s" in statement
    assert cursor.params[-1] == (
        "hash-a",
        "org-demo",
        "contextual",
        "demo-teacher",
    )


def test_supabase_duplicate_upload_paths_pass_scope_to_lookup() -> None:
    sources = [
        inspect.getsource(SupabaseKnowledgeRepository.queue_uploaded_pdf_ingestion),
        inspect.getsource(SupabaseKnowledgeRepository.ingest_uploaded_pdf),
        inspect.getsource(SupabaseKnowledgeRepository.ingest_web_page),
    ]

    for source in sources:
        assert "knowledge_scope=knowledge_scope" in source
        assert "owner_user_id=owner_user_id" in source


def test_archive_source_document_allows_admin_library_and_user_contextual_only() -> None:
    repository = FakeKnowledgeRepository(sample_documents())

    archived = archive_source_document(
        "doc-completed",
        admin_user(),
        repository,
    )

    assert archived.id == "doc-completed"
    assert archived.is_active is False

    with pytest.raises(HTTPException) as exc:
        archive_source_document(
            "doc-failed",
            teacher_user(),
            repository,
        )

    assert exc.value.status_code == 404


def test_update_source_document_metadata_keeps_admin_library_hidden_from_teacher() -> None:
    repository = FakeKnowledgeRepository(sample_documents())

    updated = update_source_document_metadata(
        "doc-completed",
        DocumentMetadataUpdateRequest(title="Library Knowledge Renamed"),
        admin_user(),
        repository,
    )

    assert updated.title == "Library Knowledge Renamed"
    with pytest.raises(HTTPException) as exc:
        update_source_document_metadata(
            "doc-completed",
            DocumentMetadataUpdateRequest(title="Teacher Rename Attempt"),
            teacher_user(),
            repository,
        )

    assert exc.value.status_code == 404


def test_list_source_documents_separates_admin_library_and_user_contextual_docs() -> None:
    teacher = teacher_user()
    student = student_user()
    admin = admin_user()
    documents = [
        sample_documents()[0],
        sample_documents()[0].model_copy(
            update={
                "id": "doc-teacher-context",
                "title": "Teacher Draft Context",
                "knowledge_scope": "contextual",
                "owner_user_id": teacher.id,
            }
        ),
        sample_documents()[0].model_copy(
            update={
                "id": "doc-student-context",
                "title": "Student Private Context",
                "knowledge_scope": "contextual",
                "owner_user_id": student.id,
            }
        ),
    ]
    repository = FakeKnowledgeRepository(documents)

    assert [doc.id for doc in list_source_documents(admin, repository)] == ["doc-completed"]
    assert [doc.id for doc in list_source_documents(teacher, repository)] == [
        "doc-teacher-context"
    ]
    assert [doc.id for doc in list_source_documents(student, repository)] == [
        "doc-student-context"
    ]


def test_admin_export_and_delete_user_contextual_knowledge_owner_scoped() -> None:
    student = student_user()
    other_student = UserProfile(
        id="student-other",
        email="other@student.local",
        name="Other Student",
        role="student",
        organization_id="org-demo",
    )
    student_context = sample_documents()[0].model_copy(
        update={
            "id": "doc-student-context",
            "knowledge_scope": "contextual",
            "owner_user_id": student.id,
            "file_size_bytes": 64,
        }
    )
    other_context = sample_documents()[0].model_copy(
        update={
            "id": "doc-other-context",
            "knowledge_scope": "contextual",
            "owner_user_id": other_student.id,
            "file_size_bytes": 64,
        }
    )
    repository = FakeKnowledgeRepository(
        [sample_documents()[0], student_context, other_context]
    )

    exported = export_user_contextual_knowledge(student.id, admin_user(), repository)
    deleted = delete_user_contextual_knowledge(student.id, admin_user(), repository)

    assert [document.id for document in exported.documents] == ["doc-student-context"]
    assert deleted.document_ids == ["doc-student-context"]
    assert deleted.archived_document_count == 1
    assert repository.get_documents_by_ids(["doc-student-context"])[0].is_active is False
    assert repository.get_documents_by_ids(["doc-other-context"])[0].is_active is True
    assert repository.get_documents_by_ids(["doc-completed"])[0].is_active is True


def test_upload_scope_is_library_for_admin_and_contextual_for_teacher_or_student() -> None:
    repository = FakeKnowledgeRepository(sample_documents())

    assert document_scope_for_upload(admin_user()) == ("library", None)
    teacher_scope = document_scope_for_upload(teacher_user())
    student_scope = document_scope_for_upload(student_user())

    assert teacher_scope == ("contextual", "demo-teacher")
    assert student_scope == ("contextual", "demo-student")


def test_document_record_governance_defaults_are_backward_compatible() -> None:
    document = sample_documents()[0]
    assert document.storage_provider == "metadata"
    assert document.storage_status == "metadata_only"
    assert document.storage_path is None
    assert document.retention_expires_at is None
    assert document.quota_limit_bytes is None
    assert document.provenance == {}


def test_retrieval_rejects_inactive_documents() -> None:
    teacher = teacher_user()
    documents = [
        sample_documents()[0].model_copy(
            update={
                "id": "doc-teacher-context",
                "is_active": False,
                "knowledge_scope": "contextual",
                "owner_user_id": teacher.id,
            }
        ),
    ]
    chunks = [
        RetrievedChunkRecord(
            chunk_id="chunk-1",
            document_id="doc-teacher-context",
            document_title="Building Applications with AI Agents",
            page_number=1,
            chunk_index=0,
            excerpt="Transformer attention example",
            score=0.9,
        )
    ]
    repository = FakeKnowledgeRepository(documents, chunks)

    with pytest.raises(HTTPException) as exc:
        retrieve_relevant_chunks(
            RetrievalRequest(
                topic="Transformer Architecture",
                selected_document_ids=["doc-teacher-context"],
            ),
            teacher,
            repository,
        )

    assert exc.value.status_code == 400
    assert exc.value.detail["inactive_document_ids"] == ["doc-teacher-context"]


def test_retrieval_uses_embedding_provider_query_vector() -> None:
    chunks = [
        RetrievedChunkRecord(
            chunk_id="chunk-1",
            document_id="doc-completed",
            document_title="Building Applications with AI Agents",
            page_number=1,
            chunk_index=0,
            excerpt="Transformer attention example",
            score=0.9,
        )
    ]
    repository = FakeKnowledgeRepository(sample_documents(), chunks)

    response = retrieve_relevant_chunks(
        RetrievalRequest(
            topic="Transformer Architecture",
            selected_document_ids=[],
        ),
        teacher_user(),
        repository,
        embedding_provider=FakeEmbeddingProvider(),
    )

    assert response.chunks[0].chunk_id == "chunk-1"
    assert repository.last_query_embedding[0] == 0.25


def test_retrieval_uses_hidden_library_with_optional_contextual_selection() -> None:
    teacher = teacher_user()
    library_doc = sample_documents()[0]
    contextual_doc = library_doc.model_copy(
        update={
            "id": "doc-teacher-context",
            "knowledge_scope": "contextual",
            "owner_user_id": teacher.id,
        }
    )
    repository = FakeKnowledgeRepository(
        [library_doc, contextual_doc],
        chunks=[
            RetrievedChunkRecord(
                chunk_id="chunk-library",
                document_id=library_doc.id,
                document_title=library_doc.title,
                page_number=1,
                chunk_index=0,
                excerpt="Long-term library grounding.",
                score=0.9,
            ),
            RetrievedChunkRecord(
                chunk_id="chunk-context",
                document_id=contextual_doc.id,
                document_title=contextual_doc.title,
                page_number=1,
                chunk_index=0,
                excerpt="Teacher contextual grounding.",
                score=0.8,
            ),
        ],
    )

    response = retrieve_relevant_chunks(
        RetrievalRequest(
            topic="Transformer Architecture",
            selected_document_ids=[],
        ),
        teacher,
        repository,
        embedding_provider=FakeEmbeddingProvider(),
    )

    assert repository.last_selected_document_ids == ["doc-completed"]
    assert [chunk.chunk_id for chunk in response.chunks] == ["chunk-library"]

    response = retrieve_relevant_chunks(
        RetrievalRequest(
            topic="Transformer Architecture",
            selected_document_ids=["doc-teacher-context"],
        ),
        teacher,
        repository,
        embedding_provider=FakeEmbeddingProvider(),
    )

    assert repository.last_selected_document_ids == [
        "doc-completed",
        "doc-teacher-context",
    ]
    assert [chunk.chunk_id for chunk in response.chunks] == [
        "chunk-library",
        "chunk-context",
    ]


def test_reindex_source_document_records_generation_job() -> None:
    repository = FakeKnowledgeRepository(sample_documents())
    job_repository = InMemoryGenerationJobRepository()

    response = reindex_source_document(
        "doc-completed",
        admin_user(),
        repository,
        job_repository,
        FakeEmbeddingProvider(),
    )

    assert response.document.id == "doc-completed"
    assert response.chunk_count == 2
    assert response.embedding.model == "fake-embedding-v1"
    assert response.generation_job.job_type == "embedding_reindex"
    assert response.generation_job.status == "completed"
    assert repository.reindexed_documents == [
        {
            "document_id": "doc-completed",
            "embedding_model": "fake-embedding-v1",
            "embedding_provider": "fake",
            "embedding_dimensions": 384,
        }
    ]


def test_retry_embedding_reindex_job_reprocesses_same_generation_job() -> None:
    repository = FakeKnowledgeRepository(sample_documents())
    job_repository = InMemoryGenerationJobRepository()
    admin = admin_user()
    job = job_repository.create_job(
        job_type="embedding_reindex",
        actor=admin,
        job_input={"document_id": "doc-completed", "retry_supported": True},
        status="processing",
    )
    failed = job_repository.update_job(
        job.id,
        status="failed",
        error_message="Embedding provider unavailable",
    )

    retried = retry_embedding_reindex_job(
        failed,
        admin,
        repository,
        job_repository,
        FakeEmbeddingProvider(),
    )

    assert retried.id == job.id
    assert retried.status == "completed"
    assert retried.error_message is None
    assert retried.output["document_id"] == "doc-completed"
    assert retried.output["retry_source_job_id"] == job.id
    assert repository.reindexed_documents == [
        {
            "document_id": "doc-completed",
            "embedding_model": "fake-embedding-v1",
            "embedding_provider": "fake",
            "embedding_dimensions": 384,
        }
    ]


def test_reindex_source_document_rejects_inactive_document() -> None:
    repository = FakeKnowledgeRepository(
        [sample_documents()[0].model_copy(update={"is_active": False})]
    )

    with pytest.raises(HTTPException) as exc:
            reindex_source_document(
                "doc-completed",
                admin_user(),
            repository,
            InMemoryGenerationJobRepository(),
            FakeEmbeddingProvider(),
        )

    assert exc.value.status_code == 400


def test_pdf_dependency_error_maps_to_actionable_upload_message() -> None:
    message = pdf_extraction_failure_message(
        DependencyError("cryptography is required")
    )

    assert "DependencyError" not in message
    assert "backend PDF encryption dependency" in message


def test_encrypted_pdf_error_maps_to_password_protected_message() -> None:
    message = pdf_extraction_failure_message(
        WrongPasswordError("PDF requires a password")
    )

    assert "password-protected" in message
    assert "WrongPasswordError" not in message


def test_admin_lists_library_documents_with_status_metadata() -> None:
    repository = FakeKnowledgeRepository(sample_documents())

    documents = list_source_documents(
        current_user=admin_user(),
        repository=repository,
    )

    assert [doc.id for doc in documents] == ["doc-completed", "doc-failed"]
    assert documents[0].chunk_count == 12
    assert documents[1].status == "failed"
    assert documents[1].error_message == "extract failed"


def test_source_document_list_is_scoped_to_user_organization() -> None:
    org_demo_document = sample_documents()[0].model_copy(
        update={"organization_id": "org-demo"}
    )
    org_other_document = sample_documents()[0].model_copy(
        update={
            "id": "doc-other",
            "title": "Other Org Source",
            "organization_id": "org-other",
        }
    )
    repository = FakeKnowledgeRepository([org_demo_document, org_other_document])
    other_org_admin = admin_user().model_copy(
        update={"organization_id": "org-other"}
    )

    assert [
        document.id
        for document in list_source_documents(admin_user(), repository)
    ] == ["doc-completed"]
    assert [
        document.id
        for document in list_source_documents(other_org_admin, repository)
    ] == ["doc-other"]


def test_retrieval_rejects_cross_organization_documents() -> None:
    chunks = [
        RetrievedChunkRecord(
            chunk_id="chunk-1",
            document_id="doc-completed",
            document_title="Building Applications with AI Agents",
            page_number=1,
            chunk_index=0,
            excerpt="Transformer attention example",
            score=0.9,
        )
    ]
    repository = FakeKnowledgeRepository(
        [sample_documents()[0].model_copy(update={"organization_id": "org-demo"})],
        chunks,
    )
    other_org_teacher = teacher_user().model_copy(
        update={"organization_id": "org-other"}
    )

    with pytest.raises(HTTPException) as exc:
        retrieve_relevant_chunks(
            RetrievalRequest(
                topic="Transformer Architecture",
                selected_document_ids=["doc-completed"],
            ),
            other_org_teacher,
            repository,
            embedding_provider=FakeEmbeddingProvider(),
        )

    assert exc.value.status_code == 400
    assert exc.value.detail["missing_document_ids"] == ["doc-completed"]


def test_student_lists_only_own_contextual_documents() -> None:
    student = student_user()
    contextual = sample_documents()[0].model_copy(
        update={
            "id": "doc-student-context",
            "knowledge_scope": "contextual",
            "owner_user_id": student.id,
        }
    )
    repository = FakeKnowledgeRepository([*sample_documents(), contextual])

    assert [doc.id for doc in list_source_documents(student, repository)] == [
        "doc-student-context"
    ]


def test_admin_can_list_source_documents_for_upload_status() -> None:
    repository = FakeKnowledgeRepository(sample_documents())

    documents = list_source_documents(current_user=admin_user(), repository=repository)

    assert [document.id for document in documents] == ["doc-completed", "doc-failed"]


def test_extract_web_page_text_discards_non_content_markup() -> None:
    page = extract_web_page_text(
        url="https://docs.example.edu/agents",
        content_type="text/html; charset=utf-8",
        content=b"""
        <html>
          <head><title>Agent Docs</title><style>.hidden{display:none}</style></head>
          <body>
            <nav>Menu should not matter</nav>
            <main>
              <h1>Build agents</h1>
              <p>Agents combine models, tools, memory, and orchestration.</p>
            </main>
            <script>alert('ignore')</script>
          </body>
        </html>
        """,
    )

    assert page.title == "Agent Docs"
    assert "Build agents" in page.text
    assert "orchestration" in page.text
    assert "alert" not in page.text
    assert "display:none" not in page.text


def test_ingest_source_url_rejects_unsafe_url_before_fetch() -> None:
    repository = FakeKnowledgeRepository(sample_documents())
    fetched: list[str] = []

    def fetcher(url: str) -> FetchedWebPage:
        fetched.append(url)
        return FetchedWebPage(
            url=url,
            content_type="text/html",
            content=b"<html><body>Should not fetch</body></html>",
        )

    with pytest.raises(HTTPException) as exc:
        ingest_source_url(
            UrlIngestionRequest(url="http://127.0.0.1/private"),
            teacher_user(),
            repository,
            fetcher=fetcher,
        )

    assert exc.value.status_code == 400
    assert "not allowed" in str(exc.value.detail)
    assert fetched == []


def test_validate_web_ingestion_url_rejects_dns_that_resolves_private(
    monkeypatch,
) -> None:
    def fake_getaddrinfo(*_args, **_kwargs):
        return [
            (
                socket.AF_INET,
                socket.SOCK_STREAM,
                6,
                "",
                ("127.0.0.1", 443),
            )
        ]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)

    with pytest.raises(HTTPException) as exc:
        validate_web_ingestion_url("https://docs.example.edu/guide")

    assert exc.value.status_code == 400
    assert "not allowed" in str(exc.value.detail)


def test_web_fetch_redirect_handler_rejects_unsafe_redirect_target() -> None:
    request = urllib.request.Request("https://docs.example.edu/source", method="GET")
    handler = SafeWebRedirectHandler()

    with pytest.raises(HTTPException) as exc:
        handler.redirect_request(
            request,
            None,
            302,
            "Found",
            {},
            "http://127.0.0.1/internal-metadata",
        )

    assert exc.value.status_code == 400
    assert "not allowed" in str(exc.value.detail)


def test_web_fetch_redirect_handler_allows_safe_relative_redirect() -> None:
    request = urllib.request.Request("https://docs.example.edu/source", method="GET")
    handler = SafeWebRedirectHandler()

    redirected = handler.redirect_request(
        request,
        None,
        302,
        "Found",
        {},
        "/updated-source",
    )

    assert redirected is not None
    assert redirected.full_url == "https://docs.example.edu/updated-source"


def test_teacher_ingests_trusted_web_page_source() -> None:
    repository = FakeKnowledgeRepository(sample_documents())

    def fetcher(url: str) -> FetchedWebPage:
        return FetchedWebPage(
            url=url,
            content_type="text/html",
            content=b"<html><head><title>Docs</title></head><body><main>Useful source text for agents.</main></body></html>",
        )

    response = ingest_source_url(
        UrlIngestionRequest(url="https://docs.example.edu/agents"),
        teacher_user(),
        repository,
        fetcher=fetcher,
    )

    assert response.document.source_type == "web"
    assert response.document.organization_id == "org-demo"
    assert response.document.file_name == "https://docs.example.edu/agents"
    assert repository.uploads[-1]["title"] == "Docs"
    assert "Useful source text" in str(repository.uploads[-1]["text"])


def test_student_can_ingest_contextual_source_url() -> None:
    repository = FakeKnowledgeRepository(sample_documents())

    response = ingest_source_url(
        UrlIngestionRequest(url="https://docs.example.edu/agents"),
        student_user(),
        repository,
        fetcher=lambda url: FetchedWebPage(
            url=url,
            content_type="text/html",
            content=b"<html><body>Agents use tools, memory, and context.</body></html>",
        ),
    )

    assert response.document.knowledge_scope == "contextual"
    assert response.document.owner_user_id == "demo-student"


def test_teacher_uploads_pdf_document_and_receives_job_status() -> None:
    repository = FakeKnowledgeRepository(sample_documents())
    upload = FakeUploadFile(
        filename="uploaded-knowledge.pdf",
        content_type="application/pdf",
        content=b"%PDF-1.7 tiny pdf payload",
    )

    response = asyncio.run(
        upload_source_document(
            upload_file=upload,
            current_user=teacher_user(),
            repository=repository,
            max_upload_bytes=1024,
        )
    )

    assert response.generation_job_id == "job-upload"
    assert response.job_status == "completed"
    assert response.ingestion_action == "ingested"
    assert response.document.status == "completed"
    assert repository.uploads[0]["file_name"] == "uploaded-knowledge.pdf"
    assert repository.uploads[0]["file_bytes"] == b"%PDF-1.7 tiny pdf payload"
    assert repository.uploads[0]["uploaded_by"] == "demo-teacher"
    assert repository.uploads[0]["knowledge_scope"] == "contextual"
    assert repository.uploads[0]["owner_user_id"] == "demo-teacher"
    assert repository.uploads[0]["governance"]["file_size_bytes"] == len(
        b"%PDF-1.7 tiny pdf payload"
    )


def test_contextual_upload_assigns_retention_quota_and_provenance(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DOCUMENT_STORAGE_PROVIDER", "metadata")
    monkeypatch.setenv("DOCUMENT_CONTEXTUAL_TTL_DAYS", "30")
    monkeypatch.setenv("DOCUMENT_CONTEXTUAL_QUOTA_BYTES", "1024")
    repository = FakeKnowledgeRepository(sample_documents())
    upload = FakeUploadFile(
        filename="contextual-governance.pdf",
        content_type="application/pdf",
        content=b"%PDF governance",
    )

    response = asyncio.run(
        upload_source_document(
            upload_file=upload,
            current_user=teacher_user(),
            repository=repository,
            max_upload_bytes=1024,
        )
    )

    governance = repository.uploads[0]["governance"]
    assert response.document.file_size_bytes == len(b"%PDF governance")
    assert response.document.storage_provider == "metadata"
    assert response.document.storage_status == "metadata_only"
    assert response.document.retention_expires_at is not None
    assert response.document.quota_limit_bytes == 1024
    assert response.document.quota_used_bytes == len(b"%PDF governance")
    assert response.document.provenance["retention_policy"] == "contextual_ttl_30d"
    assert response.document.provenance["quota_scope"] == "owner_contextual"
    assert governance["provenance"]["owner_user_id"] == "demo-teacher"


def test_contextual_upload_rejects_quota_exceeded(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DOCUMENT_STORAGE_PROVIDER", "metadata")
    monkeypatch.setenv("DOCUMENT_CONTEXTUAL_QUOTA_BYTES", "1024")
    existing_contextual = sample_documents()[0].model_copy(
        update={
            "id": "doc-teacher-context-existing",
            "knowledge_scope": "contextual",
            "owner_user_id": "demo-teacher",
            "file_size_bytes": 1020,
        }
    )
    repository = FakeKnowledgeRepository([existing_contextual])
    upload = FakeUploadFile(
        filename="too-large-for-quota.pdf",
        content_type="application/pdf",
        content=b"12345",
    )

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            upload_source_document(
                upload_file=upload,
                current_user=teacher_user(),
                repository=repository,
                max_upload_bytes=1024,
            )
        )

    assert exc_info.value.status_code == 413
    assert exc_info.value.detail == "Document quota exceeded for this knowledge scope"
    assert repository.uploads == []


def test_supabase_sync_upload_path_assigns_document_scope_before_write() -> None:
    source = inspect.getsource(SupabaseKnowledgeRepository.ingest_uploaded_pdf)

    assert "knowledge_scope, owner_user_id = document_scope_for_upload(uploaded_by)" in source
    assert source.index("knowledge_scope, owner_user_id") < source.index(
        "with self._connect()"
    )


def test_supabase_upload_job_insert_sets_actor_columns() -> None:
    class CaptureCursor:
        def __init__(self) -> None:
            self.statement = ""
            self.params: tuple[object, ...] = ()

        def execute(self, statement: str, params: tuple[object, ...]) -> None:
            self.statement = statement
            self.params = params

        def fetchone(self) -> dict[str, str]:
            return {"id": "job-upload-1"}

    repository = SupabaseKnowledgeRepository("postgresql://example.invalid/db")
    cursor = CaptureCursor()
    teacher = teacher_user()

    job_id = repository._save_document_upload_job(
        cursor,
        job_status="processing",
        ingestion_action="created",
        document_id="doc-upload",
        file_name="source.pdf",
        file_hash="hash-source",
        uploaded_by=teacher,
        chunk_count=0,
        error_message=None,
    )

    assert job_id == "job-upload-1"
    assert "actor_id" in cursor.statement.lower()
    assert "actor_role" in cursor.statement.lower()
    assert "organization_id" in cursor.statement.lower()
    assert cursor.params[-3:] == (teacher.id, teacher.role, "org-demo")


def test_teacher_upload_queues_pdf_ingestion_background_task() -> None:
    repository = FakeKnowledgeRepository(sample_documents())
    background_tasks = FakeBackgroundTasks()
    upload = FakeUploadFile(
        filename="async-source.pdf",
        content_type="application/pdf",
        content=b"%PDF-1.7 async payload",
    )

    response = asyncio.run(
        queue_source_document_upload(
            upload_file=upload,
            current_user=teacher_user(),
            repository=repository,
            background_tasks=background_tasks,
            max_upload_bytes=1024,
        )
    )

    assert response.generation_job_id == "job-upload"
    assert response.job_status == "processing"
    assert response.document.status == "processing"
    assert repository.queued_uploads[0]["file_name"] == "async-source.pdf"
    assert repository.queued_uploads[0]["file_bytes"] == b"%PDF-1.7 async payload"
    assert repository.queued_uploads[0]["uploaded_by"] == "demo-teacher"
    assert repository.queued_uploads[0]["knowledge_scope"] == "contextual"
    assert repository.queued_uploads[0]["owner_user_id"] == "demo-teacher"
    assert repository.queued_uploads[0]["governance"]["file_size_bytes"] == len(
        b"%PDF-1.7 async payload"
    )
    assert repository.processed_jobs == []

    background_tasks.run_all()

    assert repository.processed_jobs == [
        {
            "generation_job_id": "job-upload",
            "document_id": "doc-upload",
            "file_name": "async-source.pdf",
            "file_bytes": b"%PDF-1.7 async payload",
            "uploaded_by": "demo-teacher",
        }
    ]


def test_queued_pdf_ingestion_marks_failed_when_embedding_provider_errors(
    monkeypatch,
) -> None:
    cursor = RecordingCursor()
    repository = SupabaseKnowledgeRepository("postgresql://example")
    monkeypatch.setattr(repository, "_connect", lambda: RecordingConnection(cursor))
    monkeypatch.setattr(
        app_main_module,
        "extract_pdf_chunks_from_bytes",
        lambda *_args, **_kwargs: [
            PdfUploadChunk(
                content="safe extracted text",
                page_number=1,
                chunk_index=0,
                metadata={"file_name": "source.pdf"},
            )
        ],
    )

    def raise_embedding_error():
        raise RuntimeError("embedding provider offline")

    monkeypatch.setattr(app_main_module, "get_embedding_provider", raise_embedding_error)

    repository.process_uploaded_pdf_ingestion(
        generation_job_id="job-upload",
        document_id="00000000-0000-0000-0000-000000000001",
        file_name="source.pdf",
        file_bytes=b"%PDF-1.7 payload",
        uploaded_by=teacher_user(),
    )

    assert cursor.failed_document_error == "embedding provider offline"
    assert cursor.failed_job_error == "embedding provider offline"


def test_admin_can_upload_pdf_document() -> None:
    repository = FakeKnowledgeRepository(sample_documents())
    upload = FakeUploadFile(
        filename="admin-source.pdf",
        content_type="application/pdf",
        content=b"%PDF-1.7 admin payload",
    )

    response = asyncio.run(
        upload_source_document(
            upload_file=upload,
            current_user=admin_user(),
            repository=repository,
            max_upload_bytes=1024,
        )
    )

    assert response.document.file_name == "admin-source.pdf"
    assert repository.uploads[0]["uploaded_by"] == "demo-admin"


def test_student_can_upload_contextual_pdf_document() -> None:
    repository = FakeKnowledgeRepository(sample_documents())
    upload = FakeUploadFile(
        filename="student-source.pdf",
        content_type="application/pdf",
        content=b"%PDF-1.7 student payload",
    )

    response = asyncio.run(
        upload_source_document(
            upload_file=upload,
            current_user=student_user(),
            repository=repository,
            max_upload_bytes=1024,
        )
    )

    assert response.document.knowledge_scope == "contextual"
    assert response.document.owner_user_id == "demo-student"


def test_upload_rejects_non_pdf_file() -> None:
    repository = FakeKnowledgeRepository(sample_documents())
    upload = FakeUploadFile(
        filename="notes.txt",
        content_type="text/plain",
        content=b"not a pdf",
    )

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            upload_source_document(
                upload_file=upload,
                current_user=teacher_user(),
                repository=repository,
                max_upload_bytes=1024,
            )
        )

    assert exc_info.value.status_code == 400
    assert repository.uploads == []


def test_upload_rejects_file_over_size_guard() -> None:
    repository = FakeKnowledgeRepository(sample_documents())
    upload = FakeUploadFile(
        filename="too-large.pdf",
        content_type="application/pdf",
        content=b"%PDF-1.7 payload that is too large",
    )

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            upload_source_document(
                upload_file=upload,
                current_user=teacher_user(),
                repository=repository,
                max_upload_bytes=8,
            )
        )

    assert exc_info.value.status_code == 413
    assert repository.uploads == []


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
            selected_document_ids=[],
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
