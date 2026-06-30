from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from ..auth.dependencies import require_roles
from ..auth.schemas import UserProfile
from ..core.config import API_BASE_PATH
from .schemas import GenerationJobResponse
from .services import list_generation_jobs

router = APIRouter(prefix=API_BASE_PATH)


@router.get("/generation-jobs", response_model=list[GenerationJobResponse])
def generation_jobs_route(
    current_user: Annotated[
        UserProfile,
        Depends(require_roles("teacher", "admin")),
    ],
) -> list[GenerationJobResponse]:
    return list_generation_jobs(current_user)
