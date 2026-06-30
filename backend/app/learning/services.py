from __future__ import annotations

from ..auth.demo import DEMO_ACCOUNTS
from ..auth.ports import AuthRepository
from ..auth.schemas import AuthProfileRecord, UserProfile
from ..auth.services import get_auth_repository, require_role
from ..core.errors import _not_found
from ..core.security import (
    _entity_organization_id,
    _same_organization,
    _user_organization_id,
)
from .ports import LearningRepository
from .repositories import get_learning_repository
from .schemas import (
    AddStudentRequest,
    ClassCreateRequest,
    ClassProfileResponse,
    ClassStudentResponse,
    CourseCreateRequest,
    CourseResponse,
    StudentClassSummary,
)


def _profile_record_to_user(profile: AuthProfileRecord) -> UserProfile:
    return UserProfile(
        id=profile.id,
        email=profile.email,
        name=profile.name,
        role=profile.role,
        organization_id=profile.organization_id,
    )


def _student_profiles(
    *,
    auth_repository: AuthRepository | None = None,
    organization_id: str | None = None,
) -> list[UserProfile]:
    students: list[UserProfile] = []
    seen_ids: set[str] = set()
    normalized_org = (
        _entity_organization_id(organization_id)
        if organization_id is not None
        else None
    )

    def add_student(student: UserProfile) -> None:
        if student.role != "student" or student.id in seen_ids:
            return
        if (
            normalized_org is not None
            and _entity_organization_id(student.organization_id) != normalized_org
        ):
            return
        seen_ids.add(student.id)
        students.append(student)

    for account in DEMO_ACCOUNTS:
        if account.public.role == "student":
            add_student(UserProfile(**account.public.model_dump(exclude={"label"})))

    repository = auth_repository or get_auth_repository()
    for profile in repository.list_profiles(
        organization_id=normalized_org,
        role="student",
        status="active",
    ):
        add_student(_profile_record_to_user(profile))

    return students


def _ensure_owned_course(
    course_id: str,
    teacher: UserProfile,
    repository: LearningRepository | None = None,
) -> CourseResponse:
    learning_repository = repository or get_learning_repository()
    course = learning_repository.get_course(course_id)
    if (
        course is None
        or course.teacher_id != teacher.id
        or not _same_organization(course.organization_id, teacher)
    ):
        raise _not_found("Course not found")

    return course


def _ensure_owned_class(
    class_id: str,
    teacher: UserProfile,
    repository: LearningRepository | None = None,
) -> ClassProfileResponse:
    learning_repository = repository or get_learning_repository()
    class_profile = learning_repository.get_class(class_id)
    if (
        class_profile is None
        or class_profile.teacher_id != teacher.id
        or not _same_organization(class_profile.organization_id, teacher)
    ):
        raise _not_found("Class not found")

    return class_profile


def list_courses(
    current_user: UserProfile,
    repository: LearningRepository | None = None,
) -> list[CourseResponse]:
    teacher = require_role(current_user, {"teacher"})
    learning_repository = repository or get_learning_repository()
    return learning_repository.list_courses_for_teacher(
        teacher.id,
        _user_organization_id(teacher),
    )


def create_course(
    payload: CourseCreateRequest,
    current_user: UserProfile,
    repository: LearningRepository | None = None,
) -> CourseResponse:
    teacher = require_role(current_user, {"teacher"})
    learning_repository = repository or get_learning_repository()
    return learning_repository.create_course(
        payload=payload,
        teacher_id=teacher.id,
        organization_id=_user_organization_id(teacher),
    )


def list_course_classes(
    course_id: str,
    current_user: UserProfile,
    repository: LearningRepository | None = None,
) -> list[ClassProfileResponse]:
    teacher = require_role(current_user, {"teacher"})
    learning_repository = repository or get_learning_repository()
    _ensure_owned_course(course_id, teacher, learning_repository)
    return learning_repository.list_classes_for_course(
        course_id=course_id,
        teacher_id=teacher.id,
        organization_id=_user_organization_id(teacher),
    )


def create_class_profile(
    course_id: str,
    payload: ClassCreateRequest,
    current_user: UserProfile,
    repository: LearningRepository | None = None,
) -> ClassProfileResponse:
    teacher = require_role(current_user, {"teacher"})
    learning_repository = repository or get_learning_repository()
    _ensure_owned_course(course_id, teacher, learning_repository)
    return learning_repository.create_class_profile(
        course_id=course_id,
        teacher_id=teacher.id,
        organization_id=_user_organization_id(teacher),
        payload=payload,
    )


def list_available_students(
    current_user: UserProfile,
    auth_repository: AuthRepository | None = None,
) -> list[UserProfile]:
    teacher = require_role(current_user, {"teacher"})
    return [
        student
        for student in _student_profiles(
            auth_repository=auth_repository,
            organization_id=_user_organization_id(teacher),
        )
        if _same_organization(student.organization_id, teacher)
    ]


def add_student_to_class(
    class_id: str,
    payload: AddStudentRequest,
    current_user: UserProfile,
    repository: LearningRepository | None = None,
    auth_repository: AuthRepository | None = None,
) -> ClassStudentResponse:
    teacher = require_role(current_user, {"teacher"})
    learning_repository = repository or get_learning_repository()
    _ensure_owned_class(class_id, teacher, learning_repository)
    student_ids = {
        student.id
        for student in _student_profiles(
            auth_repository=auth_repository,
            organization_id=_user_organization_id(teacher),
        )
    }
    if payload.student_id not in student_ids:
        raise _not_found("Student not found")

    existing = learning_repository.get_class_student(
        class_id=class_id,
        student_id=payload.student_id,
    )
    if existing is not None:
        return existing

    return learning_repository.add_student_to_class(
        class_id=class_id,
        student_id=payload.student_id,
        added_by_teacher_id=teacher.id,
    )


def list_student_classes(
    current_user: UserProfile,
    repository: LearningRepository | None = None,
) -> list[StudentClassSummary]:
    student = require_role(current_user, {"student"})
    learning_repository = repository or get_learning_repository()
    summaries: list[StudentClassSummary] = []

    for membership in learning_repository.list_memberships_for_student(
        student.id,
        _user_organization_id(student),
    ):
        class_profile = learning_repository.get_class(membership.class_id)
        if class_profile is None or not _same_organization(
            class_profile.organization_id,
            student,
        ):
            continue

        course = learning_repository.get_course(class_profile.course_id)
        if course is None or not _same_organization(course.organization_id, student):
            continue

        summaries.append(
            StudentClassSummary(
                class_id=class_profile.id,
                class_name=class_profile.name,
                course_id=course.id,
                course_title=course.title,
                teacher_id=course.teacher_id,
                organization_id=_entity_organization_id(course.organization_id),
                student_level=class_profile.student_level,
                session_count=class_profile.session_count,
                minutes_per_session=class_profile.minutes_per_session,
            )
        )

    return summaries


def _class_ids_for_student(
    student: UserProfile,
    repository: LearningRepository | None = None,
) -> set[str]:
    learning_repository = repository or get_learning_repository()
    return {
        membership.class_id
        for membership in learning_repository.list_memberships_for_student(
            student.id,
            _user_organization_id(student),
        )
    }
