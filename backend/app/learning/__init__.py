from __future__ import annotations

from .ports import LearningRepository
from .repositories import (
    InMemoryLearningRepository,
    MEMORY_LEARNING_REPOSITORY,
    PostgresLearningRepository,
    get_learning_repository,
    learning_schema_sql,
)
from .routes import router
from .services import (
    _class_ids_for_student,
    _ensure_owned_class,
    _ensure_owned_course,
    _student_profiles,
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
from .schemas import (
    AddStudentRequest,
    ClassCreateRequest,
    ClassProfileResponse,
    ClassStudentResponse,
    ClassUpdateRequest,
    CourseCreateRequest,
    CourseResponse,
    StudentClassSummary,
    StudentLevel,
)

__all__ = [
    "AddStudentRequest",
    "ClassCreateRequest",
    "ClassProfileResponse",
    "ClassStudentResponse",
    "ClassUpdateRequest",
    "CourseCreateRequest",
    "CourseResponse",
    "InMemoryLearningRepository",
    "LearningRepository",
    "MEMORY_LEARNING_REPOSITORY",
    "PostgresLearningRepository",
    "router",
    "StudentClassSummary",
    "StudentLevel",
    "_class_ids_for_student",
    "_ensure_owned_class",
    "_ensure_owned_course",
    "_student_profiles",
    "add_student_to_class",
    "archive_class_profile",
    "create_class_profile",
    "create_course",
    "get_learning_repository",
    "learning_schema_sql",
    "list_available_students",
    "list_course_classes",
    "list_courses",
    "list_student_classes",
    "update_class_profile",
]
