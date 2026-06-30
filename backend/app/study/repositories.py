from __future__ import annotations

import json
import os
from typing import Any

from fastapi import HTTPException, status
import psycopg
from psycopg.rows import dict_row

from ..core.config import _database_conninfo
from .ports import StudyRepository
from .schemas import LessonPracticeAttemptRecord, LessonStudyStateRecord


def study_schema_sql() -> str:
    return """
    create table if not exists lesson_study_state (
      student_id text not null,
      lesson_id text not null,
      class_id text not null,
      bookmarked_block_ids jsonb not null default '[]'::jsonb,
      notes_by_block_id jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now(),
      primary key (student_id, lesson_id)
    );

    create index if not exists idx_lesson_study_state_lesson
      on lesson_study_state (lesson_id);
    create index if not exists idx_lesson_study_state_class_lesson
      on lesson_study_state (class_id, lesson_id);
    create index if not exists idx_lesson_study_state_student_updated
      on lesson_study_state (student_id, updated_at desc);

    alter table lesson_study_state enable row level security;

    revoke all on table lesson_study_state from anon, authenticated;

    create table if not exists lesson_practice_attempts (
      student_id text not null,
      lesson_id text not null,
      class_id text not null,
      block_id text not null,
      answer_text text not null default '',
      self_check_status text not null default 'not_started'
        check (self_check_status in ('not_started', 'needs_review', 'got_it')),
      attempt_count integer not null default 0 check (attempt_count >= 0),
      updated_at timestamptz not null default now(),
      primary key (student_id, lesson_id, block_id)
    );

    create index if not exists idx_lesson_practice_attempts_lesson_block
      on lesson_practice_attempts (lesson_id, block_id);
    create index if not exists idx_lesson_practice_attempts_student_updated
      on lesson_practice_attempts (student_id, updated_at desc);

    alter table lesson_practice_attempts enable row level security;

    revoke all on table lesson_practice_attempts from anon, authenticated;
    """


class InMemoryStudyRepository:
    def __init__(
        self,
        *,
        states: dict[tuple[str, str], LessonStudyStateRecord] | None = None,
        practice_attempts: (
            dict[tuple[str, str, str], LessonPracticeAttemptRecord] | None
        ) = None,
    ) -> None:
        self.states = states if states is not None else {}
        self.practice_attempts = (
            practice_attempts if practice_attempts is not None else {}
        )

    def reset(self) -> None:
        self.states.clear()
        self.practice_attempts.clear()

    def ensure_schema(self) -> None:
        return None

    def get_state(
        self,
        *,
        student_id: str,
        lesson_id: str,
    ) -> LessonStudyStateRecord | None:
        return self.states.get((student_id, lesson_id))

    def upsert_state(
        self,
        state: LessonStudyStateRecord,
    ) -> LessonStudyStateRecord:
        self.states[(state.student_id, state.lesson_id)] = state
        return state

    def list_states_for_student(
        self,
        student_id: str,
    ) -> list[LessonStudyStateRecord]:
        return sorted(
            [
                state
                for state in self.states.values()
                if state.student_id == student_id
            ],
            key=lambda state: state.updated_at,
            reverse=True,
        )

    def get_practice_attempt(
        self,
        *,
        student_id: str,
        lesson_id: str,
        block_id: str,
    ) -> LessonPracticeAttemptRecord | None:
        return self.practice_attempts.get((student_id, lesson_id, block_id))

    def upsert_practice_attempt(
        self,
        attempt: LessonPracticeAttemptRecord,
    ) -> LessonPracticeAttemptRecord:
        self.practice_attempts[
            (attempt.student_id, attempt.lesson_id, attempt.block_id)
        ] = attempt
        return attempt

    def list_practice_attempts_for_student(
        self,
        student_id: str,
    ) -> list[LessonPracticeAttemptRecord]:
        return sorted(
            [
                attempt
                for attempt in self.practice_attempts.values()
                if attempt.student_id == student_id
            ],
            key=lambda attempt: attempt.updated_at,
            reverse=True,
        )


class PostgresStudyRepository:
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
                cur.execute(study_schema_sql())

    def _row_to_record(self, row: dict[str, Any]) -> LessonStudyStateRecord:
        return LessonStudyStateRecord(
            lesson_id=row["lesson_id"],
            class_id=row["class_id"],
            student_id=row["student_id"],
            bookmarked_block_ids=list(row["bookmarked_block_ids"]),
            notes_by_block_id=dict(row["notes_by_block_id"]),
            updated_at=row["updated_at"],
        )

    def _row_to_practice_attempt(
        self,
        row: dict[str, Any],
    ) -> LessonPracticeAttemptRecord:
        return LessonPracticeAttemptRecord(
            lesson_id=row["lesson_id"],
            class_id=row["class_id"],
            student_id=row["student_id"],
            block_id=row["block_id"],
            answer_text=row["answer_text"],
            self_check_status=row["self_check_status"],
            attempt_count=row["attempt_count"],
            updated_at=row["updated_at"],
        )

    def get_state(
        self,
        *,
        student_id: str,
        lesson_id: str,
    ) -> LessonStudyStateRecord | None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      lesson_id,
                      class_id,
                      student_id,
                      bookmarked_block_ids,
                      notes_by_block_id,
                      updated_at::text
                    from lesson_study_state
                    where student_id = %s
                      and lesson_id = %s
                    """,
                    (student_id, lesson_id),
                )
                row = cur.fetchone()
                return self._row_to_record(row) if row is not None else None

    def upsert_state(
        self,
        state: LessonStudyStateRecord,
    ) -> LessonStudyStateRecord:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    insert into lesson_study_state (
                      student_id,
                      lesson_id,
                      class_id,
                      bookmarked_block_ids,
                      notes_by_block_id,
                      updated_at
                    )
                    values (%s, %s, %s, %s::jsonb, %s::jsonb, %s::timestamptz)
                    on conflict (student_id, lesson_id) do update
                    set class_id = excluded.class_id,
                        bookmarked_block_ids = excluded.bookmarked_block_ids,
                        notes_by_block_id = excluded.notes_by_block_id,
                        updated_at = excluded.updated_at
                    returning
                      lesson_id,
                      class_id,
                      student_id,
                      bookmarked_block_ids,
                      notes_by_block_id,
                      updated_at::text
                    """,
                    (
                        state.student_id,
                        state.lesson_id,
                        state.class_id,
                        json.dumps(state.bookmarked_block_ids),
                        json.dumps(state.notes_by_block_id),
                        state.updated_at,
                    ),
                )
                row = cur.fetchone()
                if row is None:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Could not save lesson study state",
                    )
                return self._row_to_record(row)

    def list_states_for_student(
        self,
        student_id: str,
    ) -> list[LessonStudyStateRecord]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      lesson_id,
                      class_id,
                      student_id,
                      bookmarked_block_ids,
                      notes_by_block_id,
                      updated_at::text
                    from lesson_study_state
                    where student_id = %s
                    order by updated_at desc
                    """,
                    (student_id,),
                )
                return [self._row_to_record(row) for row in cur.fetchall()]

    def get_practice_attempt(
        self,
        *,
        student_id: str,
        lesson_id: str,
        block_id: str,
    ) -> LessonPracticeAttemptRecord | None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      lesson_id,
                      class_id,
                      student_id,
                      block_id,
                      answer_text,
                      self_check_status,
                      attempt_count,
                      updated_at::text
                    from lesson_practice_attempts
                    where student_id = %s
                      and lesson_id = %s
                      and block_id = %s
                    """,
                    (student_id, lesson_id, block_id),
                )
                row = cur.fetchone()
                return (
                    self._row_to_practice_attempt(row) if row is not None else None
                )

    def upsert_practice_attempt(
        self,
        attempt: LessonPracticeAttemptRecord,
    ) -> LessonPracticeAttemptRecord:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    insert into lesson_practice_attempts (
                      student_id,
                      lesson_id,
                      class_id,
                      block_id,
                      answer_text,
                      self_check_status,
                      attempt_count,
                      updated_at
                    )
                    values (%s, %s, %s, %s, %s, %s, %s, %s::timestamptz)
                    on conflict (student_id, lesson_id, block_id) do update
                    set class_id = excluded.class_id,
                        answer_text = excluded.answer_text,
                        self_check_status = excluded.self_check_status,
                        attempt_count = excluded.attempt_count,
                        updated_at = excluded.updated_at
                    returning
                      lesson_id,
                      class_id,
                      student_id,
                      block_id,
                      answer_text,
                      self_check_status,
                      attempt_count,
                      updated_at::text
                    """,
                    (
                        attempt.student_id,
                        attempt.lesson_id,
                        attempt.class_id,
                        attempt.block_id,
                        attempt.answer_text,
                        attempt.self_check_status,
                        attempt.attempt_count,
                        attempt.updated_at,
                    ),
                )
                row = cur.fetchone()
                if row is None:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Could not save lesson practice attempt",
                    )
                return self._row_to_practice_attempt(row)

    def list_practice_attempts_for_student(
        self,
        student_id: str,
    ) -> list[LessonPracticeAttemptRecord]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      lesson_id,
                      class_id,
                      student_id,
                      block_id,
                      answer_text,
                      self_check_status,
                      attempt_count,
                      updated_at::text
                    from lesson_practice_attempts
                    where student_id = %s
                    order by updated_at desc
                    """,
                    (student_id,),
                )
                return [
                    self._row_to_practice_attempt(row) for row in cur.fetchall()
                ]


MEMORY_STUDY_REPOSITORY = InMemoryStudyRepository()


def get_study_repository(*, ensure_schema: bool = True) -> StudyRepository:
    mode = os.getenv("LEARNING_REPOSITORY", "memory").strip().lower()
    if mode == "memory":
        return MEMORY_STUDY_REPOSITORY
    if mode == "postgres":
        repository = PostgresStudyRepository(_database_conninfo())
        if ensure_schema:
            repository.ensure_schema()
        return repository
    raise RuntimeError("LEARNING_REPOSITORY must be either 'memory' or 'postgres'")
