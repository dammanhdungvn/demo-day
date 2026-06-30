from typing import Any, Literal

from pydantic import BaseModel

from ..auth.schemas import Role


GenerationJobStatus = Literal[
    "queued",
    "processing",
    "completed",
    "failed",
    "cancelled",
    "retrying",
    "skipped",
]


class GenerationJobResponse(BaseModel):
    id: str
    job_type: str
    status: GenerationJobStatus
    organization_id: str | None = None
    actor_id: str | None = None
    actor_role: Role | None = None
    input: dict[str, Any]
    retrieved_context: list[dict[str, Any]]
    output: dict[str, Any]
    error_message: str | None = None
    created_at: str
    updated_at: str
