from fastapi import HTTPException
import pytest

from main import (
    ClassCreateRequest,
    CourseCreateRequest,
    CourseOutlineGenerateRequest,
    DocumentRecord,
    LoginRequest,
    OutlineSessionUpdateRequest,
    RetrievedChunkRecord,
    UserProfile,
    authenticate_demo_user,
    create_class_profile,
    create_course,
    generate_course_outline,
    list_generation_jobs,
    list_course_outlines,
    reset_demo_sessions_for_tests,
    reset_generation_job_store_for_tests,
    reset_learning_store_for_tests,
    reset_outline_store_for_tests,
    update_outline_session,
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
        return "job-1"


class FakeAIProvider:
    def __init__(self, session_count: int) -> None:
        self.session_count = session_count
        self.prompt = ""

    def generate_structured(
        self,
        *,
        prompt: str,
        schema: dict[str, object],
        schema_name: str,
    ) -> dict[str, object]:
        self.prompt = prompt
        return {
            "sessions": [
                {
                    "session_index": index,
                    "title": f"Session {index}: AI Agents",
                    "learning_objectives": [f"Understand objective {index}"],
                    "key_topics": ["agent loop", "tool use"],
                    "teaching_activities": ["Guided source discussion"],
                    "suggested_exercises": ["Map an agent workflow"],
                    "adaptation_notes": "Use visual examples for average students.",
                }
                for index in range(1, self.session_count + 1)
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
    reset_generation_job_store_for_tests()


def teacher_user() -> UserProfile:
    return authenticate_demo_user(
        LoginRequest(email="teacher@teachflow.local", password="teachflow-demo")
    ).user


def student_user() -> UserProfile:
    return authenticate_demo_user(
        LoginRequest(email="student@teachflow.local", password="teachflow-demo")
    ).user


def create_course_and_class(teacher: UserProfile) -> tuple[str, str]:
    course = create_course(
        CourseCreateRequest(
            title="Introduction to Artificial Intelligence",
            description="Demo course",
            learning_goals="Understand AI agents",
            teaching_language="Vietnamese",
        ),
        current_user=teacher,
    )
    class_profile = create_class_profile(
        course_id=course.id,
        payload=ClassCreateRequest(
            name="KTPM-K18",
            student_level="average",
            background_knowledge="Basic programming",
            session_count=2,
            minutes_per_session=90,
            teaching_style="Visual examples",
        ),
        current_user=teacher,
    )
    return course.id, class_profile.id


def test_generate_course_outline_validates_and_saves_sessions() -> None:
    teacher = teacher_user()
    course_id, class_id = create_course_and_class(teacher)
    provider = FakeAIProvider(session_count=2)

    outline = generate_course_outline(
        payload=CourseOutlineGenerateRequest(
            course_id=course_id,
            class_id=class_id,
            selected_document_ids=["doc-1"],
            topic="AI Agents",
        ),
        current_user=teacher,
        repository=FakeKnowledgeRepository(),
        ai_provider=provider,
    )

    assert outline.course_id == course_id
    assert outline.class_id == class_id
    assert outline.generation_job_id.startswith("job-")
    assert [session.session_index for session in outline.sessions] == [1, 2]
    assert outline.sessions[0].source_references[0].chunk_id == "chunk-1"
    assert "KTPM-K18" in provider.prompt
    assert "Agents use models" in provider.prompt
    assert list_course_outlines(class_id=class_id, current_user=teacher) == [outline]
    jobs = list_generation_jobs(teacher)
    assert jobs[0].id == outline.generation_job_id
    assert jobs[0].job_type == "outline_generation"
    assert jobs[0].status == "completed"
    assert jobs[0].output["outline_id"] == outline.id


def test_generate_course_outline_rejects_ai_session_count_mismatch() -> None:
    teacher = teacher_user()
    course_id, class_id = create_course_and_class(teacher)

    with pytest.raises(HTTPException) as exc_info:
        generate_course_outline(
            payload=CourseOutlineGenerateRequest(
                course_id=course_id,
                class_id=class_id,
                selected_document_ids=["doc-1"],
                topic="AI Agents",
            ),
            current_user=teacher,
            repository=FakeKnowledgeRepository(),
            ai_provider=FakeAIProvider(session_count=1),
        )

    assert exc_info.value.status_code == 502
    jobs = list_generation_jobs(teacher)
    assert jobs[0].job_type == "outline_generation"
    assert jobs[0].status == "failed"
    assert jobs[0].error_message == "AI outline output session count mismatch: expected 2, got 1"


def test_update_outline_session_changes_only_selected_session() -> None:
    teacher = teacher_user()
    course_id, class_id = create_course_and_class(teacher)
    outline = generate_course_outline(
        payload=CourseOutlineGenerateRequest(
            course_id=course_id,
            class_id=class_id,
            selected_document_ids=["doc-1"],
            topic="AI Agents",
        ),
        current_user=teacher,
        repository=FakeKnowledgeRepository(),
        ai_provider=FakeAIProvider(session_count=2),
    )

    updated = update_outline_session(
        outline_id=outline.id,
        session_index=1,
        payload=OutlineSessionUpdateRequest(
            title="Updated AI Agents intro",
            learning_objectives=["Explain agent loop"],
            key_topics=["planning", "tool use"],
            teaching_activities=["Pair review"],
            suggested_exercises=["Trace one workflow"],
            adaptation_notes="Use simpler analogy.",
        ),
        current_user=teacher,
    )

    assert updated.sessions[0].title == "Updated AI Agents intro"
    assert updated.sessions[0].key_topics == ["planning", "tool use"]
    assert updated.sessions[1].title == "Session 2: AI Agents"


def test_student_cannot_generate_outline() -> None:
    teacher = teacher_user()
    course_id, class_id = create_course_and_class(teacher)

    with pytest.raises(HTTPException) as exc_info:
        generate_course_outline(
            payload=CourseOutlineGenerateRequest(
                course_id=course_id,
                class_id=class_id,
                selected_document_ids=["doc-1"],
                topic="AI Agents",
            ),
            current_user=student_user(),
            repository=FakeKnowledgeRepository(),
            ai_provider=FakeAIProvider(session_count=2),
        )

    assert exc_info.value.status_code == 403
