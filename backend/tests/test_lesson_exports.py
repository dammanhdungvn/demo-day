from fastapi import HTTPException
import pytest

from main import (
    AddStudentRequest,
    ClassCreateRequest,
    CourseCreateRequest,
    CourseOutlineGenerateRequest,
    DocumentRecord,
    LessonBlockStatusRequest,
    LessonExportRequest,
    LessonGenerateRequest,
    LoginRequest,
    RetrievedChunkRecord,
    UserProfile,
    add_student_to_class,
    authenticate_demo_user,
    create_class_profile,
    create_course,
    generate_course_outline,
    generate_lesson_blocks,
    list_lesson_audit_events,
    list_lesson_exports,
    publish_lesson_for_admin,
    record_lesson_export,
    reset_demo_sessions_for_tests,
    reset_generation_job_store_for_tests,
    reset_learning_store_for_tests,
    reset_lesson_export_store_for_tests,
    reset_lesson_store_for_tests,
    reset_outline_store_for_tests,
    set_lesson_block_status,
    submit_lesson_for_admin,
)


class FakeKnowledgeRepository:
    def __init__(self) -> None:
        self.documents = [
            DocumentRecord(
                id="doc-1",
                title="AI source",
                file_name="ai-source.pdf",
                file_hash="hash-source",
                source_type="pdf",
                status="completed",
                organization_id="org-demo",
                knowledge_scope="library",
                owner_user_id=None,
                chunk_count=1,
                last_ingested_at="2026-06-29T00:00:00+00:00",
                error_message=None,
                is_active=True,
                created_at="2026-06-29T00:00:00+00:00",
                updated_at="2026-06-29T00:00:00+00:00",
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
                document_title="AI source",
                page_number=7,
                chunk_index=1,
                excerpt="Grounded source excerpt for export tests.",
                score=0.92,
            )
        ]

    def save_retrieval_job(
        self,
        *,
        topic: str,
        selected_document_ids: list[str],
        chunks: list[RetrievedChunkRecord],
    ) -> str:
        return "job-export-test"


class FakeAIProvider:
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
                        "title": "Exportable Lesson",
                        "learning_objectives": ["Explain export audit"],
                        "key_topics": ["exports", "audit"],
                        "teaching_activities": ["Review export history"],
                        "suggested_exercises": ["Export the lesson"],
                        "adaptation_notes": "Use concrete evidence.",
                    }
                ]
            }
        return {
            "blocks": [
                {
                    "type": block_type,
                    "title": f"{block_type} title",
                    "content": f"{block_type} grounded content",
                }
                for block_type in [
                    "learning_objectives",
                    "concept_explanation",
                    "analogy_or_example",
                    "quiz",
                    "slide",
                ]
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
    reset_lesson_export_store_for_tests()
    reset_generation_job_store_for_tests()


def login(email: str) -> UserProfile:
    return authenticate_demo_user(
        LoginRequest(email=email, password="teachflow-demo")
    ).user


def teacher_user() -> UserProfile:
    return login("teacher@teachflow.local")


def admin_user() -> UserProfile:
    return login("admin@teachflow.local")


def student_user() -> UserProfile:
    return login("student@teachflow.local")


def create_lesson(teacher: UserProfile):
    course = create_course(
        CourseCreateRequest(
            title="AI Export Course",
            description="Demo course",
            learning_goals="Understand exports",
            teaching_language="Vietnamese",
        ),
        current_user=teacher,
    )
    class_profile = create_class_profile(
        course_id=course.id,
        payload=ClassCreateRequest(
            name="EXPORT-K18",
            student_level="average",
            background_knowledge="Basic web apps",
            session_count=1,
            minutes_per_session=45,
            teaching_style="Hands-on",
        ),
        current_user=teacher,
    )
    outline = generate_course_outline(
        payload=CourseOutlineGenerateRequest(
            course_id=course.id,
            class_id=class_profile.id,
            selected_document_ids=[],
            topic="Export audit",
        ),
        current_user=teacher,
        repository=FakeKnowledgeRepository(),
        ai_provider=FakeAIProvider(),
    )
    return generate_lesson_blocks(
        payload=LessonGenerateRequest(outline_id=outline.id, session_index=1),
        current_user=teacher,
        repository=FakeKnowledgeRepository(),
        ai_provider=FakeAIProvider(),
    )


def publish_lesson_for_student(teacher: UserProfile, student: UserProfile):
    lesson = create_lesson(teacher)
    for block in lesson.blocks:
        lesson = set_lesson_block_status(
            block_id=block.id,
            payload=LessonBlockStatusRequest(status="approved"),
            current_user=teacher,
        )
    submitted = submit_lesson_for_admin(lesson.id, teacher)
    add_student_to_class(
        class_id=submitted.class_id,
        payload=AddStudentRequest(student_id=student.id),
        current_user=teacher,
    )
    return publish_lesson_for_admin(submitted.id, admin_user())


def test_teacher_records_and_lists_lesson_exports() -> None:
    teacher = teacher_user()
    lesson = create_lesson(teacher)

    record = record_lesson_export(
        lesson.id,
        LessonExportRequest(
            export_format="markdown",
            delivery="download",
            file_name="exportable-lesson.md",
        ),
        teacher,
    )
    history = list_lesson_exports(lesson.id, teacher)
    audit_events = list_lesson_audit_events(lesson.id, teacher)

    assert record.lesson_id == lesson.id
    assert record.actor_id == teacher.id
    assert record.actor_role == "teacher"
    assert record.export_format == "markdown"
    assert record.delivery == "download"
    assert record.file_name == "exportable-lesson.md"
    assert record.block_count == len(lesson.blocks)
    assert record.citation_count == len(lesson.blocks)
    assert [item.id for item in history] == [record.id]
    assert audit_events[-1].action == "lesson_exported"
    assert "markdown" in (audit_events[-1].details or "")


def test_student_records_export_only_for_published_membership_lesson() -> None:
    teacher = teacher_user()
    student = student_user()
    published = publish_lesson_for_student(teacher, student)

    record = record_lesson_export(
        published.id,
        LessonExportRequest(export_format="pdf", delivery="print"),
        student,
    )

    assert record.actor_role == "student"
    assert record.export_format == "pdf"
    assert record.delivery == "print"
    assert list_lesson_exports(published.id, student)[0].id == record.id

    draft = create_lesson(teacher)
    add_student_to_class(
        class_id=draft.class_id,
        payload=AddStudentRequest(student_id=student.id),
        current_user=teacher,
    )
    with pytest.raises(HTTPException) as draft_exc:
        record_lesson_export(
            draft.id,
            LessonExportRequest(export_format="pdf", delivery="print"),
            student,
        )
    assert draft_exc.value.status_code == 404


def test_lesson_export_records_enforce_owner_and_org_boundaries() -> None:
    teacher = teacher_user()
    lesson = create_lesson(teacher)
    other_teacher = teacher.model_copy(update={"id": "teacher-other"})
    other_org_admin = admin_user().model_copy(update={"organization_id": "org-other"})

    with pytest.raises(HTTPException) as teacher_exc:
        record_lesson_export(
            lesson.id,
            LessonExportRequest(export_format="pptx", delivery="download"),
            other_teacher,
        )
    assert teacher_exc.value.status_code == 404

    with pytest.raises(HTTPException) as admin_exc:
        list_lesson_exports(lesson.id, other_org_admin)
    assert admin_exc.value.status_code == 404

    admin_record = record_lesson_export(
        lesson.id,
        LessonExportRequest(export_format="pdf", delivery="print"),
        admin_user(),
    )
    assert admin_record.actor_role == "admin"
