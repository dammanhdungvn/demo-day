from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from ..knowledge.schemas import RetrievedChunkRecord

PracticeSelfCheckStatus = Literal["not_started", "needs_review", "got_it"]


class LessonStudyStateUpdateRequest(BaseModel):
    bookmarked_block_ids: list[str] = Field(default_factory=list)
    notes_by_block_id: dict[str, str] = Field(default_factory=dict)


class LessonStudyStateRecord(BaseModel):
    lesson_id: str
    class_id: str
    student_id: str
    bookmarked_block_ids: list[str] = Field(default_factory=list)
    notes_by_block_id: dict[str, str] = Field(default_factory=dict)
    updated_at: str


class LessonStudyStateResponse(BaseModel):
    lesson_id: str
    class_id: str
    student_id: str
    bookmarked_block_ids: list[str] = Field(default_factory=list)
    notes_by_block_id: dict[str, str] = Field(default_factory=dict)
    updated_at: str | None = None


class LessonStudyReviewItem(BaseModel):
    lesson_id: str
    lesson_title: str
    class_id: str
    block_id: str
    block_title: str
    block_type: str
    note: str | None = None
    bookmarked: bool
    citation_count: int = Field(ge=0)
    updated_at: str


class LessonPracticeItem(BaseModel):
    lesson_id: str
    lesson_title: str
    class_id: str
    block_id: str
    block_title: str
    block_type: str
    prompt: str
    citation_count: int = Field(ge=0)
    updated_at: str
    self_check_status: PracticeSelfCheckStatus = "not_started"
    attempt_count: int = Field(default=0, ge=0)
    attempt_updated_at: str | None = None


class LessonPracticeAttemptUpdateRequest(BaseModel):
    answer_text: str = ""
    self_check_status: PracticeSelfCheckStatus


class LessonPracticeAttemptRecord(BaseModel):
    lesson_id: str
    class_id: str
    student_id: str
    block_id: str
    answer_text: str = ""
    self_check_status: PracticeSelfCheckStatus = "not_started"
    attempt_count: int = Field(default=0, ge=0)
    updated_at: str


class LessonPracticeAttemptResponse(BaseModel):
    lesson_id: str
    class_id: str
    student_id: str
    block_id: str
    answer_text: str = ""
    self_check_status: PracticeSelfCheckStatus = "not_started"
    attempt_count: int = Field(default=0, ge=0)
    updated_at: str | None = None


class LessonTutorQuestionRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
    block_id: str | None = Field(default=None, min_length=1, max_length=200)


class LessonTutorResponse(BaseModel):
    lesson_id: str
    class_id: str
    student_id: str
    question: str
    answer: str
    citations: list[RetrievedChunkRecord] = Field(default_factory=list)
    cited_block_ids: list[str] = Field(default_factory=list)
    warning: str | None = None
