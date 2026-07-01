from __future__ import annotations

import json
import os
from typing import Any

from fastapi import HTTPException, status
import psycopg
from psycopg.rows import dict_row

from ..core.config import _database_conninfo
from .ports import LessonExportRepository
from .schemas import LessonExportRecord


def lesson_export_schema_sql() -> str:
    return """
    create table if not exists lesson_export_records (
      id text primary key,
      lesson_id text not null,
      course_id text not null,
      class_id text not null,
      teacher_id text not null,
      organization_id text not null,
      actor_id text not null,
      actor_role text not null check (actor_role in ('admin', 'teacher', 'student')),
      export_format text not null check (export_format in ('markdown', 'pptx', 'pdf')),
      delivery text not null check (delivery in ('download', 'print')),
      file_name text,
      block_count integer not null default 0 check (block_count >= 0),
      citation_count integer not null default 0 check (citation_count >= 0),
      client_metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create index if not exists idx_lesson_export_records_lesson_created
      on lesson_export_records (lesson_id, created_at desc);
    create index if not exists idx_lesson_export_records_org_created
      on lesson_export_records (organization_id, created_at desc);
    create index if not exists idx_lesson_export_records_actor_created
      on lesson_export_records (actor_id, created_at desc);

    alter table lesson_export_records enable row level security;

    revoke all on table lesson_export_records from anon, authenticated;
    """


class InMemoryLessonExportRepository:
    def __init__(
        self,
        *,
        records: dict[str, LessonExportRecord] | None = None,
    ) -> None:
        self.records = records if records is not None else {}

    def reset(self) -> None:
        self.records.clear()

    def ensure_schema(self) -> None:
        return None

    def save_export(self, record: LessonExportRecord) -> LessonExportRecord:
        self.records[record.id] = record
        return record

    def list_exports_for_lesson(self, lesson_id: str) -> list[LessonExportRecord]:
        return sorted(
            [
                record
                for record in self.records.values()
                if record.lesson_id == lesson_id
            ],
            key=lambda record: record.created_at,
            reverse=True,
        )


class PostgresLessonExportRepository:
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
                cur.execute(lesson_export_schema_sql())

    def _row_to_record(self, row: dict[str, Any]) -> LessonExportRecord:
        return LessonExportRecord(
            id=row["id"],
            lesson_id=row["lesson_id"],
            course_id=row["course_id"],
            class_id=row["class_id"],
            teacher_id=row["teacher_id"],
            organization_id=row["organization_id"],
            actor_id=row["actor_id"],
            actor_role=row["actor_role"],
            export_format=row["export_format"],
            delivery=row["delivery"],
            file_name=row["file_name"],
            block_count=row["block_count"],
            citation_count=row["citation_count"],
            client_metadata=dict(row["client_metadata"]),
            created_at=row["created_at"],
        )

    def save_export(self, record: LessonExportRecord) -> LessonExportRecord:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    insert into lesson_export_records (
                      id,
                      lesson_id,
                      course_id,
                      class_id,
                      teacher_id,
                      organization_id,
                      actor_id,
                      actor_role,
                      export_format,
                      delivery,
                      file_name,
                      block_count,
                      citation_count,
                      client_metadata,
                      created_at
                    )
                    values (
                      %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                      %s::jsonb, %s::timestamptz
                    )
                    returning
                      id,
                      lesson_id,
                      course_id,
                      class_id,
                      teacher_id,
                      organization_id,
                      actor_id,
                      actor_role,
                      export_format,
                      delivery,
                      file_name,
                      block_count,
                      citation_count,
                      client_metadata,
                      created_at::text
                    """,
                    (
                        record.id,
                        record.lesson_id,
                        record.course_id,
                        record.class_id,
                        record.teacher_id,
                        record.organization_id,
                        record.actor_id,
                        record.actor_role,
                        record.export_format,
                        record.delivery,
                        record.file_name,
                        record.block_count,
                        record.citation_count,
                        json.dumps(record.client_metadata),
                        record.created_at,
                    ),
                )
                row = cur.fetchone()
                if row is None:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Could not save lesson export record",
                    )
                return self._row_to_record(row)

    def list_exports_for_lesson(self, lesson_id: str) -> list[LessonExportRecord]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      id,
                      lesson_id,
                      course_id,
                      class_id,
                      teacher_id,
                      organization_id,
                      actor_id,
                      actor_role,
                      export_format,
                      delivery,
                      file_name,
                      block_count,
                      citation_count,
                      client_metadata,
                      created_at::text
                    from lesson_export_records
                    where lesson_id = %s
                    order by created_at desc
                    """,
                    (lesson_id,),
                )
                return [self._row_to_record(row) for row in cur.fetchall()]


MEMORY_LESSON_EXPORT_REPOSITORY = InMemoryLessonExportRepository()


def get_lesson_export_repository(
    *,
    ensure_schema: bool = True,
) -> LessonExportRepository:
    mode = os.getenv("LEARNING_REPOSITORY", "memory").strip().lower()
    if mode == "memory":
        return MEMORY_LESSON_EXPORT_REPOSITORY
    if mode == "postgres":
        repository = PostgresLessonExportRepository(_database_conninfo())
        if ensure_schema:
            repository.ensure_schema()
        return repository
    raise RuntimeError("LEARNING_REPOSITORY must be either 'memory' or 'postgres'")
