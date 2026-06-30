from fastapi import HTTPException
import pytest

from main import (
    AddStudentRequest,
    ClassCreateRequest,
    CourseCreateRequest,
    CourseOutlineGenerateRequest,
    DocumentRecord,
    AdminFeedbackRequest,
    LessonBlockStatusRequest,
    LessonBlockUpdateRequest,
    LessonGenerateRequest,
    LessonSessionUpdateRequest,
    LoginRequest,
    RetrievedChunkRecord,
    UserProfile,
    add_student_to_class,
    archive_lesson_session,
    authenticate_demo_user,
    create_class_profile,
    create_course,
    generate_course_outline,
    generate_lesson_blocks,
    get_student_published_lesson,
    list_generation_jobs,
    list_lesson_audit_events,
    list_admin_review_queue,
    list_teacher_lessons,
    list_student_published_lessons,
    publish_lesson_for_admin,
    regenerate_lesson_block,
    reject_lesson_for_admin,
    request_lesson_changes_for_admin,
    set_lesson_block_status,
    reset_demo_sessions_for_tests,
    reset_generation_job_store_for_tests,
    reset_learning_store_for_tests,
    reset_lesson_store_for_tests,
    reset_outline_store_for_tests,
    submit_lesson_for_admin,
    update_lesson_block,
    update_lesson_session,
)


class FakeKnowledgeRepository:
    def __init__(self) -> None:
        self.documents = [
            DocumentRecord(
                id="doc-1",
                title="Building Applications with AI Agents",
                file_name="building applications with ai agents.pdf",
                file_hash="hash-a",
                source_type="pdf",
                status="completed",
                chunk_count=12,
                last_ingested_at="2026-06-28T00:00:00+00:00",
                error_message=None,
                created_at="2026-06-28T00:00:00+00:00",
                updated_at="2026-06-28T00:00:00+00:00",
            )
        ]

    def list_documents(self) -> list[DocumentRecord]:
        return self.documents

    def get_documents_by_ids(self, document_ids: list[str]) -> list[DocumentRecord]:
        return [doc for doc in self.documents if doc.id in set(document_ids)]

    def search_chunks(
        self,
        *,
        topic: str,
        selected_document_ids: list[str],
        query_embedding: list[float],
        top_k: int,
    ) -> list[RetrievedChunkRecord]:
        return [
            RetrievedChunkRecord(
                chunk_id="chunk-1",
                document_id="doc-1",
                document_title="Building Applications with AI Agents",
                page_number=42,
                chunk_index=3,
                excerpt="Agents use models, tools, memory, and orchestration loops.",
                score=0.94,
            )
        ]

    def save_retrieval_job(
        self,
        *,
        topic: str,
        selected_document_ids: list[str],
        chunks: list[RetrievedChunkRecord],
    ) -> str:
        return "job-lesson"


class FakeAIProvider:
    def __init__(self, *, missing_quiz: bool = False) -> None:
        self.missing_quiz = missing_quiz

    def generate_structured(
        self,
        *,
        prompt: str,
        schema: dict[str, object],
        schema_name: str,
    ) -> dict[str, object]:
        if schema_name == "course_outline":
            return {
                "sessions": [
                    {
                        "session_index": 1,
                        "title": "AI Agent Architecture",
                        "learning_objectives": ["Explain agent components"],
                        "key_topics": ["models", "tools", "memory"],
                        "teaching_activities": ["Discuss source excerpt"],
                        "suggested_exercises": ["Map an agent loop"],
                        "adaptation_notes": "Use concrete examples.",
                    }
                ]
            }
        if schema_name == "lesson_block_regenerate":
            return {
                "title": "Regenerated block title",
                "content": "Regenerated grounded content",
            }

        block_types = [
            "learning_objectives",
            "concept_explanation",
            "analogy_or_example",
            "quiz",
            "slide",
        ]
        if self.missing_quiz:
            block_types.remove("quiz")
        return {
            "blocks": [
                {
                    "type": block_type,
                    "title": f"{block_type} title",
                    "content": f"{block_type} grounded content",
                }
                for block_type in block_types
            ]
        }

    def generate_text(self, prompt: str) -> str:
        return prompt

    def embed_text(self, text: str) -> list[float]:
        return [0.0] * 384


@pytest.fixture(autouse=True)
def clear_state() -> None:
    reset_demo_sessions_for_tests()
    reset_learning_store_for_tests()
    reset_outline_store_for_tests()
    reset_lesson_store_for_tests()
    reset_generation_job_store_for_tests()


def teacher_user() -> UserProfile:
    return authenticate_demo_user(
        LoginRequest(email="teacher@teachflow.local", password="teachflow-demo")
    ).user


def admin_user() -> UserProfile:
    return authenticate_demo_user(
        LoginRequest(email="admin@teachflow.local", password="teachflow-demo")
    ).user


def student_user() -> UserProfile:
    return authenticate_demo_user(
        LoginRequest(email="student@teachflow.local", password="teachflow-demo")
    ).user


def create_outline(teacher: UserProfile) -> str:
    course = create_course(
        CourseCreateRequest(
            title="AI Agents Crash Course",
            description="Demo course",
            learning_goals="Understand AI agents",
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
            session_count=1,
            minutes_per_session=60,
            teaching_style="Visual examples",
        ),
        current_user=teacher,
    )
    outline = generate_course_outline(
        payload=CourseOutlineGenerateRequest(
            course_id=course.id,
            class_id=class_profile.id,
            selected_document_ids=["doc-1"],
            topic="AI Agents",
        ),
        current_user=teacher,
        repository=FakeKnowledgeRepository(),
        ai_provider=FakeAIProvider(),
    )
    return outline.id


def create_submitted_lesson_response(teacher: UserProfile):
    outline_id = create_outline(teacher)
    lesson = generate_lesson_blocks(
        payload=LessonGenerateRequest(outline_id=outline_id, session_index=1),
        current_user=teacher,
        repository=FakeKnowledgeRepository(),
        ai_provider=FakeAIProvider(),
    )
    for block in lesson.blocks:
        lesson = set_lesson_block_status(
            block_id=block.id,
            payload=LessonBlockStatusRequest(status="approved"),
            current_user=teacher,
        )
    submitted = submit_lesson_for_admin(lesson.id, teacher)
    return submitted


def create_submitted_lesson(teacher: UserProfile) -> str:
    return create_submitted_lesson_response(teacher).id


def test_generate_lesson_blocks_with_required_types_and_citations() -> None:
    teacher = teacher_user()
    outline_id = create_outline(teacher)

    lesson = generate_lesson_blocks(
        payload=LessonGenerateRequest(outline_id=outline_id, session_index=1),
        current_user=teacher,
        repository=FakeKnowledgeRepository(),
        ai_provider=FakeAIProvider(),
    )

    assert [block.type for block in lesson.blocks] == [
        "learning_objectives",
        "concept_explanation",
        "analogy_or_example",
        "quiz",
        "slide",
    ]
    assert all(block.status == "needs_review" for block in lesson.blocks)
    assert lesson.blocks[0].citations[0].chunk_id == "chunk-1"
    assert lesson.blocks[0].warning is None
    jobs = list_generation_jobs(teacher)
    assert jobs[0].job_type == "lesson_generation"
    assert jobs[0].status == "completed"
    assert jobs[0].output["lesson_id"] == lesson.id


def test_teacher_updates_lesson_session_title() -> None:
    teacher = teacher_user()
    outline_id = create_outline(teacher)
    lesson = generate_lesson_blocks(
        payload=LessonGenerateRequest(outline_id=outline_id, session_index=1),
        current_user=teacher,
        repository=FakeKnowledgeRepository(),
        ai_provider=FakeAIProvider(),
    )

    updated = update_lesson_session(
        lesson.id,
        LessonSessionUpdateRequest(title="Kien truc AI Agent da chinh sua"),
        teacher,
    )

    assert updated.id == lesson.id
    assert updated.title == "Kien truc AI Agent da chinh sua"
    assert updated.updated_at != lesson.updated_at


def test_teacher_archives_lesson_and_hides_it_from_active_flows() -> None:
    teacher = teacher_user()
    student = student_user()
    admin = admin_user()
    submitted = create_submitted_lesson_response(teacher)
    add_student_to_class(
        class_id=submitted.class_id,
        payload=AddStudentRequest(student_id=student.id),
        current_user=teacher,
    )
    published = publish_lesson_for_admin(submitted.id, admin)
    assert list_student_published_lessons(student) == [published]

    archived = archive_lesson_session(published.id, teacher)

    assert archived.id == published.id
    assert archived.is_active is False
    assert list_teacher_lessons(published.class_id, teacher) == []
    assert list_admin_review_queue(admin) == []
    assert list_student_published_lessons(student) == []
    with pytest.raises(HTTPException) as exc_info:
        get_student_published_lesson(published.id, student)
    assert exc_info.value.status_code == 404


def test_generate_lesson_blocks_rejects_missing_required_type() -> None:
    teacher = teacher_user()
    outline_id = create_outline(teacher)

    with pytest.raises(HTTPException) as exc_info:
        generate_lesson_blocks(
            payload=LessonGenerateRequest(outline_id=outline_id, session_index=1),
            current_user=teacher,
            repository=FakeKnowledgeRepository(),
            ai_provider=FakeAIProvider(missing_quiz=True),
        )

    assert exc_info.value.status_code == 502


def test_student_cannot_generate_lesson_blocks() -> None:
    teacher = teacher_user()
    outline_id = create_outline(teacher)

    with pytest.raises(HTTPException) as exc_info:
        generate_lesson_blocks(
            payload=LessonGenerateRequest(outline_id=outline_id, session_index=1),
            current_user=student_user(),
            repository=FakeKnowledgeRepository(),
            ai_provider=FakeAIProvider(),
        )

    assert exc_info.value.status_code == 403


def test_teacher_updates_approves_and_submits_lesson() -> None:
    teacher = teacher_user()
    outline_id = create_outline(teacher)
    lesson = generate_lesson_blocks(
        payload=LessonGenerateRequest(outline_id=outline_id, session_index=1),
        current_user=teacher,
        repository=FakeKnowledgeRepository(),
        ai_provider=FakeAIProvider(),
    )
    first_block_id = lesson.blocks[0].id

    updated = update_lesson_block(
        block_id=first_block_id,
        payload=LessonBlockUpdateRequest(
            title="Updated objectives",
            content="Updated grounded content",
        ),
        current_user=teacher,
    )
    assert updated.blocks[0].title == "Updated objectives"
    assert updated.blocks[0].status == "needs_review"

    with pytest.raises(HTTPException) as exc_info:
        submit_lesson_for_admin(lesson.id, current_user=teacher)
    assert exc_info.value.status_code == 400

    current_lesson = updated
    for block in current_lesson.blocks:
        current_lesson = set_lesson_block_status(
            block_id=block.id,
            payload=LessonBlockStatusRequest(status="approved"),
            current_user=teacher,
        )

    submitted = submit_lesson_for_admin(current_lesson.id, current_user=teacher)

    assert submitted.status == "submitted_for_admin_review"
    assert all(block.status == "approved" for block in submitted.blocks)


def test_saving_changed_block_resets_review_status() -> None:
    teacher = teacher_user()
    outline_id = create_outline(teacher)
    lesson = generate_lesson_blocks(
        payload=LessonGenerateRequest(outline_id=outline_id, session_index=1),
        current_user=teacher,
        repository=FakeKnowledgeRepository(),
        ai_provider=FakeAIProvider(),
    )
    first_block_id = lesson.blocks[0].id
    approved = set_lesson_block_status(
        block_id=first_block_id,
        payload=LessonBlockStatusRequest(status="approved"),
        current_user=teacher,
    )
    assert approved.blocks[0].status == "approved"

    updated = update_lesson_block(
        block_id=first_block_id,
        payload=LessonBlockUpdateRequest(
            title="Revised title",
            content="Revised content needs review",
        ),
        current_user=teacher,
    )

    assert updated.blocks[0].status == "needs_review"
    with pytest.raises(HTTPException) as exc_info:
        submit_lesson_for_admin(updated.id, current_user=teacher)
    assert exc_info.value.status_code == 400


def test_lesson_audit_records_teacher_block_actions() -> None:
    teacher = teacher_user()
    outline_id = create_outline(teacher)
    lesson = generate_lesson_blocks(
        payload=LessonGenerateRequest(outline_id=outline_id, session_index=1),
        current_user=teacher,
        repository=FakeKnowledgeRepository(),
        ai_provider=FakeAIProvider(),
    )
    block_id = lesson.blocks[0].id

    update_lesson_block(
        block_id=block_id,
        payload=LessonBlockUpdateRequest(
            title="Audit title",
            content="Audit content",
        ),
        current_user=teacher,
    )
    set_lesson_block_status(
        block_id=block_id,
        payload=LessonBlockStatusRequest(status="approved"),
        current_user=teacher,
    )
    regenerate_lesson_block(block_id, teacher, FakeAIProvider())

    events = list_lesson_audit_events(lesson.id, teacher)
    jobs = list_generation_jobs(teacher)

    assert [event.action for event in events] == [
        "lesson_generated",
        "block_edited",
        "block_status_changed",
        "block_regenerated",
    ]
    assert events[-1].block_id == block_id
    assert events[-1].actor_role == "teacher"
    assert jobs[0].job_type == "block_regeneration"
    assert jobs[0].status == "completed"
    assert jobs[0].output["block_id"] == block_id


def test_student_cannot_update_lesson_block() -> None:
    teacher = teacher_user()
    outline_id = create_outline(teacher)
    lesson = generate_lesson_blocks(
        payload=LessonGenerateRequest(outline_id=outline_id, session_index=1),
        current_user=teacher,
        repository=FakeKnowledgeRepository(),
        ai_provider=FakeAIProvider(),
    )

    with pytest.raises(HTTPException) as exc_info:
        update_lesson_block(
            block_id=lesson.blocks[0].id,
            payload=LessonBlockUpdateRequest(title="Bad", content="Bad"),
            current_user=student_user(),
        )

    assert exc_info.value.status_code == 403


def test_admin_lists_submitted_lesson_review_queue() -> None:
    teacher = teacher_user()
    lesson_id = create_submitted_lesson(teacher)

    queue = list_admin_review_queue(admin_user())

    assert [lesson.id for lesson in queue] == [lesson_id]
    assert queue[0].status == "submitted_for_admin_review"
    assert queue[0].blocks[0].citations[0].chunk_id == "chunk-1"


def test_admin_review_queue_is_scoped_to_admin_organization() -> None:
    teacher = teacher_user()
    lesson_id = create_submitted_lesson(teacher)
    other_org_admin = admin_user().model_copy(update={"organization_id": "org-other"})

    assert [lesson.id for lesson in list_admin_review_queue(admin_user())] == [
        lesson_id
    ]
    assert list_admin_review_queue(other_org_admin) == []

    with pytest.raises(HTTPException) as publish_exc:
        publish_lesson_for_admin(lesson_id, other_org_admin)

    assert publish_exc.value.status_code == 404

    with pytest.raises(HTTPException) as audit_exc:
        list_lesson_audit_events(lesson_id, other_org_admin)

    assert audit_exc.value.status_code == 404


def test_admin_publishes_submitted_lesson() -> None:
    teacher = teacher_user()
    lesson_id = create_submitted_lesson(teacher)

    published = publish_lesson_for_admin(lesson_id, admin_user())

    assert published.status == "published"
    assert list_admin_review_queue(admin_user()) == []


def test_teacher_cannot_resubmit_published_lesson() -> None:
    teacher = teacher_user()
    student = student_user()
    submitted = create_submitted_lesson_response(teacher)
    add_student_to_class(
        class_id=submitted.class_id,
        payload=AddStudentRequest(student_id=student.id),
        current_user=teacher,
    )
    published = publish_lesson_for_admin(submitted.id, admin_user())
    assert [lesson.id for lesson in list_student_published_lessons(student)] == [
        published.id
    ]

    with pytest.raises(HTTPException) as exc_info:
        submit_lesson_for_admin(published.id, current_user=teacher)

    assert exc_info.value.status_code == 400
    assert [lesson.id for lesson in list_student_published_lessons(student)] == [
        published.id
    ]


def test_teacher_cannot_mutate_submitted_or_published_lessons() -> None:
    teacher = teacher_user()
    submitted = create_submitted_lesson_response(teacher)
    block_id = submitted.blocks[0].id

    with pytest.raises(HTTPException) as update_exc:
        update_lesson_block(
            block_id=block_id,
            payload=LessonBlockUpdateRequest(title="Late edit", content="Late edit"),
            current_user=teacher,
        )
    assert update_exc.value.status_code == 400

    published = publish_lesson_for_admin(submitted.id, admin_user())
    assert published.status == "published"

    with pytest.raises(HTTPException) as status_exc:
        set_lesson_block_status(
            block_id=block_id,
            payload=LessonBlockStatusRequest(status="rejected"),
            current_user=teacher,
        )
    assert status_exc.value.status_code == 400

    with pytest.raises(HTTPException) as regenerate_exc:
        regenerate_lesson_block(block_id, teacher, FakeAIProvider())
    assert regenerate_exc.value.status_code == 400


def test_admin_requests_changes_with_feedback() -> None:
    teacher = teacher_user()
    lesson_id = create_submitted_lesson(teacher)

    changed = request_lesson_changes_for_admin(
        lesson_id,
        AdminFeedbackRequest(feedback="Add a clearer quiz explanation."),
        admin_user(),
    )

    assert changed.status == "changes_requested"
    assert changed.admin_feedback == "Add a clearer quiz explanation."
    assert list_admin_review_queue(admin_user()) == []


def test_lesson_audit_records_submit_publish_request_and_reject() -> None:
    teacher = teacher_user()
    published_id = create_submitted_lesson(teacher)
    publish_lesson_for_admin(published_id, admin_user())

    changes_id = create_submitted_lesson(teacher)
    request_lesson_changes_for_admin(
        changes_id,
        AdminFeedbackRequest(feedback="Revise examples."),
        admin_user(),
    )

    rejected_id = create_submitted_lesson(teacher)
    reject_lesson_for_admin(
        rejected_id,
        AdminFeedbackRequest(feedback="Reject for weak citations."),
        admin_user(),
    )

    published_events = list_lesson_audit_events(published_id, admin_user())
    changes_events = list_lesson_audit_events(changes_id, teacher)
    rejected_events = list_lesson_audit_events(rejected_id, teacher)

    assert "lesson_submitted" in [event.action for event in published_events]
    assert published_events[-1].action == "lesson_published"
    assert published_events[-1].actor_role == "admin"
    assert changes_events[-1].action == "changes_requested"
    assert changes_events[-1].details == "Revise examples."
    assert rejected_events[-1].action == "lesson_rejected"
    assert rejected_events[-1].details == "Reject for weak citations."


def test_admin_rejects_submitted_lesson_with_reason() -> None:
    teacher = teacher_user()
    lesson_id = create_submitted_lesson(teacher)

    rejected = reject_lesson_for_admin(
        lesson_id,
        AdminFeedbackRequest(feedback="Sources do not support the quiz."),
        admin_user(),
    )

    assert rejected.status == "admin_rejected"
    assert rejected.admin_feedback == "Sources do not support the quiz."
    assert list_admin_review_queue(admin_user()) == []


def test_admin_reject_requires_submitted_status() -> None:
    teacher = teacher_user()
    lesson_id = create_submitted_lesson(teacher)
    rejected = reject_lesson_for_admin(
        lesson_id,
        AdminFeedbackRequest(feedback="Reject once."),
        admin_user(),
    )

    with pytest.raises(HTTPException) as exc_info:
        reject_lesson_for_admin(
            rejected.id,
            AdminFeedbackRequest(feedback="Reject twice."),
            admin_user(),
        )

    assert exc_info.value.status_code == 400


def test_admin_reject_requires_reason() -> None:
    teacher = teacher_user()
    lesson_id = create_submitted_lesson(teacher)

    with pytest.raises(ValueError):
        AdminFeedbackRequest(feedback="")

    lesson = list_admin_review_queue(admin_user())[0]
    assert lesson.id == lesson_id


def test_teacher_lists_requested_changes_with_feedback() -> None:
    teacher = teacher_user()
    lesson_id = create_submitted_lesson(teacher)
    changed = request_lesson_changes_for_admin(
        lesson_id,
        AdminFeedbackRequest(feedback="Revise the example and quiz."),
        admin_user(),
    )

    lessons = list_teacher_lessons(changed.class_id, teacher)

    assert [lesson.id for lesson in lessons] == [lesson_id]
    assert lessons[0].status == "changes_requested"
    assert lessons[0].admin_feedback == "Revise the example and quiz."


def test_teacher_lists_rejected_lesson_with_feedback() -> None:
    teacher = teacher_user()
    lesson_id = create_submitted_lesson(teacher)
    rejected = reject_lesson_for_admin(
        lesson_id,
        AdminFeedbackRequest(feedback="Reject until source evidence is fixed."),
        admin_user(),
    )

    lessons = list_teacher_lessons(rejected.class_id, teacher)

    assert [lesson.id for lesson in lessons] == [lesson_id]
    assert lessons[0].status == "admin_rejected"
    assert lessons[0].admin_feedback == "Reject until source evidence is fixed."


def test_lesson_audit_events_are_protected() -> None:
    teacher = teacher_user()
    submitted = create_submitted_lesson_response(teacher)
    other_teacher = UserProfile(
        id="other-teacher",
        email="other-teacher@teachflow.local",
        name="Other Teacher",
        role="teacher",
    )

    with pytest.raises(HTTPException) as student_exc:
        list_lesson_audit_events(submitted.id, student_user())
    assert student_exc.value.status_code == 403

    with pytest.raises(HTTPException) as teacher_exc:
        list_lesson_audit_events(submitted.id, other_teacher)
    assert teacher_exc.value.status_code == 404

    assert list_lesson_audit_events(submitted.id, admin_user())


def test_non_admin_cannot_moderate_lessons() -> None:
    teacher = teacher_user()
    lesson_id = create_submitted_lesson(teacher)

    with pytest.raises(HTTPException) as exc_info:
        publish_lesson_for_admin(lesson_id, teacher)

    assert exc_info.value.status_code == 403

    with pytest.raises(HTTPException) as reject_exc:
        reject_lesson_for_admin(
            lesson_id,
            AdminFeedbackRequest(feedback="Teacher cannot reject."),
            teacher,
        )

    assert reject_exc.value.status_code == 403


def test_student_lists_only_published_lessons_for_membership() -> None:
    teacher = teacher_user()
    student = student_user()
    submitted = create_submitted_lesson_response(teacher)
    add_student_to_class(
        class_id=submitted.class_id,
        payload=AddStudentRequest(student_id=student.id),
        current_user=teacher,
    )

    assert list_student_published_lessons(student) == []

    published = publish_lesson_for_admin(submitted.id, admin_user())
    lessons = list_student_published_lessons(student)

    assert [lesson.id for lesson in lessons] == [published.id]
    assert lessons[0].status == "published"
    assert lessons[0].blocks[0].citations[0].chunk_id == "chunk-1"


def test_student_published_lessons_are_scoped_to_student_organization() -> None:
    teacher = teacher_user()
    student = student_user()
    other_org_same_student = student.model_copy(update={"organization_id": "org-other"})
    submitted = create_submitted_lesson_response(teacher)
    add_student_to_class(
        class_id=submitted.class_id,
        payload=AddStudentRequest(student_id=student.id),
        current_user=teacher,
    )

    published = publish_lesson_for_admin(submitted.id, admin_user())

    assert [lesson.id for lesson in list_student_published_lessons(student)] == [
        published.id
    ]
    assert list_student_published_lessons(other_org_same_student) == []

    with pytest.raises(HTTPException) as exc_info:
        get_student_published_lesson(published.id, other_org_same_student)

    assert exc_info.value.status_code == 404


def test_student_does_not_see_admin_rejected_lessons() -> None:
    teacher = teacher_user()
    student = student_user()
    submitted = create_submitted_lesson_response(teacher)
    add_student_to_class(
        class_id=submitted.class_id,
        payload=AddStudentRequest(student_id=student.id),
        current_user=teacher,
    )

    rejected = reject_lesson_for_admin(
        submitted.id,
        AdminFeedbackRequest(feedback="Not enough grounding."),
        admin_user(),
    )

    assert rejected.status == "admin_rejected"
    assert list_student_published_lessons(student) == []
    with pytest.raises(HTTPException) as detail_exc:
        get_student_published_lesson(rejected.id, student)
    assert detail_exc.value.status_code == 404


def test_student_direct_lesson_access_requires_membership_and_published_status() -> None:
    teacher = teacher_user()
    student = student_user()
    other_student = UserProfile(
        id="demo-student-other",
        email="other-student@teachflow.local",
        name="Other Student",
        role="student",
    )
    submitted = create_submitted_lesson_response(teacher)

    with pytest.raises(HTTPException) as unpublished_exc:
        get_student_published_lesson(submitted.id, student)

    assert unpublished_exc.value.status_code == 404

    add_student_to_class(
        class_id=submitted.class_id,
        payload=AddStudentRequest(student_id=student.id),
        current_user=teacher,
    )
    published = publish_lesson_for_admin(submitted.id, admin_user())

    assert get_student_published_lesson(published.id, student).id == published.id

    with pytest.raises(HTTPException) as other_student_exc:
        get_student_published_lesson(published.id, other_student)

    assert other_student_exc.value.status_code == 404


def test_teacher_cannot_use_student_lesson_endpoints() -> None:
    with pytest.raises(HTTPException) as exc_info:
        list_student_published_lessons(teacher_user())

    assert exc_info.value.status_code == 403
