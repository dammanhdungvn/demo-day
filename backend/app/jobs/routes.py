from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends

from ..auth.dependencies import require_roles
from ..auth.schemas import UserProfile
from ..core.config import API_BASE_PATH
from .schemas import GenerationJobActionResponse, GenerationJobResponse
from .services import cancel_generation_job, list_generation_jobs, retry_generation_job

router = APIRouter(prefix=API_BASE_PATH)


@router.get("/generation-jobs", response_model=list[GenerationJobResponse])
def generation_jobs_route(
    current_user: Annotated[
        UserProfile,
        Depends(require_roles("teacher", "admin")),
    ],
) -> list[GenerationJobResponse]:
    return list_generation_jobs(current_user)


@router.post(
    "/generation-jobs/{job_id}/retry",
    response_model=GenerationJobActionResponse,
)
def retry_generation_job_route(
    job_id: str,
    background_tasks: BackgroundTasks,
    current_user: Annotated[
        UserProfile,
        Depends(require_roles("teacher", "admin")),
    ],
) -> GenerationJobActionResponse:
    return retry_generation_job(
        job_id,
        current_user,
        background_tasks=background_tasks,
    )


@router.post(
    "/generation-jobs/{job_id}/cancel",
    response_model=GenerationJobActionResponse,
)
def cancel_generation_job_route(
    job_id: str,
    current_user: Annotated[
        UserProfile,
        Depends(require_roles("teacher", "admin")),
    ],
) -> GenerationJobActionResponse:
    return cancel_generation_job(job_id, current_user)
