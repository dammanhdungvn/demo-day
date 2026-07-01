from pydantic import BaseModel, Field


class LessonProgressUpdateRequest(BaseModel):
    current_block_id: str | None = None
    current_slide_index: int = Field(default=0, ge=0)
    completed: bool = False


class LessonProgressRecord(BaseModel):
    lesson_id: str
    class_id: str
    student_id: str
    current_block_id: str | None = None
    current_slide_index: int = 0
    started_at: str
    last_opened_at: str
    completed_at: str | None = None


class LessonProgressResponse(BaseModel):
    lesson_id: str
    class_id: str
    student_id: str
    current_block_id: str | None = None
    current_slide_index: int
    progress_percent: int
    started_at: str | None = None
    last_opened_at: str | None = None
    completed_at: str | None = None


class TeacherLessonProgressSummary(BaseModel):
    lesson_id: str
    class_id: str
    title: str
    enrolled_student_count: int
    started_count: int
    completed_count: int
    average_progress_percent: int
