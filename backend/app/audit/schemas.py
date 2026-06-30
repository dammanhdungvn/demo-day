from pydantic import BaseModel

from ..auth.schemas import Role


class LessonAuditEventResponse(BaseModel):
    id: str
    lesson_id: str
    block_id: str | None = None
    actor_id: str
    actor_role: Role
    action: str
    details: str | None = None
    created_at: str
