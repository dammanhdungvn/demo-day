from ..auth.schemas import UserProfile
from ..auth.services import require_role
from .ports import GenerationJobRepository
from .repositories import get_generation_job_repository
from .schemas import GenerationJobResponse


def list_generation_jobs(
    current_user: UserProfile,
    repository: GenerationJobRepository | None = None,
) -> list[GenerationJobResponse]:
    actor = require_role(current_user, {"teacher", "admin"})
    repository = repository or get_generation_job_repository()
    return repository.list_jobs_for_actor(actor)
