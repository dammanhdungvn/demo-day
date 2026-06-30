from fastapi import HTTPException, status

from ..auth.schemas import UserProfile
from ..auth.services import require_role
from ..core.errors import _not_found
from ..core.security import _entity_organization_id, _user_organization_id
from ..core.time import _now_iso
from .ports import GenerationJobRepository
from .repositories import get_generation_job_repository
from .schemas import GenerationJobActionResponse, GenerationJobResponse


_CANCELLABLE_STATUSES = {"queued", "processing", "retrying"}
_RETRYABLE_SOURCE_JOB_STATUSES = {"failed"}
_NON_DURABLE_DOCUMENT_JOB_TYPES = {"document_upload"}


def _job_conflict(message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=message)


def _require_action_actor(current_user: UserProfile) -> UserProfile:
    return require_role(current_user, {"teacher", "admin"})


def _job_matches_actor(job: GenerationJobResponse, actor: UserProfile) -> bool:
    if _entity_organization_id(job.organization_id) != _user_organization_id(actor):
        return False
    if actor.role == "admin":
        return True
    return job.actor_id == actor.id


def _get_visible_job(
    job_id: str,
    actor: UserProfile,
    repository: GenerationJobRepository,
) -> GenerationJobResponse:
    job = repository.get_job(job_id)
    if not _job_matches_actor(job, actor):
        raise _not_found("Generation job not found")
    return job


def _document_job_has_durable_retry_input(job: GenerationJobResponse) -> bool:
    return bool(
        job.input.get("retry_supported")
        or job.input.get("raw_storage_path")
        or job.input.get("storage_path")
        or job.input.get("source_url")
    )


def list_generation_jobs(
    current_user: UserProfile,
    repository: GenerationJobRepository | None = None,
) -> list[GenerationJobResponse]:
    actor = require_role(current_user, {"teacher", "admin"})
    repository = repository or get_generation_job_repository()
    return repository.list_jobs_for_actor(actor)


def cancel_generation_job(
    job_id: str,
    current_user: UserProfile,
    repository: GenerationJobRepository | None = None,
) -> GenerationJobActionResponse:
    actor = _require_action_actor(current_user)
    repository = repository or get_generation_job_repository()
    job = _get_visible_job(job_id, actor, repository)
    if job.status not in _CANCELLABLE_STATUSES:
        raise _job_conflict(
            "Chi co the huy tac vu dang cho, dang chay hoac dang thu lai."
        )
    updated_output = {
        **job.output,
        "cancelled_by": actor.id,
        "cancelled_at": _now_iso(),
    }
    updated = repository.update_job(
        job.id,
        status="cancelled",
        output=updated_output,
        error_message="Da huy boi nguoi dung.",
    )
    return GenerationJobActionResponse(
        generation_job=updated,
        message="Da huy tac vu. Neu tac vu dang chay nen server se dung lai theo co che best-effort.",
    )


def retry_generation_job(
    job_id: str,
    current_user: UserProfile,
    repository: GenerationJobRepository | None = None,
) -> GenerationJobActionResponse:
    actor = _require_action_actor(current_user)
    repository = repository or get_generation_job_repository()
    job = _get_visible_job(job_id, actor, repository)
    if job.status not in _RETRYABLE_SOURCE_JOB_STATUSES:
        raise _job_conflict("Chi co the thu lai tac vu dang loi.")
    if (
        job.job_type in _NON_DURABLE_DOCUMENT_JOB_TYPES
        and not _document_job_has_durable_retry_input(job)
    ):
        raise _job_conflict(
            "Tac vu upload nay khong con du file goc ben ngoai de thu lai an toan. "
            "Hay upload lai file tu man hinh Tai lieu."
        )
    updated_output = {
        **job.output,
        "retry_requested_by": actor.id,
        "retry_requested_at": _now_iso(),
        "retry_source_status": job.status,
        "retry_source_error": job.error_message,
    }
    updated = repository.update_job(
        job.id,
        status="retrying",
        output=updated_output,
        error_message=None,
    )
    return GenerationJobActionResponse(
        generation_job=updated,
        message="Da dua tac vu vao hang cho thu lai.",
    )
