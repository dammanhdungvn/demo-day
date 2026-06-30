from typing import get_args

from app.jobs.ports import GenerationJobRepository
from app.jobs.repositories import (
    InMemoryGenerationJobRepository,
    PostgresGenerationJobRepository,
    generation_job_schema_sql,
    get_generation_job_repository,
)
from app.jobs.routes import (
    cancel_generation_job_route,
    generation_jobs_route,
    retry_generation_job_route,
    router as jobs_router,
)
from app.jobs.schemas import (
    GenerationJobActionResponse,
    GenerationJobResponse,
    GenerationJobStatus,
)
from app.jobs.services import (
    cancel_generation_job,
    list_generation_jobs,
    retry_generation_job,
)
from fastapi import HTTPException
import pytest
from main import app as main_app
from main import GenerationJobRepository as MainGenerationJobRepository
from main import GenerationJobResponse as MainGenerationJobResponse
from main import GenerationJobStatus as MainGenerationJobStatus
from main import InMemoryGenerationJobRepository as MainInMemoryGenerationJobRepository
from main import GenerationJobActionResponse as MainGenerationJobActionResponse
from main import cancel_generation_job as main_cancel_generation_job
from main import cancel_generation_job_route as main_cancel_generation_job_route
from main import generation_jobs_route as main_generation_jobs_route
from main import list_generation_jobs as main_list_generation_jobs
from main import PostgresGenerationJobRepository as MainPostgresGenerationJobRepository
from main import retry_generation_job as main_retry_generation_job
from main import retry_generation_job_route as main_retry_generation_job_route
from main import UserProfile
from main import generation_job_schema_sql as main_generation_job_schema_sql
from main import get_generation_job_repository as main_get_generation_job_repository


class RecordingJobsCursor:
    def __init__(self) -> None:
        self.statement = ""
        self.params: tuple[object, ...] | object = ()

    def __enter__(self):
        return self

    def __exit__(self, *_args) -> None:
        return None

    def execute(self, statement: str, params: tuple[object, ...] | object = ()) -> None:
        self.statement = statement
        self.params = params

    def fetchall(self):
        return []


class RecordingJobsConnection:
    def __init__(self, cursor: RecordingJobsCursor) -> None:
        self.cursor_instance = cursor

    def __enter__(self):
        return self

    def __exit__(self, *_args) -> None:
        return None

    def cursor(self):
        return self.cursor_instance


def test_jobs_schema_module_exports_generation_job_status_and_response() -> None:
    assert set(get_args(GenerationJobStatus)) == {
        "queued",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "retrying",
        "skipped",
    }
    assert MainGenerationJobStatus is GenerationJobStatus

    job = GenerationJobResponse(
        id="job-1",
        job_type="outline_generation",
        status="completed",
        actor_id="teacher-1",
        actor_role="teacher",
        input={"course_id": "course-1"},
        retrieved_context=[],
        output={"outline_id": "outline-1"},
        error_message=None,
        created_at="2026-06-29T00:00:00+00:00",
        updated_at="2026-06-29T00:01:00+00:00",
    )

    assert job.status == "completed"
    assert job.output == {"outline_id": "outline-1"}
    assert MainGenerationJobResponse is GenerationJobResponse

    action = GenerationJobActionResponse(generation_job=job, message="Done")
    assert action.generation_job.id == "job-1"
    assert MainGenerationJobActionResponse is GenerationJobActionResponse


def test_jobs_ports_module_keeps_main_compatibility_export() -> None:
    assert hasattr(GenerationJobRepository, "ensure_schema")
    assert hasattr(GenerationJobRepository, "create_job")
    assert hasattr(GenerationJobRepository, "get_job")
    assert hasattr(GenerationJobRepository, "update_job")
    assert hasattr(GenerationJobRepository, "list_jobs_for_actor")
    assert MainGenerationJobRepository is GenerationJobRepository


def test_jobs_repositories_module_keeps_main_compatibility_export(monkeypatch) -> None:
    schema_sql = generation_job_schema_sql().lower()

    assert "create table if not exists generation_jobs" in schema_sql
    assert "alter table generation_jobs add column if not exists organization_id text" in schema_sql
    assert "idx_generation_jobs_actor_created" in schema_sql
    assert "idx_generation_jobs_org_created" in schema_sql
    assert "revoke all on table generation_jobs from anon, authenticated" in schema_sql
    assert MainInMemoryGenerationJobRepository is InMemoryGenerationJobRepository
    assert MainPostgresGenerationJobRepository is PostgresGenerationJobRepository
    assert main_generation_job_schema_sql is generation_job_schema_sql
    assert main_get_generation_job_repository is get_generation_job_repository

    teacher = UserProfile(
        id="teacher-1",
        email="teacher@teachflow.local",
        name="Teacher",
        role="teacher",
        organization_id="org-demo",
    )
    repository = InMemoryGenerationJobRepository()
    job = repository.create_job(
        job_type="outline_generation",
        actor=teacher,
        job_input={"course_id": "course-1"},
    )
    updated = repository.update_job(
        job.id,
        status="completed",
        output={"outline_id": "outline-1"},
    )
    assert repository.get_job(job.id) == updated
    assert repository.list_jobs_for_actor(teacher) == [updated]
    repository.reset()
    assert repository.list_jobs_for_actor(teacher) == []

    monkeypatch.delenv("LEARNING_REPOSITORY", raising=False)
    assert isinstance(get_generation_job_repository(), InMemoryGenerationJobRepository)

    monkeypatch.setenv("LEARNING_REPOSITORY", "postgres")
    monkeypatch.setenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")
    assert isinstance(
        get_generation_job_repository(ensure_schema=False),
        PostgresGenerationJobRepository,
    )


def test_postgres_admin_generation_jobs_are_scoped_by_organization(monkeypatch) -> None:
    admin = UserProfile(
        id="admin-1",
        email="admin@teachflow.local",
        name="Admin",
        role="admin",
        organization_id="org-demo",
    )
    cursor = RecordingJobsCursor()
    repository = PostgresGenerationJobRepository("postgresql://example")
    monkeypatch.setattr(
        repository,
        "_connect",
        lambda: RecordingJobsConnection(cursor),
    )

    assert repository.list_jobs_for_actor(admin) == []

    statement = " ".join(cursor.statement.lower().split())
    assert "where organization_id = %s" in statement
    assert cursor.params == ("org-demo", 20)


def test_jobs_services_module_keeps_main_compatibility_export() -> None:
    teacher = UserProfile(
        id="teacher-1",
        email="teacher@teachflow.local",
        name="Teacher",
        role="teacher",
        organization_id="org-demo",
    )
    admin = teacher.model_copy(update={"id": "admin-1", "role": "admin"})
    student = teacher.model_copy(update={"id": "student-1", "role": "student"})
    repository = InMemoryGenerationJobRepository()
    job = repository.create_job(
        job_type="lesson_generation",
        actor=teacher,
        job_input={"outline_id": "outline-1"},
    )

    assert list_generation_jobs(teacher, repository=repository) == [job]
    assert list_generation_jobs(admin, repository=repository) == [job]
    assert main_list_generation_jobs is list_generation_jobs
    assert main_retry_generation_job is retry_generation_job
    assert main_cancel_generation_job is cancel_generation_job

    with pytest.raises(HTTPException) as exc_info:
        list_generation_jobs(student, repository=repository)

    assert exc_info.value.status_code == 403


def test_jobs_routes_module_keeps_main_registration_and_compatibility_export() -> None:
    module_routes = {
        (getattr(route, "path", ""), tuple(getattr(route, "methods", []))): route
        for route in jobs_router.routes
    }
    app_routes = [
        route
        for route in main_app.routes
        if getattr(route, "original_router", None) is jobs_router
    ]

    list_route = next(
        route
        for route in jobs_router.routes
        if getattr(route, "path", "") == "/api/v1/generation-jobs"
    )
    retry_route = next(
        route
        for route in jobs_router.routes
        if getattr(route, "path", "") == "/api/v1/generation-jobs/{job_id}/retry"
    )
    cancel_route = next(
        route
        for route in jobs_router.routes
        if getattr(route, "path", "") == "/api/v1/generation-jobs/{job_id}/cancel"
    )

    assert module_routes
    assert len(app_routes) == 1
    assert list_route.endpoint is generation_jobs_route
    assert retry_route.endpoint is retry_generation_job_route
    assert cancel_route.endpoint is cancel_generation_job_route
    assert main_generation_jobs_route is generation_jobs_route
    assert main_retry_generation_job_route is retry_generation_job_route
    assert main_cancel_generation_job_route is cancel_generation_job_route
