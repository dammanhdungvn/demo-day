import os

import pytest

from main import (
    AddStudentRequest,
    ClassCreateRequest,
    CourseCreateRequest,
    InMemoryLearningRepository,
    LoginRequest,
    PostgresLearningRepository,
    UserProfile,
    add_student_to_class,
    authenticate_demo_user,
    create_class_profile,
    create_course,
    get_learning_repository,
    learning_schema_sql,
    list_course_classes,
    list_courses,
    list_student_classes,
    reset_demo_sessions_for_tests,
    reset_learning_store_for_tests,
)


@pytest.fixture(autouse=True)
def clear_state() -> None:
    reset_demo_sessions_for_tests()
    reset_learning_store_for_tests()


def teacher_user() -> UserProfile:
    return authenticate_demo_user(
        LoginRequest(email="teacher@teachflow.local", password="teachflow-demo")
    ).user


def student_user() -> UserProfile:
    return authenticate_demo_user(
        LoginRequest(email="student@teachflow.local", password="teachflow-demo")
    ).user


def course_payload() -> CourseCreateRequest:
    return CourseCreateRequest(
        title="Production AI Course",
        description="Course dung de validate persistence V2.",
        learning_goals="Kiem tra course khong mat sau restart.",
        teaching_language="Vietnamese",
    )


def class_payload() -> ClassCreateRequest:
    return ClassCreateRequest(
        name="KTPM-K18 V2",
        student_level="average",
        background_knowledge="Da hoan thanh V1 demo flow.",
        session_count=12,
        minutes_per_session=90,
        teaching_style="Giai thich ngan gon, co citation.",
    )


def test_memory_learning_repository_contract_survives_service_calls() -> None:
    repository = InMemoryLearningRepository()
    teacher = teacher_user()
    student = student_user()

    course = create_course(
        course_payload(),
        current_user=teacher,
        repository=repository,
    )
    class_profile = create_class_profile(
        course_id=course.id,
        payload=class_payload(),
        current_user=teacher,
        repository=repository,
    )
    membership = add_student_to_class(
        class_id=class_profile.id,
        payload=AddStudentRequest(student_id=student.id),
        current_user=teacher,
        repository=repository,
    )

    assert list_courses(current_user=teacher, repository=repository) == [course]
    assert list_course_classes(
        course_id=course.id,
        current_user=teacher,
        repository=repository,
    ) == [class_profile]
    assert membership.student_id == student.id
    assert list_student_classes(current_user=student, repository=repository)[0].class_id == class_profile.id


def test_learning_repository_selection_uses_memory_by_default(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("LEARNING_REPOSITORY", raising=False)

    assert isinstance(get_learning_repository(), InMemoryLearningRepository)


def test_learning_repository_selection_supports_postgres(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LEARNING_REPOSITORY", "postgres")
    monkeypatch.setenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")

    repository = get_learning_repository(ensure_schema=False)

    assert isinstance(repository, PostgresLearningRepository)


def test_learning_schema_sql_contains_required_tables() -> None:
    schema_sql = learning_schema_sql()

    assert "create table if not exists courses" in schema_sql.lower()
    assert "create table if not exists classes" in schema_sql.lower()
    assert "create table if not exists class_students" in schema_sql.lower()
    assert "unique (class_id, student_id)" in schema_sql.lower()
    assert "alter table courses enable row level security" in schema_sql.lower()
    assert "revoke all on table courses from anon, authenticated" in schema_sql.lower()


def test_teacher_cannot_use_repository_to_access_other_teacher_course() -> None:
    repository = InMemoryLearningRepository()
    teacher = teacher_user()
    other_teacher = UserProfile(
        id="demo-teacher-other",
        email="other-teacher@teachflow.local",
        name="Other Teacher",
        role="teacher",
    )
    course = create_course(course_payload(), current_user=teacher, repository=repository)

    with pytest.raises(Exception) as exc_info:
        create_class_profile(
            course_id=course.id,
            payload=class_payload(),
            current_user=other_teacher,
            repository=repository,
        )

    assert getattr(exc_info.value, "status_code", None) == 404
