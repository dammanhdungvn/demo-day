from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

StudentLevel = Literal["weak", "average", "strong"]


class CourseCreateRequest(BaseModel):
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    learning_goals: str = Field(min_length=1)
    teaching_language: str = Field(min_length=1)


class CourseResponse(CourseCreateRequest):
    id: str
    teacher_id: str
    organization_id: str | None = None
    created_at: str
    updated_at: str


class ClassCreateRequest(BaseModel):
    name: str = Field(min_length=1)
    student_level: StudentLevel
    background_knowledge: str
    session_count: int = Field(ge=1, le=100)
    minutes_per_session: int = Field(ge=1, le=300)
    teaching_style: str = Field(min_length=1)


class ClassProfileResponse(ClassCreateRequest):
    id: str
    course_id: str
    teacher_id: str
    organization_id: str | None = None
    created_at: str
    updated_at: str


class AddStudentRequest(BaseModel):
    student_id: str = Field(min_length=1)


class ClassStudentResponse(BaseModel):
    id: str
    class_id: str
    student_id: str
    added_by_teacher_id: str
    created_at: str


class StudentClassSummary(BaseModel):
    class_id: str
    class_name: str
    course_id: str
    course_title: str
    teacher_id: str
    organization_id: str | None = None
    student_level: StudentLevel
    session_count: int
    minutes_per_session: int
