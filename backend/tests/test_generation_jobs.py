from fastapi import HTTPException
import pytest

from main import (
    GenerationJobResponse,
    InMemoryGenerationJobRepository,
    UserProfile,
    generation_job_schema_sql,
    list_generation_jobs,
    reset_generation_job_store_for_tests,
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
