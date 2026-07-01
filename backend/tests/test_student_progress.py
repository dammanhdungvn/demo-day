from fastapi import HTTPException
from fastapi.routing import APIRoute
import pytest

from main import (
    AddStudentRequest,
    ClassCreateRequest,
    CourseCreateRequest,
    LessonBlockResponse,
    LessonProgressUpdateRequest,
    LessonSessionResponse,
    LoginRequest,
    RetrievedChunkRecord,
    UserProfile,
    add_student_to_class,
    app,
    authenticate_demo_user,
    create_class_profile,
    create_course,
    get_content_repository,
    get_student_lesson_progress,
    list_teacher_class_progress,
    reset_demo_sessions_for_tests,
    reset_learning_store_for_tests,
    reset_lesson_store_for_tests,
    reset_progress_store_for_tests,
    student_lesson_progress,
    teacher_class_progress,
    update_student_lesson_progress_route,
    update_student_lesson_progress,
)


@pytest.fixture(autouse=True)
def clear_state() -> None:
    reset_demo_sessions_for_tests()
    reset_learning_store_for_tests()
    reset_lesson_store_for_tests()
    reset_progress_store_for_tests()


def teacher_user() -> UserProfile:
    return authenticate_demo_user(
        LoginRequest(email="teacher@teachflow.local", password="teachflow-demo")
    ).user


def student_user() -> UserProfile:
    return authenticate_demo_user(
        LoginRequest(email="student@teachflow.local", password="teachflow-demo")
    ).user


def login_demo(email: str) -> tuple[str, UserProfile]:
    session = authenticate_demo_user(
        LoginRequest(email=email, password="teachflow-demo")
    )
    return session.access_token, session.user


def other_student_user() -> UserProfile:
    return UserProfile(
        id="demo-student-other",
        email="other-student@teachflow.local",
        name="Other Student",
        role="student",
        organization_id="org-demo",
    )


def create_class_with_student() -> tuple[UserProfile, UserProfile, str]:
    teacher = teacher_user()
    student = student_user()
    course = create_course(
        CourseCreateRequest(
            title="AI Agents",
            description="Demo course",
            learning_goals="Understand agents",
            teaching_language="Vietnamese",
        ),
        current_user=teacher,
    )
    class_profile = create_class_profile(
        course_id=course.id,
        payload=ClassCreateRequest(
            name="Demo-K18",
            student_level="average",
            background_knowledge="Basic programming",
            session_count=2,
            minutes_per_session=60,
            teaching_style="Workshop",
        ),
        current_user=teacher,
    )
    add_student_to_class(
        class_id=class_profile.id,
        payload=AddStudentRequest(student_id=student.id),
        current_user=teacher,
    )
    return teacher, student, class_profile.id


def save_lesson(
    *,
    class_id: str,
    teacher_id: str,
    status: str = "published",
) -> LessonSessionResponse:
    citation = RetrievedChunkRecord(
        chunk_id="chunk-1",
        document_id="doc-1",
        document_title="Demo Source",
        page_number=1,
        chunk_index=1,
        excerpt="Evidence",
        score=0.9,
    )
    lesson = LessonSessionResponse(
        id=f"lesson-{status}",
        outline_id="outline-1",
        outline_session_index=1,
        course_id="course-1",
        class_id=class_id,
        teacher_id=teacher_id,
        title=f"Lesson {status}",
        status=status,  # type: ignore[arg-type]
        admin_feedback=None,
        created_at="2026-06-28T00:00:00+00:00",
        updated_at="2026-06-28T00:00:00+00:00",
        blocks=[
            LessonBlockResponse(
                id="block-1",
                type="concept_explanation",
                title="Concept",
                content="Content",
                order_index=1,
                status="approved",
                citations=[citation],
                warning=None,
            ),
            LessonBlockResponse(
                id="block-2",
                type="quiz",
                title="Quiz",
                content="Question",
                order_index=2,
                status="approved",
                citations=[citation],
                warning=None,
            ),
        ],
    )
    return get_content_repository().save_lesson(lesson)


def test_student_updates_and_reads_progress_for_published_lesson() -> None:
    teacher, student, class_id = create_class_with_student()
    lesson = save_lesson(class_id=class_id, teacher_id=teacher.id)

    progress = update_student_lesson_progress(
        lesson.id,
        LessonProgressUpdateRequest(
            current_block_id="block-1",
            current_slide_index=0,
            completed=False,
        ),
        student,
    )

    assert progress.lesson_id == lesson.id
    assert progress.student_id == student.id
    assert progress.class_id == class_id
    assert progress.current_block_id == "block-1"
    assert progress.current_slide_index == 0
    assert progress.progress_percent == 50
    assert progress.completed_at is None

    completed = update_student_lesson_progress(
        lesson.id,
        LessonProgressUpdateRequest(
            current_block_id="block-2",
            current_slide_index=3,
            completed=True,
        ),
        student,
    )
    assert completed.progress_percent == 100
    assert completed.completed_at is not None
    assert get_student_lesson_progress(lesson.id, student).completed_at is not None


def test_student_progress_requires_published_membership() -> None:
    teacher, student, class_id = create_class_with_student()
    draft_lesson = save_lesson(
        class_id=class_id,
        teacher_id=teacher.id,
        status="teacher_reviewing",
    )

    with pytest.raises(HTTPException) as draft_exc:
        update_student_lesson_progress(
            draft_lesson.id,
            LessonProgressUpdateRequest(current_block_id="block-1"),
            student,
        )
    assert draft_exc.value.status_code == 404

    published_lesson = save_lesson(class_id=class_id, teacher_id=teacher.id)
    with pytest.raises(HTTPException) as member_exc:
        update_student_lesson_progress(
            published_lesson.id,
            LessonProgressUpdateRequest(current_block_id="block-1"),
            other_student_user(),
        )
    assert member_exc.value.status_code == 404


def test_teacher_reads_aggregate_progress_for_owned_class() -> None:
    teacher, student, class_id = create_class_with_student()
    lesson = save_lesson(class_id=class_id, teacher_id=teacher.id)
    update_student_lesson_progress(
        lesson.id,
        LessonProgressUpdateRequest(
            current_block_id="block-2",
            current_slide_index=2,
            completed=True,
        ),
        student,
    )

    summaries = list_teacher_class_progress(class_id, teacher)

    assert len(summaries) == 1
    assert summaries[0].lesson_id == lesson.id
    assert summaries[0].enrolled_student_count == 1
    assert summaries[0].started_count == 1
    assert summaries[0].completed_count == 1
    assert summaries[0].average_progress_percent == 100


def test_teacher_progress_aggregate_is_owned_class_only() -> None:
    teacher, _student, class_id = create_class_with_student()
    other_teacher = teacher.model_copy(update={"id": "demo-teacher-other"})

    with pytest.raises(HTTPException) as exc_info:
        list_teacher_class_progress(class_id, other_teacher)

    assert exc_info.value.status_code == 404


def test_progress_routes_track_student_and_teacher_aggregate() -> None:
    _teacher_token, teacher = login_demo("teacher@teachflow.local")
    _student_token, student = login_demo("student@teachflow.local")
    course = create_course(
        CourseCreateRequest(
            title="Route Course",
            description="Demo course",
            learning_goals="Route progress",
            teaching_language="Vietnamese",
        ),
        current_user=teacher,
    )
    class_profile = create_class_profile(
        course_id=course.id,
        payload=ClassCreateRequest(
            name="Route-K18",
            student_level="average",
            background_knowledge="Basic programming",
            session_count=2,
            minutes_per_session=60,
            teaching_style="Workshop",
        ),
        current_user=teacher,
    )
    add_student_to_class(
        class_id=class_profile.id,
        payload=AddStudentRequest(student_id=student.id),
        current_user=teacher,
    )
    lesson = save_lesson(class_id=class_profile.id, teacher_id=teacher.id)
    route_methods = {
        (route.path, frozenset(route.methods or set()))
        for route in app.routes
        if isinstance(route, APIRoute)
    }
    assert (
        f"/api/v1/student/lessons/{{lesson_id}}/progress",
        frozenset({"GET"}),
    ) in route_methods
    assert (
        f"/api/v1/student/lessons/{{lesson_id}}/progress",
        frozenset({"PUT"}),
    ) in route_methods
    assert (
        f"/api/v1/teacher/classes/{{class_id}}/progress",
        frozenset({"GET"}),
    ) in route_methods

    progress_response = update_student_lesson_progress_route(
        lesson.id,
        LessonProgressUpdateRequest(
            current_block_id="block-2",
            current_slide_index=2,
            completed=True,
        ),
        student,
    )
    assert progress_response.progress_percent == 100

    read_response = student_lesson_progress(lesson.id, student)
    assert read_response.completed_at is not None

    teacher_response = teacher_class_progress(class_profile.id, teacher)
    assert teacher_response[0].completed_count == 1
