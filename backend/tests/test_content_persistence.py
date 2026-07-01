from main import (
    InMemoryContentRepository,
    LessonBlockResponse,
    LessonSessionResponse,
    OutlineSessionResponse,
    CourseOutlineResponse,
    RetrievedChunkRecord,
    content_schema_sql,
    reset_lesson_store_for_tests,
    reset_outline_store_for_tests,
)


def source_reference() -> RetrievedChunkRecord:
    return RetrievedChunkRecord(
        chunk_id="chunk-1",
        document_id="doc-1",
        document_title="AI Agents",
        page_number=12,
        chunk_index=4,
        excerpt="Agents use tools and memory.",
        score=0.9,
    )


def sample_outline() -> CourseOutlineResponse:
    return CourseOutlineResponse(
        id="outline-test-1",
        course_id="course-test-1",
        class_id="class-test-1",
        teacher_id="teacher-test-1",
        topic="AI Agents",
        selected_document_ids=["doc-1"],
        generation_job_id="job-outline-1",
        sessions=[
            OutlineSessionResponse(
                session_index=1,
                title="AI Agent Architecture",
                learning_objectives=["Explain agent components"],
                key_topics=["models", "tools"],
                teaching_activities=["Source discussion"],
                suggested_exercises=["Map an agent loop"],
                adaptation_notes="Use concrete examples.",
                source_references=[source_reference()],
            )
        ],
        created_at="2026-06-28T00:00:00+00:00",
        updated_at="2026-06-28T00:00:00+00:00",
    )


def sample_lesson() -> LessonSessionResponse:
    return LessonSessionResponse(
        id="lesson-test-1",
        outline_id="outline-test-1",
        outline_session_index=1,
        course_id="course-test-1",
        class_id="class-test-1",
        teacher_id="teacher-test-1",
        title="AI Agent Architecture",
        status="teacher_reviewing",
        admin_feedback=None,
        blocks=[
            LessonBlockResponse(
                id="block-test-1",
                type="learning_objectives",
                title="Objectives",
                content="Explain agent components.",
                order_index=1,
                status="needs_review",
                citations=[source_reference()],
                warning=None,
            )
        ],
        created_at="2026-06-28T00:00:00+00:00",
        updated_at="2026-06-28T00:00:00+00:00",
    )


def test_memory_content_repository_saves_and_updates_outline() -> None:
    reset_outline_store_for_tests()
    repository = InMemoryContentRepository()
    outline = sample_outline()

    repository.save_outline(outline)
    loaded = repository.get_outline(outline.id)
    assert loaded == outline
    assert repository.list_outlines_for_class(
        class_id=outline.class_id,
        teacher_id=outline.teacher_id,
    ) == [outline]

    updated_session = outline.sessions[0].model_copy(
        update={"title": "Updated Architecture"}
    )
    updated_outline = outline.model_copy(update={"sessions": [updated_session]})
    repository.save_outline(updated_outline)

    assert repository.get_outline(outline.id).sessions[0].title == "Updated Architecture"


def test_memory_content_repository_saves_lessons_and_finds_by_block() -> None:
    reset_lesson_store_for_tests()
    repository = InMemoryContentRepository()
    lesson = sample_lesson()

    repository.save_lesson(lesson)
    loaded = repository.get_lesson(lesson.id)
    assert loaded == lesson
    assert repository.find_lesson_by_block("block-test-1") == lesson
    assert repository.list_lessons_for_class(
        class_id=lesson.class_id,
        teacher_id=lesson.teacher_id,
    ) == [lesson]

    published = lesson.model_copy(update={"status": "published"})
    repository.save_lesson(published)

    assert repository.list_published_lessons_for_classes({lesson.class_id}) == [published]
    assert repository.list_lessons_by_status("teacher_reviewing") == []


def test_content_schema_sql_contains_required_tables_and_rls() -> None:
    schema_sql = content_schema_sql().lower()

    assert "create table if not exists course_outlines" in schema_sql
    assert "create table if not exists outline_sessions" in schema_sql
    assert "create table if not exists lesson_sessions" in schema_sql
    assert "create table if not exists lesson_blocks" in schema_sql
    assert "alter table course_outlines enable row level security" in schema_sql
    assert "revoke all on table lesson_blocks from anon, authenticated" in schema_sql
