from fastapi import HTTPException
import pytest

from main import (
    AdminSettingsUpdateRequest,
    AuthProfileRecord,
    ClassCreateRequest,
    CourseCreateRequest,
    DocumentRecord,
    InMemoryAuthRepository,
    InMemoryGenerationJobRepository,
    LessonBlockResponse,
    LessonSessionResponse,
    UserProfile,
    build_admin_activity_feed,
    build_admin_reports,
    create_class_profile,
    create_course,
    get_admin_settings,
    get_content_repository,
    reset_admin_settings_store_for_tests,
    list_admin_lesson_library,
    reset_generation_job_store_for_tests,
    reset_learning_store_for_tests,
    reset_lesson_store_for_tests,
    update_admin_settings,
)


def admin_user(
    *,
    user_id: str = "admin-test",
    organization_id: str = "org-demo",
) -> UserProfile:
    return UserProfile(
        id=user_id,
        email=f"{user_id}@teachflow.local",
        name="Admin Test",
        role="admin",
        organization_id=organization_id,
    )


def teacher_user(
    *,
    user_id: str = "teacher-test",
    organization_id: str = "org-demo",
) -> UserProfile:
    return UserProfile(
        id=user_id,
        email=f"{user_id}@teachflow.local",
        name="Teacher Test",
        role="teacher",
        organization_id=organization_id,
    )


def student_user() -> UserProfile:
    return UserProfile(
        id="student-test",
        email="student-test@teachflow.local",
        name="Student Test",
        role="student",
        organization_id="org-demo",
    )


@pytest.fixture(autouse=True)
def clear_state() -> None:
    reset_learning_store_for_tests()
    reset_lesson_store_for_tests()
    reset_generation_job_store_for_tests()
    reset_admin_settings_store_for_tests()


def create_lesson(
    *,
    teacher: UserProfile,
    status: str = "published",
    title: str = "Quang hop trong thuc vat",
) -> LessonSessionResponse:
    course = create_course(
        CourseCreateRequest(
            title="Sinh hoc 11",
            description="Khoa hoc demo",
            learning_goals="Hieu quang hop",
            teaching_language="Vietnamese",
        ),
        current_user=teacher,
    )
    class_profile = create_class_profile(
        course_id=course.id,
        payload=ClassCreateRequest(
            name="11A1",
            student_level="average",
            background_knowledge="Da hoc sinh hoc co ban",
            session_count=4,
            minutes_per_session=45,
            teaching_style="Truc quan",
        ),
        current_user=teacher,
    )
    now = "2026-07-01T00:00:00+00:00"
    lesson = LessonSessionResponse(
        id=f"lesson-{status}-{teacher.id}",
        outline_id="outline-1",
        outline_session_index=1,
        course_id=course.id,
        class_id=class_profile.id,
        teacher_id=teacher.id,
        title=title,
        status=status,
        admin_feedback=None,
        blocks=[
            LessonBlockResponse(
                id="block-1",
                type="quiz",
                title="Cau hoi tu kiem tra",
                content="Vi sao la co mau xanh?",
                order_index=1,
                status="approved",
                citations=[],
                warning=None,
            )
        ],
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    return get_content_repository().save_lesson(lesson)


class FakeKnowledgeRepository:
    def __init__(self) -> None:
        self.documents = [
            DocumentRecord(
                id="doc-1",
                title="SGK Sinh hoc 11",
                file_name="sinh-hoc-11.pdf",
                file_hash="hash-1",
                source_type="pdf",
                status="completed",
                organization_id="org-demo",
                knowledge_scope="library",
                owner_user_id=None,
                chunk_count=12,
                last_ingested_at="2026-07-01T00:00:00+00:00",
                error_message=None,
                is_active=True,
                created_at="2026-07-01T00:00:00+00:00",
                updated_at="2026-07-01T00:00:00+00:00",
            )
        ]

    def list_documents(self) -> list[DocumentRecord]:
        return self.documents


def knowledge_repository() -> FakeKnowledgeRepository:
    return FakeKnowledgeRepository()


def test_admin_lesson_library_is_real_and_org_scoped() -> None:
    teacher = teacher_user()
    lesson = create_lesson(teacher=teacher, status="published")
    other_teacher = teacher_user(user_id="teacher-other", organization_id="org-other")
    other_lesson = create_lesson(
        teacher=other_teacher,
        status="published",
        title="Lesson org khac",
    )

    library = list_admin_lesson_library(admin_user())

    assert [item.id for item in library.lessons] == [lesson.id]
    assert library.total == 1
    assert library.published == 1
    assert other_lesson.id not in {item.id for item in library.lessons}

    with pytest.raises(HTTPException) as student_error:
        list_admin_lesson_library(student_user())
    assert student_error.value.status_code == 403


def test_admin_reports_count_real_documents_users_jobs_and_lessons() -> None:
    teacher = teacher_user()
    create_lesson(teacher=teacher, status="published")
    job_repository = InMemoryGenerationJobRepository()
    job_repository.create_job(
        job_type="lesson_generation",
        actor=teacher,
        job_input={"lesson_id": "lesson-1"},
        status="completed",
    )
    auth_repository = InMemoryAuthRepository(demo_accounts=[])
    auth_repository.upsert_profile(
        AuthProfileRecord(
            id=teacher.id,
            email=teacher.email,
            name=teacher.name,
            role=teacher.role,
            organization_id=teacher.organization_id or "org-demo",
            auth_provider="demo",
            status="active",
        )
    )
    auth_repository.create_invite(
        email="new-student@example.edu",
        role="student",
        organization_id="org-demo",
        invited_by="admin-test",
    )

    report = build_admin_reports(
        admin_user(),
        auth_repository=auth_repository,
        knowledge_repository=knowledge_repository(),
        job_repository=job_repository,
    )

    assert report.metrics_by_key["lessons_total"].value == 1
    assert report.metrics_by_key["documents_total"].value == 1
    assert report.metrics_by_key["users_total"].value == 3
    assert report.metrics_by_key["jobs_total"].value == 1
    assert report.metrics_by_key["pending_invites"].value == 1
    assert report.lesson_status_counts == {"published": 1}
    assert report.document_status_counts == {"completed": 1}
    assert report.job_status_counts == {"completed": 1}


def test_admin_activity_feed_combines_real_records_and_filters_org() -> None:
    teacher = teacher_user()
    lesson = create_lesson(teacher=teacher, status="published")
    job_repository = InMemoryGenerationJobRepository()
    job_repository.create_job(
        job_type="lesson_generation",
        actor=teacher,
        job_input={"lesson_id": lesson.id},
        status="completed",
    )
    activity = build_admin_activity_feed(
        admin_user(),
        knowledge_repository=knowledge_repository(),
        job_repository=job_repository,
    )

    activity_types = {item.type for item in activity.items}
    assert {"lesson", "document", "job"} <= activity_types
    assert all(item.organization_id == "org-demo" for item in activity.items)

    other_org_activity = build_admin_activity_feed(
        admin_user(organization_id="org-other"),
        knowledge_repository=knowledge_repository(),
        job_repository=job_repository,
    )
    assert other_org_activity.items == []


def test_admin_settings_are_persisted_without_secrets() -> None:
    admin = admin_user()
    initial = get_admin_settings(admin)

    assert initial.organization_id == "org-demo"
    assert initial.ai_model == "gpt-4o-mini"
    assert not hasattr(initial, "openai_api_key")

    updated = update_admin_settings(
        AdminSettingsUpdateRequest(
            ai_model="gpt-4.1-mini",
            monthly_ai_limit=2000,
            email_alerts_enabled=True,
            password_min_length=12,
        ),
        admin,
    )
    reloaded = get_admin_settings(admin)

    assert updated.ai_model == "gpt-4.1-mini"
    assert updated.monthly_ai_limit == 2000
    assert updated.email_alerts_enabled is True
    assert updated.password_min_length == 12
    assert reloaded == updated

    with pytest.raises(HTTPException) as student_error:
        get_admin_settings(student_user())
    assert student_error.value.status_code == 403
