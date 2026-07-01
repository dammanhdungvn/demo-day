from typing import Protocol

from .schemas import LessonPracticeAttemptRecord, LessonStudyStateRecord


class StudyRepository(Protocol):
    def ensure_schema(self) -> None: ...

    def get_state(
        self,
        *,
        student_id: str,
        lesson_id: str,
    ) -> LessonStudyStateRecord | None: ...

    def upsert_state(
        self,
        state: LessonStudyStateRecord,
    ) -> LessonStudyStateRecord: ...

    def list_states_for_student(
        self,
        student_id: str,
    ) -> list[LessonStudyStateRecord]: ...

    def get_practice_attempt(
        self,
        *,
        student_id: str,
        lesson_id: str,
        block_id: str,
    ) -> LessonPracticeAttemptRecord | None: ...

    def upsert_practice_attempt(
        self,
        attempt: LessonPracticeAttemptRecord,
    ) -> LessonPracticeAttemptRecord: ...

    def list_practice_attempts_for_student(
        self,
        student_id: str,
    ) -> list[LessonPracticeAttemptRecord]: ...
