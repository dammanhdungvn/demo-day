from app.audit.ports import AuditRepository
from app.audit.repositories import (
    InMemoryAuditEventRepository,
    PostgresAuditEventRepository,
    audit_schema_sql,
    get_audit_repository,
)
from app.audit.schemas import LessonAuditEventResponse
from main import AuditRepository as MainAuditRepository
from main import InMemoryAuditEventRepository as MainInMemoryAuditEventRepository
from main import LessonAuditEventResponse as MainLessonAuditEventResponse
from main import PostgresAuditEventRepository as MainPostgresAuditEventRepository
from main import audit_schema_sql as main_audit_schema_sql
from main import get_audit_repository as main_get_audit_repository


def test_audit_schema_module_exports_lesson_audit_event_model() -> None:
    event = LessonAuditEventResponse(
        id="audit-1",
        lesson_id="lesson-1",
        block_id="block-1",
        actor_id="teacher-1",
        actor_role="teacher",
        action="block_edited",
        details="Updated title",
        created_at="2026-06-29T00:00:00+00:00",
    )

    assert event.actor_role == "teacher"
    assert event.action == "block_edited"
    assert MainLessonAuditEventResponse is LessonAuditEventResponse


def test_audit_ports_module_keeps_main_compatibility_export() -> None:
    assert hasattr(AuditRepository, "ensure_schema")
    assert hasattr(AuditRepository, "save_event")
    assert hasattr(AuditRepository, "list_events_for_lesson")
    assert MainAuditRepository is AuditRepository


def test_audit_repositories_module_keeps_main_compatibility_export(monkeypatch) -> None:
    schema_sql = audit_schema_sql().lower()

    assert "create table if not exists audit_events" in schema_sql
    assert "idx_audit_events_lesson_created" in schema_sql
    assert "revoke all on table audit_events from anon, authenticated" in schema_sql
    assert MainInMemoryAuditEventRepository is InMemoryAuditEventRepository
    assert MainPostgresAuditEventRepository is PostgresAuditEventRepository
    assert main_audit_schema_sql is audit_schema_sql
    assert main_get_audit_repository is get_audit_repository

    repository = InMemoryAuditEventRepository()
    event = LessonAuditEventResponse(
        id="audit-1",
        lesson_id="lesson-1",
        block_id=None,
        actor_id="teacher-1",
        actor_role="teacher",
        action="lesson_submitted",
        details=None,
        created_at="2026-06-29T00:00:00+00:00",
    )
    repository.save_event(event)
    assert repository.list_events_for_lesson(event.lesson_id) == [event]
    repository.reset()
    assert repository.list_events_for_lesson(event.lesson_id) == []

    monkeypatch.delenv("LEARNING_REPOSITORY", raising=False)
    assert isinstance(get_audit_repository(), InMemoryAuditEventRepository)

    monkeypatch.setenv("LEARNING_REPOSITORY", "postgres")
    monkeypatch.setenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")
    assert isinstance(get_audit_repository(ensure_schema=False), PostgresAuditEventRepository)
