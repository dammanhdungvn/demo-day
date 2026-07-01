from typing import Protocol

from .schemas import LessonProgressRecord


class ProgressRepository(Protocol):
    def ensure_schema(self) -> None: ...

    def get_progress(
        self,
        *,
        student_id: str,
        lesson_id: str,
    ) -> LessonProgressRecord | None: ...

    def upsert_progress(
        self,
        progress: LessonProgressRecord,
    ) -> LessonProgressRecord: ...

    def list_progress_for_lessons(
        self,
        lesson_ids: list[str],
    ) -> list[LessonProgressRecord]: ...
