from typing import Protocol

from .schemas import LessonExportRecord


class LessonExportRepository(Protocol):
    def ensure_schema(self) -> None: ...

    def save_export(self, record: LessonExportRecord) -> LessonExportRecord: ...

    def list_exports_for_lesson(self, lesson_id: str) -> list[LessonExportRecord]: ...
