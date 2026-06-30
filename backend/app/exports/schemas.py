from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

LessonExportFormat = Literal["markdown", "pptx", "pdf"]
LessonExportDelivery = Literal["download", "print"]


class LessonExportRequest(BaseModel):
    export_format: LessonExportFormat
    delivery: LessonExportDelivery
    file_name: str | None = Field(default=None, max_length=255)
    client_metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("file_name")
    @classmethod
    def file_name_must_not_be_blank(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class LessonExportRecord(BaseModel):
    id: str
    lesson_id: str
    course_id: str
    class_id: str
    teacher_id: str
    organization_id: str
    actor_id: str
    actor_role: Literal["admin", "teacher", "student"]
    export_format: LessonExportFormat
    delivery: LessonExportDelivery
    file_name: str | None = None
    block_count: int = Field(ge=0)
    citation_count: int = Field(ge=0)
    client_metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: str
