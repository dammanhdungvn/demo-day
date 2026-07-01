from typing import Any, Protocol

from ..auth.schemas import UserProfile
from .schemas import GenerationJobResponse, GenerationJobStatus


class GenerationJobRepository(Protocol):
    def ensure_schema(self) -> None: ...

    def create_job(
        self,
        *,
        job_type: str,
        actor: UserProfile,
        job_input: dict[str, Any],
        retrieved_context: list[dict[str, Any]] | None = None,
        status: GenerationJobStatus = "processing",
    ) -> GenerationJobResponse: ...

    def update_job(
        self,
        job_id: str,
        *,
        status: GenerationJobStatus,
        output: dict[str, Any] | None = None,
        error_message: str | None = None,
    ) -> GenerationJobResponse: ...

    def get_job(self, job_id: str) -> GenerationJobResponse: ...

    def list_jobs_for_actor(
        self,
        actor: UserProfile,
        *,
        limit: int = 20,
    ) -> list[GenerationJobResponse]: ...
