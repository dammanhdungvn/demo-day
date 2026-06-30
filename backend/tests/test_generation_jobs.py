from fastapi import HTTPException
import pytest

from main import (
    GenerationJobResponse,
    InMemoryGenerationJobRepository,
    UserProfile,
    cancel_generation_job,
    generation_job_schema_sql,
    list_generation_jobs,
    reset_generation_job_store_for_tests,
    retry_generation_job,
)


def user_profile(
    *,
    user_id: str = "teacher-test-1",
    role: str = "teacher",
    organization_id: str = "org-demo",
) -> UserProfile:
    return UserProfile(
        id=user_id,
        email=f"{user_id}@teachflow.local",
        name=user_id,
        role=role,
        organization_id=organization_id,
    )


def test_memory_generation_job_repository_create_update_and_list_by_actor() -> None:
    reset_generation_job_store_for_tests()
    repository = InMemoryGenerationJobRepository()
    teacher = user_profile()
    other_teacher = user_profile(user_id="teacher-test-2")

    job = repository.create_job(
        job_type="outline_generation",
        actor=teacher,
        job_input={"course_id": "course-1", "model": "gpt-test"},
    )
    repository.create_job(
        job_type="lesson_generation",
        actor=other_teacher,
        job_input={"outline_id": "outline-1"},
    )

    updated = repository.update_job(
        job.id,
        status="completed",
        output={"outline_id": "outline-1"},
    )

    assert isinstance(updated, GenerationJobResponse)
    assert updated.status == "completed"
    assert updated.output == {"outline_id": "outline-1"}
    assert repository.list_jobs_for_actor(teacher) == [updated]
    assert len(repository.list_jobs_for_actor(user_profile(role="admin"))) == 2


def test_generation_job_service_preserves_role_guards() -> None:
    repository = InMemoryGenerationJobRepository()
    teacher = user_profile()
    job = repository.create_job(
        job_type="block_regeneration",
        actor=teacher,
        job_input={"block_id": "block-1"},
    )

    assert list_generation_jobs(teacher, repository=repository) == [job]
    assert list_generation_jobs(
        user_profile(user_id="demo-admin", role="admin"),
        repository=repository,
    ) == [job]

    with pytest.raises(HTTPException) as student_error:
        list_generation_jobs(
            user_profile(user_id="student-test-1", role="student"),
            repository=repository,
        )
    assert student_error.value.status_code == 403


def test_generation_job_schema_sql_contains_lifecycle_columns_rls_and_revokes() -> None:
    schema_sql = generation_job_schema_sql().lower()

    assert "create table if not exists generation_jobs" in schema_sql
    assert "job_type text not null" in schema_sql
    assert "status text not null" in schema_sql
    assert "input jsonb not null" in schema_sql
    assert "retrieved_context jsonb not null" in schema_sql
    assert "alter table generation_jobs add column if not exists actor_id text" in schema_sql
    assert "alter table generation_jobs add column if not exists actor_role text" in schema_sql
    assert "alter table generation_jobs add column if not exists organization_id text" in schema_sql
    assert "alter table generation_jobs add column if not exists output jsonb" in schema_sql
    assert "alter table generation_jobs add column if not exists error_message text" in schema_sql
    assert "create index if not exists idx_generation_jobs_actor_created" in schema_sql
    assert "create index if not exists idx_generation_jobs_org_created" in schema_sql
    assert "alter table generation_jobs enable row level security" in schema_sql
    assert "revoke all on table generation_jobs from anon, authenticated" in schema_sql


def test_cancel_generation_job_preserves_actor_and_org_scope() -> None:
    repository = InMemoryGenerationJobRepository()
    teacher = user_profile()
    same_org_admin = user_profile(user_id="admin-test-1", role="admin")
    other_teacher = user_profile(user_id="teacher-test-2")
    other_org_admin = user_profile(
        user_id="admin-other-org",
        role="admin",
        organization_id="org-other",
    )
    job = repository.create_job(
        job_type="lesson_generation",
        actor=teacher,
        job_input={"outline_id": "outline-1"},
        status="processing",
    )

    with pytest.raises(HTTPException) as other_teacher_error:
        cancel_generation_job(job.id, other_teacher, repository=repository)
    assert other_teacher_error.value.status_code == 404

    with pytest.raises(HTTPException) as other_org_error:
        cancel_generation_job(job.id, other_org_admin, repository=repository)
    assert other_org_error.value.status_code == 404

    cancelled = cancel_generation_job(job.id, same_org_admin, repository=repository)

    assert cancelled.generation_job.status == "cancelled"
    assert cancelled.generation_job.output["cancelled_by"] == same_org_admin.id
    assert "Da huy tac vu" in cancelled.message


def test_cancel_generation_job_rejects_students_and_terminal_jobs() -> None:
    repository = InMemoryGenerationJobRepository()
    teacher = user_profile()
    student = user_profile(user_id="student-test-1", role="student")
    job = repository.create_job(
        job_type="outline_generation",
        actor=teacher,
        job_input={"course_id": "course-1"},
        status="processing",
    )
    completed = repository.update_job(
        job.id,
        status="completed",
        output={"outline_id": "outline-1"},
    )

    with pytest.raises(HTTPException) as student_error:
        cancel_generation_job(completed.id, student, repository=repository)
    assert student_error.value.status_code == 403

    with pytest.raises(HTTPException) as status_error:
        cancel_generation_job(completed.id, teacher, repository=repository)
    assert status_error.value.status_code == 409


def test_retry_generation_job_marks_failed_job_retrying_with_guidance() -> None:
    repository = InMemoryGenerationJobRepository()
    teacher = user_profile()
    job = repository.create_job(
        job_type="outline_generation",
        actor=teacher,
        job_input={"course_id": "course-1", "retry_supported": True},
        status="processing",
    )
    failed = repository.update_job(
        job.id,
        status="failed",
        error_message="Provider timeout",
    )

    retry = retry_generation_job(failed.id, teacher, repository=repository)

    assert retry.generation_job.status == "retrying"
    assert retry.generation_job.error_message is None
    assert retry.generation_job.output["retry_requested_by"] == teacher.id
    assert retry.generation_job.output["retry_source_status"] == "failed"
    assert "Da dua tac vu vao hang cho thu lai" in retry.message


def test_retry_generation_job_rejects_running_jobs_and_non_durable_document_uploads() -> None:
    repository = InMemoryGenerationJobRepository()
    teacher = user_profile()
    running = repository.create_job(
        job_type="lesson_generation",
        actor=teacher,
        job_input={"outline_id": "outline-1"},
        status="processing",
    )
    upload = repository.create_job(
        job_type="document_upload",
        actor=teacher,
        job_input={"document_id": "doc-1", "file_name": "source.pdf"},
        status="processing",
    )
    failed_upload = repository.update_job(
        upload.id,
        status="failed",
        error_message="Embedding provider is unavailable",
    )

    with pytest.raises(HTTPException) as running_error:
        retry_generation_job(running.id, teacher, repository=repository)
    assert running_error.value.status_code == 409

    with pytest.raises(HTTPException) as upload_error:
        retry_generation_job(failed_upload.id, teacher, repository=repository)
    assert upload_error.value.status_code == 409
    assert "upload lai file" in str(upload_error.value.detail).lower()
