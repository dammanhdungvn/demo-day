from typing import Protocol

from .schemas import LessonAuditEventResponse


class AuditRepository(Protocol):
    def ensure_schema(self) -> None: ...

    def save_event(
        self,
        event: LessonAuditEventResponse,
    ) -> LessonAuditEventResponse: ...

    def list_events_for_lesson(
        self,
        lesson_id: str,
    ) -> list[LessonAuditEventResponse]: ...
