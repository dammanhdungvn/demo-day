from fastapi import HTTPException
import pytest

from main import (
    InMemoryContentRepository,
    InMemoryAuditEventRepository,
    LessonBlockResponse,
    LessonAuditEventResponse,
    LessonSessionResponse,
    RetrievedChunkRecord,
    UserProfile,
    audit_schema_sql,
    list_lesson_audit_events,
    reset_lesson_store_for_tests,
)


def audit_event(
    event_id: str,
    *,
    lesson_id: str = "lesson-test-1",
    action: str = "lesson_generated",
) -> LessonAuditEventResponse:
    return LessonAuditEventResponse(
        id=event_id,
        lesson_id=lesson_id,
        block_id=None,
        actor_id="demo-teacher",
        actor_role="teacher",
        action=action,
        details="Audit details",
        created_at=f"2026-06-28T00:00:0{event_id[-1]}+00:00",
    )


def source_reference() -> RetrievedChunkRecord:
    return RetrievedChunkRecord(
        chunk_id="chunk-1",
        document_id="doc-1",
        document_title="AI Agents",
        page_number=12,
        chunk_index=4,
        excerpt="Agents use tools and memory.",
        score=0.9,
    )


def sample_lesson() -> LessonSessionResponse:
    return LessonSessionResponse(
        id="lesson-test-1",
        outline_id="outline-test-1",
        outline_session_index=1,
        course_id="course-test-1",
        class_id="class-test-1",
        teacher_id="teacher-test-1",
        title="AI Agent Architecture",
        status="teacher_reviewing",
        admin_feedback=None,
        blocks=[
            LessonBlockResponse(
                id="block-test-1",
                type="learning_objectives",
                title="Objectives",
                content="Explain agent components.",
                order_index=1,
                status="needs_review",
                citations=[source_reference()],
                warning=None,
            )
        ],
        created_at="2026-06-28T00:00:00+00:00",
        updated_at="2026-06-28T00:00:00+00:00",
    )


def user_profile(
    *,
    user_id: str = "teacher-test-1",
    role: str = "teacher",
) -> UserProfile:
    return UserProfile(
        id=user_id,
        email=f"{user_id}@teachflow.local",
        name=user_id,
        role=role,
    )


def test_memory_audit_repository_records_and_lists_events_in_order() -> None:
    reset_lesson_store_for_tests()
    repository = InMemoryAuditEventRepository()

    first_event = audit_event("audit-1")
    second_event = audit_event("audit-2", action="block_edited")
    other_lesson_event = audit_event("audit-3", lesson_id="lesson-test-2")

    repository.save_event(first_event)
    repository.save_event(second_event)
    repository.save_event(other_lesson_event)

    assert repository.list_events_for_lesson("lesson-test-1") == [
        first_event,
        second_event,
    ]
    assert repository.list_events_for_lesson("lesson-test-2") == [other_lesson_event]


def test_lesson_audit_service_uses_repository_and_preserves_role_guards() -> None:
    content_repository = InMemoryContentRepository()
    audit_repository = InMemoryAuditEventRepository()
    lesson = sample_lesson()
    event = audit_event("audit-1", lesson_id=lesson.id)
    content_repository.save_lesson(lesson)
    audit_repository.save_event(event)

    assert list_lesson_audit_events(
        lesson.id,
        user_profile(),
        content_repository=content_repository,
        audit_repository=audit_repository,
    ) == [event]
    assert list_lesson_audit_events(
        lesson.id,
        user_profile(user_id="demo-admin", role="admin"),
        content_repository=content_repository,
        audit_repository=audit_repository,
    ) == [event]

    with pytest.raises(HTTPException) as student_error:
        list_lesson_audit_events(
            lesson.id,
            user_profile(user_id="student-test-1", role="student"),
            content_repository=content_repository,
            audit_repository=audit_repository,
        )
    assert student_error.value.status_code == 403

    with pytest.raises(HTTPException) as other_teacher_error:
        list_lesson_audit_events(
            lesson.id,
            user_profile(user_id="teacher-test-2", role="teacher"),
            content_repository=content_repository,
            audit_repository=audit_repository,
        )
    assert other_teacher_error.value.status_code == 404


def test_audit_schema_sql_contains_required_table_columns_rls_and_revokes() -> None:
    schema_sql = audit_schema_sql().lower()

    assert "create table if not exists audit_events" in schema_sql
    assert "id text primary key" in schema_sql
    assert "lesson_id text not null" in schema_sql
    assert "block_id text" in schema_sql
    assert "actor_id text not null" in schema_sql
    assert "actor_role text not null" in schema_sql
    assert "action text not null" in schema_sql
    assert "details text" in schema_sql
    assert "created_at timestamptz not null" in schema_sql
    assert "create index if not exists idx_audit_events_lesson_created" in schema_sql
    assert "alter table audit_events enable row level security" in schema_sql
    assert "revoke all on table audit_events from anon, authenticated" in schema_sql
