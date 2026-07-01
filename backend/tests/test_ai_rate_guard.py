from fastapi import HTTPException
import pytest

from main import (
    ClassCreateRequest,
    CourseCreateRequest,
    CourseOutlineGenerateRequest,
    DocumentRecord,
    InMemoryGenerationJobRepository,
    LoginRequest,
    RetrievedChunkRecord,
    UserProfile,
    authenticate_demo_user,
    create_class_profile,
    create_course,
    enforce_ai_rate_limit,
    generate_course_outline,
    get_ai_rate_limit_config,
    reset_demo_sessions_for_tests,
    reset_generation_job_store_for_tests,
    reset_learning_store_for_tests,
    reset_outline_store_for_tests,
)


class UncalledKnowledgeRepository:
    def list_documents(self) -> list[DocumentRecord]:
        raise AssertionError("Knowledge repository should not be called")

    def get_documents_by_ids(self, document_ids: list[str]) -> list[DocumentRecord]:
        raise AssertionError("Knowledge repository should not be called")

    def search_chunks(
        self,
        *,
        topic: str,
        selected_document_ids: list[str],
        query_embedding: list[float],
        top_k: int,
    ) -> list[RetrievedChunkRecord]:
        raise AssertionError("Knowledge repository should not be called")

    def save_retrieval_job(
        self,
        *,
        topic: str,
        selected_document_ids: list[str],
        chunks: list[RetrievedChunkRecord],
    ) -> str:
        raise AssertionError("Knowledge repository should not be called")


class TrackingAIProvider:
    def __init__(self) -> None:
        self.called = False

    def generate_structured(
        self,
        *,
        prompt: str,
        schema: dict[str, object],
        schema_name: str,
    ) -> dict[str, object]:
        self.called = True
        return {"sessions": []}

    def generate_text(self, prompt: str) -> str:
        self.called = True
        return prompt

    def embed_text(self, text: str) -> list[float]:
        return [0.0] * 384


@pytest.fixture(autouse=True)
def clear_state(monkeypatch: pytest.MonkeyPatch) -> None:
    reset_demo_sessions_for_tests()
    reset_learning_store_for_tests()
    reset_outline_store_for_tests()
    reset_generation_job_store_for_tests()
    monkeypatch.delenv("AI_ACTION_RATE_LIMIT_ENABLED", raising=False)
    monkeypatch.delenv("AI_ACTION_RATE_LIMIT_MAX_REQUESTS", raising=False)
    monkeypatch.delenv("AI_ACTION_RATE_LIMIT_WINDOW_SECONDS", raising=False)


def teacher_user() -> UserProfile:
    return authenticate_demo_user(
        LoginRequest(email="teacher@teachflow.local", password="teachflow-demo")
    ).user


def create_course_and_class(teacher: UserProfile) -> tuple[str, str]:
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
    return course.id, class_profile.id


def test_ai_rate_limit_config_reads_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_ACTION_RATE_LIMIT_ENABLED", "false")
    monkeypatch.setenv("AI_ACTION_RATE_LIMIT_MAX_REQUESTS", "3")
    monkeypatch.setenv("AI_ACTION_RATE_LIMIT_WINDOW_SECONDS", "120")

    config = get_ai_rate_limit_config()

    assert config.enabled is False
    assert config.max_requests == 3
    assert config.window_seconds == 120


def test_ai_rate_limit_blocks_only_current_actor(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AI_ACTION_RATE_LIMIT_MAX_REQUESTS", "1")
    repository = InMemoryGenerationJobRepository()
    teacher = teacher_user()
    other_teacher = UserProfile(
        id="teacher-other",
        email="other@teachflow.local",
        name="Other Teacher",
        role="teacher",
    )
    repository.create_job(
        job_type="outline_generation",
        actor=teacher,
        job_input={"course_id": "course-1"},
    )

    with pytest.raises(HTTPException) as exc_info:
        enforce_ai_rate_limit(
            teacher,
            job_type="lesson_generation",
            repository=repository,
        )

    assert exc_info.value.status_code == 429
    assert exc_info.value.detail["limit"] == 1
    assert "retry_after_seconds" in exc_info.value.detail

    enforce_ai_rate_limit(
        other_teacher,
        job_type="lesson_generation",
        repository=repository,
    )


def test_rate_limited_outline_generation_does_not_call_ai_provider(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AI_ACTION_RATE_LIMIT_MAX_REQUESTS", "0")
    teacher = teacher_user()
    course_id, class_id = create_course_and_class(teacher)
    ai_provider = TrackingAIProvider()

    with pytest.raises(HTTPException) as exc_info:
        generate_course_outline(
            payload=CourseOutlineGenerateRequest(
                course_id=course_id,
                class_id=class_id,
                selected_document_ids=["doc-1"],
                topic="AI Agents",
            ),
            current_user=teacher,
            repository=UncalledKnowledgeRepository(),
            ai_provider=ai_provider,
        )

    assert exc_info.value.status_code == 429
    assert ai_provider.called is False
