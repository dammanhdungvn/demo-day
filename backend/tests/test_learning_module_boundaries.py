from typing import get_args

from fastapi.routing import APIRoute

from app.learning.ports import LearningRepository
from app.learning.repositories import (
    InMemoryLearningRepository,
    PostgresLearningRepository,
    get_learning_repository,
    learning_schema_sql,
)
from app.learning.services import (
    _class_ids_for_student,
    add_student_to_class,
    create_class_profile,
    create_course,
    list_available_students,
    list_course_classes,
    list_courses,
    list_student_classes,
)
from app.learning.routes import router as learning_router
from app.learning.schemas import (
    AddStudentRequest,
    ClassCreateRequest,
    ClassProfileResponse,
    ClassStudentResponse,
    CourseCreateRequest,
    CourseResponse,
    StudentClassSummary,
    StudentLevel,
)
from main import add_student_to_class as MainAddStudentToClass
from main import ClassCreateRequest as MainClassCreateRequest
from main import create_class_profile as MainCreateClassProfile
from main import create_course as MainCreateCourse
from main import CourseResponse as MainCourseResponse
from main import InMemoryLearningRepository as MainInMemoryLearningRepository
from main import LearningRepository as MainLearningRepository
from main import list_available_students as MainListAvailableStudents
from main import list_course_classes as MainListCourseClasses
from main import list_courses as MainListCourses
from main import list_student_classes as MainListStudentClasses
from main import PostgresLearningRepository as MainPostgresLearningRepository
from main import StudentLevel as MainStudentLevel
from main import UserProfile
from main import app
from main import get_learning_repository as main_get_learning_repository
from main import learning_schema_sql as main_learning_schema_sql


def test_learning_schema_module_exports_course_and_class_models() -> None:
    assert set(get_args(StudentLevel)) == {"weak", "average", "strong"}
    assert MainStudentLevel is StudentLevel

    course_payload = CourseCreateRequest(
        title="Intro AI",
        description="Foundations",
        learning_goals="Understand core AI ideas",
        teaching_language="Vietnamese",
    )
    course = CourseResponse(
        id="course-1",
        teacher_id="teacher-1",
        organization_id="org-demo",
        created_at="2026-06-29T00:00:00+00:00",
        updated_at="2026-06-29T00:00:00+00:00",
        **course_payload.model_dump(),
    )
    class_payload = ClassCreateRequest(
        name="KTPM-K18",
        student_level="average",
        background_knowledge="Python basics",
        session_count=4,
        minutes_per_session=90,
        teaching_style="Project-based",
    )
    class_profile = ClassProfileResponse(
        id="class-1",
        course_id=course.id,
        teacher_id=course.teacher_id,
        organization_id=course.organization_id,
        created_at=course.created_at,
        updated_at=course.updated_at,
        **class_payload.model_dump(),
    )

    assert course.title == "Intro AI"
    assert class_profile.student_level == "average"
    assert MainCourseResponse is CourseResponse
    assert MainClassCreateRequest is ClassCreateRequest


def test_learning_schema_module_exports_membership_models() -> None:
    add_student = AddStudentRequest(student_id="student-1")
    membership = ClassStudentResponse(
        id="membership-1",
        class_id="class-1",
        student_id=add_student.student_id,
        added_by_teacher_id="teacher-1",
        created_at="2026-06-29T00:00:00+00:00",
    )
    summary = StudentClassSummary(
        class_id="class-1",
        class_name="KTPM-K18",
        course_id="course-1",
        course_title="Intro AI",
        teacher_id="teacher-1",
        organization_id="org-demo",
        student_level="average",
        session_count=4,
        minutes_per_session=90,
    )

    assert membership.student_id == "student-1"
    assert summary.course_title == "Intro AI"


def test_learning_ports_module_keeps_main_compatibility_export() -> None:
    assert hasattr(LearningRepository, "create_course")
    assert hasattr(LearningRepository, "list_memberships_for_student")
    assert MainLearningRepository is LearningRepository


def test_learning_repositories_module_keeps_main_compatibility_export(monkeypatch) -> None:
    schema_sql = learning_schema_sql().lower()

    assert "create table if not exists courses" in schema_sql
    assert "create table if not exists classes" in schema_sql
    assert "create table if not exists class_students" in schema_sql
    assert "revoke all on table courses from anon, authenticated" in schema_sql
    assert MainInMemoryLearningRepository is InMemoryLearningRepository
    assert MainPostgresLearningRepository is PostgresLearningRepository
    assert main_learning_schema_sql is learning_schema_sql
    assert main_get_learning_repository is get_learning_repository

    monkeypatch.delenv("LEARNING_REPOSITORY", raising=False)
    assert isinstance(get_learning_repository(), InMemoryLearningRepository)

    monkeypatch.setenv("LEARNING_REPOSITORY", "postgres")
    monkeypatch.setenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")
    assert isinstance(get_learning_repository(ensure_schema=False), PostgresLearningRepository)


def test_learning_services_module_keeps_main_compatibility_export() -> None:
    teacher = UserProfile(
        id="demo-teacher",
        email="teacher@teachflow.local",
        name="Teacher",
        role="teacher",
        organization_id="org-demo",
    )
    student = UserProfile(
        id="demo-student",
        email="student@teachflow.local",
        name="Student",
        role="student",
        organization_id="org-demo",
    )
    repository = InMemoryLearningRepository()

    course = create_course(
        CourseCreateRequest(
            title="Intro AI",
            description="Foundations",
            learning_goals="Understand core AI ideas",
            teaching_language="Vietnamese",
        ),
        current_user=teacher,
        repository=repository,
    )
    class_profile = create_class_profile(
        course_id=course.id,
        payload=ClassCreateRequest(
            name="KTPM-K18",
            student_level="average",
            background_knowledge="Python basics",
            session_count=4,
            minutes_per_session=90,
            teaching_style="Project-based",
        ),
        current_user=teacher,
        repository=repository,
    )
    membership = add_student_to_class(
        class_id=class_profile.id,
        payload=AddStudentRequest(student_id=student.id),
        current_user=teacher,
        repository=repository,
    )
    summaries = list_student_classes(current_user=student, repository=repository)

    assert list_courses(current_user=teacher, repository=repository) == [course]
    assert list_course_classes(
        course_id=course.id,
        current_user=teacher,
        repository=repository,
    ) == [class_profile]
    assert [candidate.id for candidate in list_available_students(teacher)] == [student.id]
    assert membership.student_id == student.id
    assert summaries[0].class_id == class_profile.id
    assert _class_ids_for_student(student, repository) == {class_profile.id}
    assert MainCreateCourse is create_course
    assert MainCreateClassProfile is create_class_profile
    assert MainAddStudentToClass is add_student_to_class
    assert MainListCourses is list_courses
    assert MainListCourseClasses is list_course_classes
    assert MainListAvailableStudents is list_available_students
    assert MainListStudentClasses is list_student_classes


def test_learning_routes_module_registers_paths_and_is_included_on_main_app() -> None:
    path_methods = {
        (route.path, frozenset(route.methods or set()))
        for route in learning_router.routes
        if hasattr(route, "methods")
    }

    assert ("/api/v1/students", frozenset({"GET"})) in path_methods
    assert ("/api/v1/courses", frozenset({"GET"})) in path_methods
    assert ("/api/v1/courses", frozenset({"POST"})) in path_methods
    assert (
        "/api/v1/courses/{course_id}/classes",
        frozenset({"GET"}),
    ) in path_methods
    assert (
        "/api/v1/courses/{course_id}/classes",
        frozenset({"POST"}),
    ) in path_methods
    assert (
        "/api/v1/classes/{class_id}/students",
        frozenset({"POST"}),
    ) in path_methods
    assert ("/api/v1/student/classes", frozenset({"GET"})) in path_methods

    assert any(
        getattr(route, "original_router", None) is learning_router
        for route in app.routes
    )
