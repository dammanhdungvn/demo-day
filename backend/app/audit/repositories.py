from __future__ import annotations

import os
from typing import Any

import psycopg
from psycopg.rows import dict_row

from ..core.config import _database_conninfo
from .ports import AuditRepository
from .schemas import LessonAuditEventResponse


def audit_schema_sql() -> str:
    return """
    create table if not exists audit_events (
      id text primary key,
      lesson_id text not null,
      block_id text,
      actor_id text not null,
      actor_role text not null check (actor_role in ('admin', 'teacher', 'student')),
      action text not null,
      details text,
      created_at timestamptz not null default now()
    );

    create index if not exists idx_audit_events_lesson_created
      on audit_events (lesson_id, created_at asc);

    alter table audit_events enable row level security;

    revoke all on table audit_events from anon, authenticated;
    """


class InMemoryAuditEventRepository:
    def __init__(
        self,
        *,
        events: list[LessonAuditEventResponse] | None = None,
    ) -> None:
        self.events = events if events is not None else []

    def reset(self) -> None:
        self.events.clear()

    def ensure_schema(self) -> None:
        return None

    def save_event(
        self,
        event: LessonAuditEventResponse,
    ) -> LessonAuditEventResponse:
        self.events.append(event)
        return event

    def list_events_for_lesson(
        self,
        lesson_id: str,
    ) -> list[LessonAuditEventResponse]:
        return [event for event in self.events if event.lesson_id == lesson_id]


class PostgresAuditEventRepository:
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
                cur.execute(audit_schema_sql())

    def save_event(
        self,
        event: LessonAuditEventResponse,
    ) -> LessonAuditEventResponse:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    insert into audit_events (
                      id,
                      lesson_id,
                      block_id,
                      actor_id,
                      actor_role,
                      action,
                      details,
                      created_at
                    )
                    values (%s, %s, %s, %s, %s, %s, %s, %s::timestamptz)
                    on conflict (id) do update
                    set lesson_id = excluded.lesson_id,
                        block_id = excluded.block_id,
                        actor_id = excluded.actor_id,
                        actor_role = excluded.actor_role,
                        action = excluded.action,
                        details = excluded.details,
                        created_at = excluded.created_at
                    """,
                    (
                        event.id,
                        event.lesson_id,
                        event.block_id,
                        event.actor_id,
                        event.actor_role,
                        event.action,
                        event.details,
                        event.created_at,
                    ),
                )
        return event

    def list_events_for_lesson(
        self,
        lesson_id: str,
    ) -> list[LessonAuditEventResponse]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      id,
                      lesson_id,
                      block_id,
                      actor_id,
                      actor_role,
                      action,
                      details,
                      created_at::text
                    from audit_events
                    where lesson_id = %s
                    order by created_at asc
                    """,
                    (lesson_id,),
                )
                return [
                    LessonAuditEventResponse(
                        id=row["id"],
                        lesson_id=row["lesson_id"],
                        block_id=row["block_id"],
                        actor_id=row["actor_id"],
                        actor_role=row["actor_role"],
                        action=row["action"],
                        details=row["details"],
                        created_at=row["created_at"],
                    )
                    for row in cur.fetchall()
                ]


MEMORY_AUDIT_REPOSITORY = InMemoryAuditEventRepository()


def get_audit_repository(*, ensure_schema: bool = True) -> AuditRepository:
    mode = os.getenv("LEARNING_REPOSITORY", "memory").strip().lower()
    if mode == "memory":
        return MEMORY_AUDIT_REPOSITORY
    if mode == "postgres":
        repository = PostgresAuditEventRepository(_database_conninfo())
        if ensure_schema:
            repository.ensure_schema()
        return repository
    raise RuntimeError("LEARNING_REPOSITORY must be either 'memory' or 'postgres'")
