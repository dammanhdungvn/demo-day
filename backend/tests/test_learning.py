from fastapi import HTTPException
from pydantic import ValidationError
import pytest

from main import (
    AddStudentRequest,
    AuthProfileRecord,
    ClassCreateRequest,
    ClassUpdateRequest,
    CourseCreateRequest,
    InMemoryAuthRepository,
    LoginRequest,
    UserProfile,
    add_student_to_class,
    archive_class_profile,
    authenticate_demo_user,
    create_class_profile,
    create_course,
    list_available_students,
    list_course_classes,
    list_courses,
    list_student_classes,
    reset_demo_sessions_for_tests,
    reset_learning_store_for_tests,
    update_class_profile,
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
        title="Introduction to Artificial Intelligence",
        description="Nhap mon tri tue nhan tao cho demo MVP.",
        learning_goals="Hieu khai niem AI co ban va ung dung.",
        teaching_language="Vietnamese",
    )


def class_payload() -> ClassCreateRequest:
    return ClassCreateRequest(
        name="KTPM-K18",
        student_level="average",
        background_knowledge="Sinh vien da hoc lap trinh co ban.",
        session_count=12,
        minutes_per_session=90,
        teaching_style="Giai thich truc quan, nhieu vi du.",
    )


def test_teacher_creates_and_lists_only_owned_courses() -> None:
    teacher = teacher_user()
    other_teacher = UserProfile(
        id="demo-teacher-other",
        email="other-teacher@teachflow.local",
        name="Other Teacher",
        role="teacher",
    )

    course = create_course(course_payload(), current_user=teacher)

    assert course.teacher_id == teacher.id
    assert list_courses(current_user=teacher) == [course]
    assert list_courses(current_user=other_teacher) == []


def test_student_cannot_use_teacher_course_endpoint() -> None:
    with pytest.raises(HTTPException) as exc_info:
        list_courses(current_user=student_user())

    assert exc_info.value.status_code == 403


def test_teacher_creates_class_profile_for_owned_course() -> None:
    teacher = teacher_user()
    course = create_course(course_payload(), current_user=teacher)

    class_profile = create_class_profile(
        course_id=course.id,
        payload=class_payload(),
        current_user=teacher,
    )

    assert class_profile.course_id == course.id
    assert class_profile.teacher_id == teacher.id
    assert class_profile.student_level == "average"
    assert class_profile.session_count == 12


def test_teacher_updates_owned_class_profile() -> None:
    teacher = teacher_user()
    course = create_course(course_payload(), current_user=teacher)
    class_profile = create_class_profile(
        course_id=course.id,
        payload=class_payload(),
        current_user=teacher,
    )

    updated = update_class_profile(
        class_id=class_profile.id,
        payload=ClassUpdateRequest(
            name="KTPM-K18 Advanced",
            student_level="strong",
            background_knowledge="Sinh vien da hoc OOP va database.",
            session_count=10,
            minutes_per_session=75,
            teaching_style="Workshop thuc hanh theo nhom.",
        ),
        current_user=teacher,
    )

    assert updated.id == class_profile.id
    assert updated.name == "KTPM-K18 Advanced"
    assert updated.student_level == "strong"
    assert updated.session_count == 10
    assert updated.updated_at != class_profile.updated_at


def test_teacher_archives_class_and_hides_it_from_teacher_and_student_lists() -> None:
    teacher = teacher_user()
    student = student_user()
    course = create_course(course_payload(), current_user=teacher)
    class_profile = create_class_profile(
        course_id=course.id,
        payload=class_payload(),
        current_user=teacher,
    )
    add_student_to_class(
        class_id=class_profile.id,
        payload=AddStudentRequest(student_id=student.id),
        current_user=teacher,
    )

    archived = archive_class_profile(class_profile.id, current_user=teacher)

    assert archived.id == class_profile.id
    assert archived.is_active is False
    assert list_course_classes(course.id, current_user=teacher) == []
    assert list_student_classes(current_user=student) == []


def test_course_and_class_access_are_scoped_to_user_organization() -> None:
    teacher = teacher_user()
    other_org_teacher = teacher.model_copy(update={"organization_id": "org-other"})
    course = create_course(course_payload(), current_user=teacher)
    class_profile = create_class_profile(
        course_id=course.id,
        payload=class_payload(),
        current_user=teacher,
    )

    assert course.organization_id == teacher.organization_id
    assert class_profile.organization_id == teacher.organization_id
    assert list_courses(current_user=other_org_teacher) == []

    with pytest.raises(HTTPException) as exc_info:
        list_course_classes(
            course_id=course.id,
            current_user=other_org_teacher,
        )

    assert exc_info.value.status_code == 404


def test_invalid_student_level_is_rejected_by_schema() -> None:
    with pytest.raises(ValidationError):
        ClassCreateRequest(
            name="KTPM-K18",
            student_level="advanced",
            background_knowledge="",
            session_count=12,
            minutes_per_session=90,
            teaching_style="",
        )


def test_teacher_cannot_create_class_for_other_teacher_course() -> None:
    teacher = teacher_user()
    other_teacher = UserProfile(
        id="demo-teacher-other",
        email="other-teacher@teachflow.local",
        name="Other Teacher",
        role="teacher",
    )
    course = create_course(course_payload(), current_user=teacher)

    with pytest.raises(HTTPException) as exc_info:
        create_class_profile(
            course_id=course.id,
            payload=class_payload(),
            current_user=other_teacher,
        )

    assert exc_info.value.status_code == 404


def test_membership_controls_student_visible_classes() -> None:
    teacher = teacher_user()
    student = student_user()
    other_student = UserProfile(
        id="demo-student-other",
        email="other-student@teachflow.local",
        name="Other Student",
        role="student",
    )
    course = create_course(course_payload(), current_user=teacher)
    class_profile = create_class_profile(
        course_id=course.id,
        payload=class_payload(),
        current_user=teacher,
    )

    students = list_available_students(current_user=teacher)
    assert [candidate.id for candidate in students] == [student.id]

    membership = add_student_to_class(
        class_id=class_profile.id,
        payload=AddStudentRequest(student_id=student.id),
        current_user=teacher,
    )

    assert membership.student_id == student.id
    assert len(list_student_classes(current_user=student)) == 1
    assert list_student_classes(current_user=student)[0].class_id == class_profile.id
    assert list_student_classes(current_user=other_student) == []


def test_teacher_can_enroll_invited_active_student_profile() -> None:
    teacher = teacher_user()
    invited_student = AuthProfileRecord(
        id="auth-student-accepted",
        email="accepted-student@example.edu",
        name="Accepted Student",
        role="student",
        organization_id=teacher.organization_id or "org-demo",
        auth_provider="supabase",
        status="active",
    )
    auth_repository = InMemoryAuthRepository()
    auth_repository.upsert_profile(invited_student)
    course = create_course(course_payload(), current_user=teacher)
    class_profile = create_class_profile(
        course_id=course.id,
        payload=class_payload(),
        current_user=teacher,
    )

    students = list_available_students(
        current_user=teacher,
        auth_repository=auth_repository,
    )

    assert "auth-student-accepted" in {student.id for student in students}

    membership = add_student_to_class(
        class_id=class_profile.id,
        payload=AddStudentRequest(student_id=invited_student.id),
        current_user=teacher,
        auth_repository=auth_repository,
    )

    assert membership.student_id == invited_student.id
    assert len(
        list_student_classes(
            current_user=UserProfile(
                id=invited_student.id,
                email=invited_student.email,
                name=invited_student.name,
                role="student",
                organization_id=invited_student.organization_id,
            )
        )
    ) == 1


def test_student_membership_is_scoped_to_user_organization() -> None:
    teacher = teacher_user()
    student = student_user()
    same_student_other_org = student.model_copy(update={"organization_id": "org-other"})
    course = create_course(course_payload(), current_user=teacher)
    class_profile = create_class_profile(
        course_id=course.id,
        payload=class_payload(),
        current_user=teacher,
    )
    add_student_to_class(
        class_id=class_profile.id,
        payload=AddStudentRequest(student_id=student.id),
        current_user=teacher,
    )

    assert len(list_student_classes(current_user=student)) == 1
    assert list_student_classes(current_user=same_student_other_org) == []
