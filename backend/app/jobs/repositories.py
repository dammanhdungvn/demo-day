from __future__ import annotations

import json
import os
from typing import Any
from uuid import uuid4

from fastapi import HTTPException
import psycopg
from psycopg.rows import dict_row

from ..auth.schemas import UserProfile
from ..core.config import _database_conninfo
from ..core.errors import _not_found
from ..core.security import _user_organization_id
from ..core.time import _now_iso
from .ports import GenerationJobRepository
from .schemas import GenerationJobResponse, GenerationJobStatus


_CANCELLED_PRESERVED_STATUSES: set[GenerationJobStatus] = {
    "completed",
    "failed",
    "skipped",
}


def generation_job_schema_sql() -> str:
    return """
    create table if not exists generation_jobs (
      id uuid primary key default gen_random_uuid(),
      job_type text not null,
      status text not null,
      input jsonb not null default '{}'::jsonb,
      retrieved_context jsonb not null default '[]'::jsonb,
      actor_id text,
      actor_role text,
      organization_id text,
      output jsonb not null default '{}'::jsonb,
      error_message text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    alter table generation_jobs add column if not exists actor_id text;
    alter table generation_jobs add column if not exists actor_role text;
    alter table generation_jobs add column if not exists organization_id text;
    alter table generation_jobs add column if not exists output jsonb not null default '{}'::jsonb;
    alter table generation_jobs add column if not exists error_message text;

    create index if not exists generation_jobs_type_status_idx
      on generation_jobs (job_type, status);
    create index if not exists idx_generation_jobs_actor_created
      on generation_jobs (actor_id, created_at desc);
    create index if not exists idx_generation_jobs_org_created
      on generation_jobs (organization_id, created_at desc);

    alter table generation_jobs enable row level security;

    revoke all on table generation_jobs from anon, authenticated;
    """


def _new_generation_job_id() -> str:
    return f"job-{uuid4()}"


class InMemoryGenerationJobRepository:
    def __init__(
        self,
        *,
        jobs: dict[str, GenerationJobResponse] | None = None,
    ) -> None:
        self.jobs = jobs if jobs is not None else {}

    def reset(self) -> None:
        self.jobs.clear()

    def ensure_schema(self) -> None:
        return None

    def create_job(
        self,
        *,
        job_type: str,
        actor: UserProfile,
        job_input: dict[str, Any],
        retrieved_context: list[dict[str, Any]] | None = None,
        status: GenerationJobStatus = "processing",
    ) -> GenerationJobResponse:
        now = _now_iso()
        job = GenerationJobResponse(
            id=_new_generation_job_id(),
            job_type=job_type,
            status=status,
            organization_id=_user_organization_id(actor),
            actor_id=actor.id,
            actor_role=actor.role,
            input=job_input,
            retrieved_context=retrieved_context or [],
            output={},
            error_message=None,
            created_at=now,
            updated_at=now,
        )
        self.jobs[job.id] = job
        return job

    def update_job(
        self,
        job_id: str,
        *,
        status: GenerationJobStatus,
        output: dict[str, Any] | None = None,
        error_message: str | None = None,
    ) -> GenerationJobResponse:
        job = self.jobs.get(job_id)
        if job is None:
            raise _not_found("Generation job not found")
        if job.status == "cancelled" and status in _CANCELLED_PRESERVED_STATUSES:
            return job
        updated = job.model_copy(
            update={
                "status": status,
                "output": output if output is not None else job.output,
                "error_message": error_message,
                "updated_at": _now_iso(),
            }
        )
        self.jobs[job_id] = updated
        return updated

    def get_job(self, job_id: str) -> GenerationJobResponse:
        job = self.jobs.get(job_id)
        if job is None:
            raise _not_found("Generation job not found")
        return job

    def list_jobs_for_actor(
        self,
        actor: UserProfile,
        *,
        limit: int = 20,
    ) -> list[GenerationJobResponse]:
        jobs = list(self.jobs.values())
        organization_id = _user_organization_id(actor)
        if actor.role == "admin":
            jobs = [job for job in jobs if job.organization_id == organization_id]
        else:
            jobs = [job for job in jobs if job.actor_id == actor.id]
        return sorted(jobs, key=lambda job: job.created_at, reverse=True)[:limit]


class PostgresGenerationJobRepository:
    def __init__(self, conninfo: str) -> None:
        self.conninfo = conninfo

    def _connect(self) -> psycopg.Connection[dict[str, Any]]:
        return psycopg.connect(
            self.conninfo,
            connect_timeout=20,
            prepare_threshold=None,
            row_factory=dict_row,
        )

    def ensure_schema(self) -> None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(generation_job_schema_sql())

    def _row_to_job(self, row: dict[str, Any]) -> GenerationJobResponse:
        return GenerationJobResponse(
            id=str(row["id"]),
            job_type=row["job_type"],
            status=row["status"],
            organization_id=row.get("organization_id"),
            actor_id=row["actor_id"],
            actor_role=row["actor_role"],
            input=dict(row["input"]),
            retrieved_context=list(row["retrieved_context"]),
            output=dict(row["output"]),
            error_message=row["error_message"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    def create_job(
        self,
        *,
        job_type: str,
        actor: UserProfile,
        job_input: dict[str, Any],
        retrieved_context: list[dict[str, Any]] | None = None,
        status: GenerationJobStatus = "processing",
    ) -> GenerationJobResponse:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    insert into generation_jobs (
                      job_type,
                      status,
                      input,
                      retrieved_context,
                      actor_id,
                      actor_role,
                      organization_id,
                      output,
                      error_message
                    )
                    values (%s, %s, %s::jsonb, %s::jsonb, %s, %s, %s, '{}'::jsonb, null)
                    returning
                      id::text,
                      job_type,
                      status,
                      organization_id,
                      actor_id,
                      actor_role,
                      input,
                      retrieved_context,
                      output,
                      error_message,
                      created_at::text,
                      updated_at::text
                    """,
                    (
                        job_type,
                        status,
                        json.dumps(job_input),
                        json.dumps(retrieved_context or []),
                        actor.id,
                        actor.role,
                        _user_organization_id(actor),
                    ),
                )
                row = cur.fetchone()
                if row is None:
                    raise HTTPException(
                        status_code=500,
                        detail="Could not save generation job",
                    )
                return self._row_to_job(row)

    def update_job(
        self,
        job_id: str,
        *,
        status: GenerationJobStatus,
        output: dict[str, Any] | None = None,
        error_message: str | None = None,
    ) -> GenerationJobResponse:
        existing = self.get_job(job_id)
        if existing.status == "cancelled" and status in _CANCELLED_PRESERVED_STATUSES:
            return existing
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    update generation_jobs
                    set status = %s,
                        output = coalesce(%s::jsonb, output),
                        error_message = %s,
                        updated_at = now()
                    where id::text = %s
                    returning
                      id::text,
                      job_type,
                      status,
                      organization_id,
                      actor_id,
                      actor_role,
                      input,
                      retrieved_context,
                      output,
                      error_message,
                      created_at::text,
                      updated_at::text
                    """,
                    (
                        status,
                        json.dumps(output) if output is not None else None,
                        error_message,
                        job_id,
                    ),
                )
                row = cur.fetchone()
                if row is None:
                    raise _not_found("Generation job not found")
                return self._row_to_job(row)

    def get_job(self, job_id: str) -> GenerationJobResponse:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      id::text,
                      job_type,
                      status,
                      organization_id,
                      actor_id,
                      actor_role,
                      input,
                      retrieved_context,
                      output,
                      error_message,
                      created_at::text,
                      updated_at::text
                    from generation_jobs
                    where id::text = %s
                    limit 1
                    """,
                    (job_id,),
                )
                row = cur.fetchone()
                if row is None:
                    raise _not_found("Generation job not found")
                return self._row_to_job(row)

    def list_jobs_for_actor(
        self,
        actor: UserProfile,
        *,
        limit: int = 20,
    ) -> list[GenerationJobResponse]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                if actor.role == "admin":
                    cur.execute(
                        """
                        select
                          id::text,
                          job_type,
                          status,
                          organization_id,
                          actor_id,
                          actor_role,
                          input,
                          retrieved_context,
                          output,
                          error_message,
                          created_at::text,
                          updated_at::text
                        from generation_jobs
                        where organization_id = %s
                        order by created_at desc
                        limit %s
                        """,
                        (_user_organization_id(actor), limit),
                    )
                else:
                    cur.execute(
                        """
                        select
                          id::text,
                          job_type,
                          status,
                          organization_id,
                          actor_id,
                          actor_role,
                          input,
                          retrieved_context,
                          output,
                          error_message,
                          created_at::text,
                          updated_at::text
                        from generation_jobs
                        where actor_id = %s
                          and organization_id = %s
                        order by created_at desc
                        limit %s
                        """,
                        (actor.id, _user_organization_id(actor), limit),
                    )
                return [self._row_to_job(row) for row in cur.fetchall()]


MEMORY_GENERATION_JOB_REPOSITORY = InMemoryGenerationJobRepository()


def get_generation_job_repository(
    *,
    ensure_schema: bool = True,
) -> GenerationJobRepository:
    mode = os.getenv("LEARNING_REPOSITORY", "memory").strip().lower()
    if mode == "memory":
        return MEMORY_GENERATION_JOB_REPOSITORY
    if mode == "postgres":
        repository = PostgresGenerationJobRepository(_database_conninfo())
        if ensure_schema:
            repository.ensure_schema()
        return repository
    raise RuntimeError("LEARNING_REPOSITORY must be either 'memory' or 'postgres'")
