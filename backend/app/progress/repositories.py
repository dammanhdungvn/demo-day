from __future__ import annotations

import os
from typing import Any

from fastapi import HTTPException, status
import psycopg
from psycopg.rows import dict_row

from ..core.config import _database_conninfo
from .ports import ProgressRepository
from .schemas import LessonProgressRecord


def progress_schema_sql() -> str:
    return """
    create table if not exists lesson_progress (
      student_id text not null,
      lesson_id text not null,
      class_id text not null,
      current_block_id text,
      current_slide_index integer not null default 0 check (current_slide_index >= 0),
      started_at timestamptz not null default now(),
      last_opened_at timestamptz not null default now(),
      completed_at timestamptz,
      primary key (student_id, lesson_id)
    );

    create index if not exists idx_lesson_progress_lesson
      on lesson_progress (lesson_id);
    create index if not exists idx_lesson_progress_class_lesson
      on lesson_progress (class_id, lesson_id);
    create index if not exists idx_lesson_progress_student_opened
      on lesson_progress (student_id, last_opened_at desc);

    alter table lesson_progress enable row level security;

    revoke all on table lesson_progress from anon, authenticated;
    """


class InMemoryProgressRepository:
    def __init__(
        self,
        *,
        progress: dict[tuple[str, str], LessonProgressRecord] | None = None,
    ) -> None:
        self.progress = progress if progress is not None else {}

    def reset(self) -> None:
        self.progress.clear()

    def ensure_schema(self) -> None:
        return None

    def get_progress(
        self,
        *,
        student_id: str,
        lesson_id: str,
    ) -> LessonProgressRecord | None:
        return self.progress.get((student_id, lesson_id))

    def upsert_progress(
        self,
        progress: LessonProgressRecord,
    ) -> LessonProgressRecord:
        self.progress[(progress.student_id, progress.lesson_id)] = progress
        return progress

    def list_progress_for_lessons(
        self,
        lesson_ids: list[str],
    ) -> list[LessonProgressRecord]:
        lesson_id_set = set(lesson_ids)
        return [
            progress
            for progress in self.progress.values()
            if progress.lesson_id in lesson_id_set
        ]


class PostgresProgressRepository:
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
                cur.execute(progress_schema_sql())

    def get_progress(
        self,
        *,
        student_id: str,
        lesson_id: str,
    ) -> LessonProgressRecord | None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      lesson_id,
                      class_id,
                      student_id,
                      current_block_id,
                      current_slide_index,
                      started_at::text,
                      last_opened_at::text,
                      completed_at::text
                    from lesson_progress
                    where student_id = %s
                      and lesson_id = %s
                    """,
                    (student_id, lesson_id),
                )
                row = cur.fetchone()
                return LessonProgressRecord(**row) if row is not None else None

    def upsert_progress(
        self,
        progress: LessonProgressRecord,
    ) -> LessonProgressRecord:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    insert into lesson_progress (
                      student_id,
                      lesson_id,
                      class_id,
                      current_block_id,
                      current_slide_index,
                      started_at,
                      last_opened_at,
                      completed_at
                    )
                    values (%s, %s, %s, %s, %s, %s::timestamptz, %s::timestamptz, %s::timestamptz)
                    on conflict (student_id, lesson_id) do update
                    set class_id = excluded.class_id,
                        current_block_id = excluded.current_block_id,
                        current_slide_index = excluded.current_slide_index,
                        started_at = excluded.started_at,
                        last_opened_at = excluded.last_opened_at,
                        completed_at = excluded.completed_at
                    returning
                      lesson_id,
                      class_id,
                      student_id,
                      current_block_id,
                      current_slide_index,
                      started_at::text,
                      last_opened_at::text,
                      completed_at::text
                    """,
                    (
                        progress.student_id,
                        progress.lesson_id,
                        progress.class_id,
                        progress.current_block_id,
                        progress.current_slide_index,
                        progress.started_at,
                        progress.last_opened_at,
                        progress.completed_at,
                    ),
                )
                row = cur.fetchone()
                if row is None:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Could not save lesson progress",
                    )
                return LessonProgressRecord(**row)

    def list_progress_for_lessons(
        self,
        lesson_ids: list[str],
    ) -> list[LessonProgressRecord]:
        if not lesson_ids:
            return []
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      lesson_id,
                      class_id,
                      student_id,
                      current_block_id,
                      current_slide_index,
                      started_at::text,
                      last_opened_at::text,
                      completed_at::text
                    from lesson_progress
                    where lesson_id = any(%s)
                    order by last_opened_at desc
                    """,
                    (lesson_ids,),
                )
                return [LessonProgressRecord(**row) for row in cur.fetchall()]


MEMORY_PROGRESS_REPOSITORY = InMemoryProgressRepository()


def get_progress_repository(*, ensure_schema: bool = True) -> ProgressRepository:
    mode = os.getenv("LEARNING_REPOSITORY", "memory").strip().lower()
    if mode == "memory":
        return MEMORY_PROGRESS_REPOSITORY
    if mode == "postgres":
        repository = PostgresProgressRepository(_database_conninfo())
        if ensure_schema:
            repository.ensure_schema()
        return repository
    raise RuntimeError("LEARNING_REPOSITORY must be either 'memory' or 'postgres'")
