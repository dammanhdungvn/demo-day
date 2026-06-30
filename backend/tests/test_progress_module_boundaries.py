import pytest
from pydantic import ValidationError

from app.progress.ports import ProgressRepository
from app.progress.repositories import (
    InMemoryProgressRepository,
    PostgresProgressRepository,
    get_progress_repository,
    progress_schema_sql,
)
from app.progress.schemas import (
    LessonProgressRecord,
    LessonProgressResponse,
    LessonProgressUpdateRequest,
    TeacherLessonProgressSummary,
)
from main import InMemoryProgressRepository as MainInMemoryProgressRepository
from main import LessonProgressRecord as MainLessonProgressRecord
from main import LessonProgressResponse as MainLessonProgressResponse
from main import LessonProgressUpdateRequest as MainLessonProgressUpdateRequest
from main import PostgresProgressRepository as MainPostgresProgressRepository
from main import ProgressRepository as MainProgressRepository
from main import TeacherLessonProgressSummary as MainTeacherLessonProgressSummary
from main import get_progress_repository as main_get_progress_repository
from main import progress_schema_sql as main_progress_schema_sql


def test_progress_schema_module_exports_progress_models() -> None:
    payload = LessonProgressUpdateRequest(
        current_block_id="block-1",
        current_slide_index=2,
        completed=True,
    )
    record = LessonProgressRecord(
        lesson_id="lesson-1",
        class_id="class-1",
        student_id="student-1",
        current_block_id=payload.current_block_id,
        current_slide_index=payload.current_slide_index,
        started_at="2026-06-29T00:00:00+00:00",
        last_opened_at="2026-06-29T00:01:00+00:00",
        completed_at="2026-06-29T00:02:00+00:00",
    )
    response = LessonProgressResponse(
        lesson_id=record.lesson_id,
        class_id=record.class_id,
        student_id=record.student_id,
        current_block_id=record.current_block_id,
        current_slide_index=record.current_slide_index,
        progress_percent=100,
        started_at=record.started_at,
        last_opened_at=record.last_opened_at,
        completed_at=record.completed_at,
    )
    summary = TeacherLessonProgressSummary(
        lesson_id=record.lesson_id,
        class_id=record.class_id,
        title="Lesson 1",
        enrolled_student_count=1,
        started_count=1,
        completed_count=1,
        average_progress_percent=response.progress_percent,
    )

    assert payload.completed is True
    assert record.current_slide_index == 2
    assert response.progress_percent == 100
    assert summary.completed_count == 1


def test_progress_update_request_keeps_slide_index_validation() -> None:
    with pytest.raises(ValidationError):
        LessonProgressUpdateRequest(current_slide_index=-1)


def test_progress_ports_module_keeps_main_compatibility_export() -> None:
    assert hasattr(ProgressRepository, "ensure_schema")
    assert hasattr(ProgressRepository, "get_progress")
    assert hasattr(ProgressRepository, "upsert_progress")
    assert hasattr(ProgressRepository, "list_progress_for_lessons")
    assert MainProgressRepository is ProgressRepository


def test_progress_schemas_keep_main_compatibility_exports() -> None:
    assert MainLessonProgressUpdateRequest is LessonProgressUpdateRequest
    assert MainLessonProgressRecord is LessonProgressRecord
    assert MainLessonProgressResponse is LessonProgressResponse
    assert MainTeacherLessonProgressSummary is TeacherLessonProgressSummary


def test_progress_repositories_module_keeps_main_compatibility_export(monkeypatch) -> None:
    schema_sql = progress_schema_sql().lower()

    assert "create table if not exists lesson_progress" in schema_sql
    assert "idx_lesson_progress_lesson" in schema_sql
    assert "revoke all on table lesson_progress from anon, authenticated" in schema_sql
    assert MainInMemoryProgressRepository is InMemoryProgressRepository
    assert MainPostgresProgressRepository is PostgresProgressRepository
    assert main_progress_schema_sql is progress_schema_sql
    assert main_get_progress_repository is get_progress_repository

    repository = InMemoryProgressRepository()
    progress = LessonProgressRecord(
        lesson_id="lesson-1",
        class_id="class-1",
        student_id="student-1",
        current_block_id="block-1",
        current_slide_index=1,
        started_at="2026-06-29T00:00:00+00:00",
        last_opened_at="2026-06-29T00:01:00+00:00",
        completed_at=None,
    )
    repository.upsert_progress(progress)
    assert repository.get_progress(
        student_id=progress.student_id,
        lesson_id=progress.lesson_id,
    ) == progress
    assert repository.list_progress_for_lessons([progress.lesson_id]) == [progress]
    repository.reset()
    assert repository.list_progress_for_lessons([progress.lesson_id]) == []

    monkeypatch.delenv("LEARNING_REPOSITORY", raising=False)
    assert isinstance(get_progress_repository(), InMemoryProgressRepository)

    monkeypatch.setenv("LEARNING_REPOSITORY", "postgres")
    monkeypatch.setenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")
    assert isinstance(get_progress_repository(ensure_schema=False), PostgresProgressRepository)
