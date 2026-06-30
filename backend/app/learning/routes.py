from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from ..auth.dependencies import require_roles
from ..auth.schemas import UserProfile
from ..core.config import API_BASE_PATH
from .schemas import (
    AddStudentRequest,
    ClassCreateRequest,
    ClassProfileResponse,
    ClassStudentResponse,
    ClassUpdateRequest,
    CourseCreateRequest,
    CourseResponse,
    StudentClassSummary,
)
from .services import (
    add_student_to_class,
    archive_class_profile,
    create_class_profile,
    create_course,
    list_available_students,
    list_course_classes,
    list_courses,
    list_student_classes,
    update_class_profile,
)

router = APIRouter(prefix=API_BASE_PATH)


@router.get("/students", response_model=list[UserProfile])
def students(
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> list[UserProfile]:
    return list_available_students(current_user)


@router.get("/courses", response_model=list[CourseResponse])
def courses(
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> list[CourseResponse]:
    return list_courses(current_user)


@router.post("/courses", response_model=CourseResponse)
def create_course_route(
    payload: CourseCreateRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> CourseResponse:
    return create_course(payload, current_user)


@router.get(
    "/courses/{course_id}/classes",
    response_model=list[ClassProfileResponse],
)
def course_classes(
    course_id: str,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> list[ClassProfileResponse]:
    return list_course_classes(course_id, current_user)


@router.post(
    "/courses/{course_id}/classes",
    response_model=ClassProfileResponse,
)
def create_class_profile_route(
    course_id: str,
    payload: ClassCreateRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> ClassProfileResponse:
    return create_class_profile(course_id, payload, current_user)


@router.patch(
    "/classes/{class_id}",
    response_model=ClassProfileResponse,
)
def update_class_profile_route(
    class_id: str,
    payload: ClassUpdateRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> ClassProfileResponse:
    return update_class_profile(class_id, payload, current_user)


@router.delete(
    "/classes/{class_id}",
    response_model=ClassProfileResponse,
)
def archive_class_profile_route(
    class_id: str,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> ClassProfileResponse:
    return archive_class_profile(class_id, current_user)


@router.post(
    "/classes/{class_id}/students",
    response_model=ClassStudentResponse,
)
def class_students(
    class_id: str,
    payload: AddStudentRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> ClassStudentResponse:
    return add_student_to_class(class_id, payload, current_user)


@router.get(
    "/student/classes",
    response_model=list[StudentClassSummary],
)
def student_classes(
    current_user: Annotated[UserProfile, Depends(require_roles("student"))],
) -> list[StudentClassSummary]:
    return list_student_classes(current_user)
