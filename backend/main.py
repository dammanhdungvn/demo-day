from __future__ import annotations

import hashlib
import json
import math
import os
import re
import urllib.error
import urllib.request
from datetime import UTC, datetime
from pathlib import Path
from secrets import token_urlsafe
from typing import Annotated, Any, Literal, Protocol

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError
import psycopg
from psycopg.rows import dict_row

API_BASE_PATH = os.getenv("API_BASE_PATH", "/api/v1")
APP_VERSION = "0.1.0"
Role = Literal["admin", "teacher", "student"]
StudentLevel = Literal["weak", "average", "strong"]
DocumentStatus = Literal["processing", "completed", "failed"]
LessonBlockType = Literal[
    "learning_objectives",
    "concept_explanation",
    "analogy_or_example",
    "code_example",
    "teaching_activity",
    "quiz",
    "assignment",
    "common_misconception",
    "visual_diagram",
    "slide",
]
LessonBlockStatus = Literal[
    "needs_review",
    "approved",
    "approved_with_warning",
    "rejected",
]
LessonStatus = Literal[
    "teacher_reviewing",
    "submitted_for_admin_review",
    "changes_requested",
    "published",
]
DEMO_PASSWORD = "teachflow-demo"
EMBEDDING_DIMENSIONS = 384
TOKEN_PATTERN = re.compile(r"[a-zA-Z0-9]+")
REQUIRED_DEMO_BLOCK_TYPES: tuple[LessonBlockType, ...] = (
    "learning_objectives",
    "concept_explanation",
    "analogy_or_example",
    "quiz",
    "slide",
)
TEACHER_MUTABLE_LESSON_STATUSES: tuple[LessonStatus, ...] = (
    "teacher_reviewing",
    "changes_requested",
)


class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    role: Role


class PublicDemoAccount(UserProfile):
    label: str


class DemoAccountRecord(BaseModel):
    public: PublicDemoAccount
    password: str


class LoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=1)


class LoginResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserProfile


class MessageResponse(BaseModel):
    message: str


class DashboardResponse(BaseModel):
    workspace: Role
    title: str
    current_user: UserProfile
    allowed_actions: list[str]
    hidden_actions: list[str]
    next_step: str


class CourseCreateRequest(BaseModel):
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    learning_goals: str = Field(min_length=1)
    teaching_language: str = Field(min_length=1)


class CourseResponse(CourseCreateRequest):
    id: str
    teacher_id: str
    created_at: str
    updated_at: str


class ClassCreateRequest(BaseModel):
    name: str = Field(min_length=1)
    student_level: StudentLevel
    background_knowledge: str
    session_count: int = Field(ge=1, le=100)
    minutes_per_session: int = Field(ge=1, le=300)
    teaching_style: str = Field(min_length=1)


class ClassProfileResponse(ClassCreateRequest):
    id: str
    course_id: str
    teacher_id: str
    created_at: str
    updated_at: str


class AddStudentRequest(BaseModel):
    student_id: str = Field(min_length=1)


class ClassStudentResponse(BaseModel):
    id: str
    class_id: str
    student_id: str
    added_by_teacher_id: str
    created_at: str


class StudentClassSummary(BaseModel):
    class_id: str
    class_name: str
    course_id: str
    course_title: str
    teacher_id: str
    student_level: StudentLevel
    session_count: int
    minutes_per_session: int


class DocumentRecord(BaseModel):
    id: str
    title: str
    file_name: str
    file_hash: str
    source_type: str
    status: DocumentStatus
    chunk_count: int
    last_ingested_at: str | None
    error_message: str | None
    created_at: str
    updated_at: str


class RetrievedChunkRecord(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    page_number: int | None
    chunk_index: int
    excerpt: str
    score: float


class RetrievalRequest(BaseModel):
    topic: str = Field(min_length=3, max_length=500)
    selected_document_ids: list[str] = Field(min_length=1, max_length=20)
    top_k: int = Field(default=5, ge=1, le=10)


class RetrievalResponse(BaseModel):
    topic: str
    selected_document_ids: list[str]
    generation_job_id: str
    chunks: list[RetrievedChunkRecord]


class OutlineSessionDraft(BaseModel):
    session_index: int = Field(ge=1)
    title: str = Field(min_length=1)
    learning_objectives: list[str] = Field(min_length=1)
    key_topics: list[str] = Field(min_length=1)
    teaching_activities: list[str] = Field(min_length=1)
    suggested_exercises: list[str] = Field(min_length=1)
    adaptation_notes: str = Field(min_length=1)


class CourseOutlineAIOutput(BaseModel):
    sessions: list[OutlineSessionDraft] = Field(min_length=1)


class OutlineSessionResponse(OutlineSessionDraft):
    source_references: list[RetrievedChunkRecord]


class CourseOutlineGenerateRequest(BaseModel):
    course_id: str = Field(min_length=1)
    class_id: str = Field(min_length=1)
    selected_document_ids: list[str] = Field(min_length=1, max_length=20)
    topic: str = Field(min_length=3, max_length=500)
    top_k: int = Field(default=6, ge=1, le=10)


class OutlineSessionUpdateRequest(BaseModel):
    title: str = Field(min_length=1)
    learning_objectives: list[str] = Field(min_length=1)
    key_topics: list[str] = Field(min_length=1)
    teaching_activities: list[str] = Field(min_length=1)
    suggested_exercises: list[str] = Field(min_length=1)
    adaptation_notes: str = Field(min_length=1)


class CourseOutlineResponse(BaseModel):
    id: str
    course_id: str
    class_id: str
    teacher_id: str
    topic: str
    selected_document_ids: list[str]
    generation_job_id: str
    sessions: list[OutlineSessionResponse]
    created_at: str
    updated_at: str


class LessonBlockDraft(BaseModel):
    type: LessonBlockType
    title: str = Field(min_length=1)
    content: str = Field(min_length=1)


class LessonBlocksAIOutput(BaseModel):
    blocks: list[LessonBlockDraft] = Field(min_length=1)


class LessonGenerateRequest(BaseModel):
    outline_id: str = Field(min_length=1)
    session_index: int = Field(ge=1)
    top_k: int = Field(default=6, ge=1, le=10)


class LessonBlockUpdateRequest(BaseModel):
    title: str = Field(min_length=1)
    content: str = Field(min_length=1)


class LessonBlockStatusRequest(BaseModel):
    status: LessonBlockStatus


class AdminFeedbackRequest(BaseModel):
    feedback: str = Field(min_length=1, max_length=2000)


class LessonBlockRegenerateAIOutput(BaseModel):
    title: str = Field(min_length=1)
    content: str = Field(min_length=1)


class LessonBlockResponse(BaseModel):
    id: str
    type: LessonBlockType
    title: str
    content: str
    order_index: int
    status: LessonBlockStatus
    citations: list[RetrievedChunkRecord]
    warning: str | None


class LessonSessionResponse(BaseModel):
    id: str
    outline_id: str
    outline_session_index: int
    course_id: str
    class_id: str
    teacher_id: str
    title: str
    status: LessonStatus
    admin_feedback: str | None = None
    blocks: list[LessonBlockResponse]
    created_at: str
    updated_at: str


class KnowledgeRepository(Protocol):
    def list_documents(self) -> list[DocumentRecord]: ...

    def get_documents_by_ids(self, document_ids: list[str]) -> list[DocumentRecord]: ...

    def search_chunks(
        self,
        *,
        topic: str,
        selected_document_ids: list[str],
        query_embedding: list[float],
        top_k: int,
    ) -> list[RetrievedChunkRecord]: ...

    def save_retrieval_job(
        self,
        *,
        topic: str,
        selected_document_ids: list[str],
        chunks: list[RetrievedChunkRecord],
    ) -> str: ...


class AIProvider(Protocol):
    def generate_structured(
        self,
        *,
        prompt: str,
        schema: dict[str, object],
        schema_name: str,
    ) -> dict[str, object]: ...

    def generate_text(self, prompt: str) -> str: ...

    def embed_text(self, text: str) -> list[float]: ...


DEMO_ACCOUNTS: tuple[DemoAccountRecord, ...] = (
    DemoAccountRecord(
        public=PublicDemoAccount(
            id="demo-admin",
            email="admin@teachflow.local",
            name="Admin Demo",
            role="admin",
            label="Admin workspace",
        ),
        password=DEMO_PASSWORD,
    ),
    DemoAccountRecord(
        public=PublicDemoAccount(
            id="demo-teacher",
            email="teacher@teachflow.local",
            name="Teacher Demo",
            role="teacher",
            label="Teacher workspace",
        ),
        password=DEMO_PASSWORD,
    ),
    DemoAccountRecord(
        public=PublicDemoAccount(
            id="demo-student",
            email="student@teachflow.local",
            name="Student Demo",
            role="student",
            label="Student workspace",
        ),
        password=DEMO_PASSWORD,
    ),
)

DEMO_ACCOUNTS_BY_EMAIL = {
    account.public.email.lower(): account for account in DEMO_ACCOUNTS
}
ACTIVE_DEMO_SESSIONS: dict[str, UserProfile] = {}
COURSES: dict[str, CourseResponse] = {}
CLASSES: dict[str, ClassProfileResponse] = {}
CLASS_STUDENTS: dict[str, ClassStudentResponse] = {}
COURSE_OUTLINES: dict[str, CourseOutlineResponse] = {}
LESSON_SESSIONS: dict[str, LessonSessionResponse] = {}
STORE_COUNTERS = {
    "course": 0,
    "class": 0,
    "membership": 0,
    "outline": 0,
    "lesson": 0,
    "block": 0,
}

DASHBOARD_COPY: dict[Role, dict[str, list[str] | str]] = {
    "admin": {
        "title": "Admin Dashboard",
        "allowed_actions": [
            "Xem review queue",
            "Xem citations va warning",
            "Approve & publish lesson",
            "Request changes cho Teacher",
        ],
        "hidden_actions": [
            "Sua truc tiep lesson content",
            "Teacher Lesson Studio controls",
            "Student reading-only controls",
        ],
        "next_step": "Cho P0-008: hien submitted lessons va moderation actions.",
    },
    "teacher": {
        "title": "Teacher Dashboard",
        "allowed_actions": [
            "Tao course",
            "Tao class profile",
            "Add Student vao class",
            "Mo Lesson Studio khi cac P0 sau san sang",
        ],
        "hidden_actions": [
            "Admin approve & publish",
            "Student-only reading view",
            "Xem class khong thuoc teacher hien tai",
        ],
        "next_step": "Cho P0-003: tao course, class profile va membership.",
    },
    "student": {
        "title": "Student Dashboard",
        "allowed_actions": [
            "Xem class minh duoc add",
            "Xem published lessons",
            "Mo reading view",
            "Mo presentation/PDF neu duoc phep",
        ],
        "hidden_actions": [
            "Teacher edit/regenerate/approve controls",
            "Admin moderation controls",
            "Draft/submitted lessons",
        ],
        "next_step": "Cho P0-009: hien class membership va published lessons.",
    },
}


def _allowed_origins() -> list[str]:
    raw = os.getenv(
        "BACKEND_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def _read_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values

    for line in path.read_text().splitlines():
        raw = line.strip()
        if not raw or raw.startswith("#") or "=" not in raw:
            continue

        key, value = raw.split("=", 1)
        key = key.strip()
        if key.startswith("export "):
            key = key[7:].strip()

        values[key] = value.strip().strip('"').strip("'")

    return values


def _env_value(name: str) -> str | None:
    direct_value = os.getenv(name)
    if direct_value:
        return direct_value

    for env_path in (Path.cwd() / ".env", Path.cwd().parent / ".env"):
        file_value = _read_env_file(env_path).get(name)
        if file_value:
            return file_value

    return None


def _database_conninfo() -> str:
    conninfo = (
        _env_value("SUPABASE_POOLER_CONNECTING_STRING")
        or _env_value("DATABASE_URL")
        or _env_value("SUPABASE_DIRECT_CONNECTING_STRING")
    )
    if not conninfo:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase database connection is not configured",
        )

    return conninfo


def create_text_embedding(text: str, dimensions: int = EMBEDDING_DIMENSIONS) -> list[float]:
    vector = [0.0] * dimensions
    tokens = TOKEN_PATTERN.findall(text.lower())
    if not tokens:
        return vector

    for token in tokens:
        digest = hashlib.blake2b(token.encode("utf-8"), digest_size=8).digest()
        index = int.from_bytes(digest[:4], "big") % dimensions
        sign = 1.0 if digest[4] % 2 else -1.0
        weight = 1.0 + min(len(token), 12) / 12
        vector[index] += sign * weight

    magnitude = math.sqrt(sum(value * value for value in vector))
    if magnitude == 0:
        return vector

    return [round(value / magnitude, 8) for value in vector]


def vector_to_sql(vector: list[float]) -> str:
    return "[" + ",".join(f"{value:.8f}" for value in vector) + "]"


class SupabaseKnowledgeRepository:
    def __init__(self, conninfo: str) -> None:
        self.conninfo = conninfo

    def _connect(self) -> psycopg.Connection[dict[str, Any]]:
        return psycopg.connect(
            self.conninfo,
            connect_timeout=20,
            prepare_threshold=None,
            row_factory=dict_row,
        )

    def list_documents(self) -> list[DocumentRecord]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      id::text,
                      title,
                      file_name,
                      file_hash,
                      source_type,
                      status,
                      chunk_count,
                      last_ingested_at::text,
                      error_message,
                      created_at::text,
                      updated_at::text
                    from documents
                    order by title asc
                    """
                )
                return [DocumentRecord(**row) for row in cur.fetchall()]

    def get_documents_by_ids(self, document_ids: list[str]) -> list[DocumentRecord]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      id::text,
                      title,
                      file_name,
                      file_hash,
                      source_type,
                      status,
                      chunk_count,
                      last_ingested_at::text,
                      error_message,
                      created_at::text,
                      updated_at::text
                    from documents
                    where id::text = any(%s)
                    """,
                    (document_ids,),
                )
                return [DocumentRecord(**row) for row in cur.fetchall()]

    def search_chunks(
        self,
        *,
        topic: str,
        selected_document_ids: list[str],
        query_embedding: list[float],
        top_k: int,
    ) -> list[RetrievedChunkRecord]:
        embedding = vector_to_sql(query_embedding)
        query_tokens = sorted({token for token in TOKEN_PATTERN.findall(topic.lower()) if len(token) > 2})
        token_count = max(len(query_tokens), 1)
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    with ranked_chunks as (
                      select
                        dc.id::text as chunk_id,
                        dc.document_id::text as document_id,
                        d.title as document_title,
                        dc.page_number,
                        dc.chunk_index,
                        dc.content,
                        dc.embedding <=> %s::vector as distance,
                        (
                          select count(*)::float
                          from unnest(%s::text[]) as token
                          where lower(dc.content) like '%%' || token || '%%'
                        ) as lexical_matches
                      from document_chunks dc
                      join documents d on d.id = dc.document_id
                      where dc.document_id::text = any(%s)
                        and d.status = 'completed'
                    )
                    select
                      chunk_id,
                      document_id,
                      document_title,
                      page_number,
                      chunk_index,
                      case
                        when length(content) > 420
                          then substring(content from 1 for 420) || '...'
                        else content
                      end as excerpt,
                      (
                        greatest(0, 1 - distance)
                        + least(1, lexical_matches / %s)
                      )::float as score
                    from ranked_chunks
                    order by lexical_matches desc, distance asc, chunk_index asc
                    limit %s
                    """,
                    (
                        embedding,
                        query_tokens,
                        selected_document_ids,
                        token_count,
                        top_k,
                    ),
                )
                return [RetrievedChunkRecord(**row) for row in cur.fetchall()]

    def save_retrieval_job(
        self,
        *,
        topic: str,
        selected_document_ids: list[str],
        chunks: list[RetrievedChunkRecord],
    ) -> str:
        payload = {
            "topic": topic,
            "selected_document_ids": selected_document_ids,
            "top_k_returned": len(chunks),
        }
        context = [chunk.model_dump() for chunk in chunks]
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    insert into generation_jobs (
                      job_type,
                      status,
                      input,
                      retrieved_context
                    )
                    values ('retrieval', 'completed', %s::jsonb, %s::jsonb)
                    returning id::text
                    """,
                    (json.dumps(payload), json.dumps(context)),
                )
                row = cur.fetchone()
                if row is None:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Could not save retrieval job",
                    )
                return str(row["id"])


def get_knowledge_repository() -> KnowledgeRepository:
    return SupabaseKnowledgeRepository(_database_conninfo())


def course_outline_output_schema() -> dict[str, object]:
    session_schema: dict[str, object] = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "session_index": {"type": "integer", "minimum": 1},
            "title": {"type": "string", "minLength": 1},
            "learning_objectives": {
                "type": "array",
                "minItems": 1,
                "items": {"type": "string"},
            },
            "key_topics": {
                "type": "array",
                "minItems": 1,
                "items": {"type": "string"},
            },
            "teaching_activities": {
                "type": "array",
                "minItems": 1,
                "items": {"type": "string"},
            },
            "suggested_exercises": {
                "type": "array",
                "minItems": 1,
                "items": {"type": "string"},
            },
            "adaptation_notes": {"type": "string", "minLength": 1},
        },
        "required": [
            "session_index",
            "title",
            "learning_objectives",
            "key_topics",
            "teaching_activities",
            "suggested_exercises",
            "adaptation_notes",
        ],
    }
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "sessions": {
                "type": "array",
                "minItems": 1,
                "items": session_schema,
            }
        },
        "required": ["sessions"],
    }


def lesson_blocks_output_schema() -> dict[str, object]:
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "blocks": {
                "type": "array",
                "minItems": len(REQUIRED_DEMO_BLOCK_TYPES),
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "type": {
                            "type": "string",
                            "enum": list(REQUIRED_DEMO_BLOCK_TYPES),
                        },
                        "title": {"type": "string", "minLength": 1},
                        "content": {"type": "string", "minLength": 1},
                    },
                    "required": ["type", "title", "content"],
                },
            }
        },
        "required": ["blocks"],
    }


def lesson_block_regenerate_schema() -> dict[str, object]:
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "title": {"type": "string", "minLength": 1},
            "content": {"type": "string", "minLength": 1},
        },
        "required": ["title", "content"],
    }


class OpenAIResponsesProvider:
    def __init__(self, api_key: str, model: str) -> None:
        self.api_key = api_key
        self.model = model

    def _post_json(self, url: str, payload: dict[str, object]) -> dict[str, Any]:
        request = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:600]
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OpenAI request failed with status {exc.code}: {detail}",
            ) from exc
        except urllib.error.URLError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OpenAI request failed: {exc.reason}",
            ) from exc

    @staticmethod
    def _extract_responses_text(payload: dict[str, Any]) -> str:
        if isinstance(payload.get("output_text"), str):
            return str(payload["output_text"])

        text_parts: list[str] = []
        for item in payload.get("output", []):
            if not isinstance(item, dict):
                continue
            for content in item.get("content", []):
                if not isinstance(content, dict):
                    continue
                text = content.get("text")
                if isinstance(text, str):
                    text_parts.append(text)
        return "\n".join(text_parts).strip()

    def generate_structured(
        self,
        *,
        prompt: str,
        schema: dict[str, object],
        schema_name: str,
    ) -> dict[str, object]:
        payload = {
            "model": self.model,
            "instructions": (
                "You are TeachFlow AI. Return only valid JSON that matches "
                "the provided schema. Ground the outline in the supplied source excerpts."
            ),
            "input": prompt,
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": schema_name,
                    "schema": schema,
                    "strict": True,
                }
            },
        }
        try:
            response_payload = self._post_json("https://api.openai.com/v1/responses", payload)
            output_text = self._extract_responses_text(response_payload)
        except HTTPException as responses_error:
            chat_payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are TeachFlow AI. Return only valid JSON that matches "
                            "the provided schema. Ground the outline in the supplied source excerpts."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                        "name": schema_name,
                        "schema": schema,
                        "strict": True,
                    },
                },
            }
            try:
                chat_response = self._post_json(
                    "https://api.openai.com/v1/chat/completions",
                    chat_payload,
                )
                output_text = str(
                    chat_response["choices"][0]["message"].get("content", "")
                )
            except (KeyError, IndexError, TypeError, HTTPException) as chat_error:
                if isinstance(chat_error, HTTPException):
                    raise chat_error
                raise responses_error from chat_error

        try:
            parsed = json.loads(output_text)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="OpenAI returned non-JSON outline output",
            ) from exc
        if not isinstance(parsed, dict):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="OpenAI returned invalid outline shape",
            )
        return parsed

    def generate_text(self, prompt: str) -> str:
        payload = {"model": self.model, "input": prompt}
        response_payload = self._post_json("https://api.openai.com/v1/responses", payload)
        return self._extract_responses_text(response_payload)

    def embed_text(self, text: str) -> list[float]:
        return create_text_embedding(text)


def get_ai_provider() -> AIProvider:
    api_key = _env_value("OPENAI_API_KEY")
    if not api_key or api_key.lower().startswith("replace-"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY is not configured",
        )
    model = _env_value("OPENAI_MODEL") or "gpt-4o-mini"
    return OpenAIResponsesProvider(api_key=api_key, model=model)


def list_public_demo_accounts() -> list[PublicDemoAccount]:
    return [account.public for account in DEMO_ACCOUNTS]


def reset_demo_sessions_for_tests() -> None:
    ACTIVE_DEMO_SESSIONS.clear()


def reset_learning_store_for_tests() -> None:
    COURSES.clear()
    CLASSES.clear()
    CLASS_STUDENTS.clear()
    for key in STORE_COUNTERS:
        STORE_COUNTERS[key] = 0


def reset_outline_store_for_tests() -> None:
    COURSE_OUTLINES.clear()
    STORE_COUNTERS["outline"] = 0


def reset_lesson_store_for_tests() -> None:
    LESSON_SESSIONS.clear()
    STORE_COUNTERS["lesson"] = 0
    STORE_COUNTERS["block"] = 0


def create_session_token(user: UserProfile) -> str:
    token = token_urlsafe(32)
    ACTIVE_DEMO_SESSIONS[token] = user
    return token


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _next_id(prefix: str) -> str:
    STORE_COUNTERS[prefix] += 1
    return f"{prefix}-{STORE_COUNTERS[prefix]}"


def _auth_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise _auth_error()

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise _auth_error()

    return token.strip()


def authenticate_demo_user(credentials: LoginRequest) -> LoginResponse:
    account = DEMO_ACCOUNTS_BY_EMAIL.get(credentials.email.strip().lower())
    if account is None or credentials.password != account.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid demo account credentials",
        )

    user = UserProfile(**account.public.model_dump(exclude={"label"}))
    return LoginResponse(access_token=create_session_token(user), user=user)


def get_current_user_from_authorization(
    authorization: str | None,
) -> UserProfile:
    token = _extract_bearer_token(authorization)
    user = ACTIVE_DEMO_SESSIONS.get(token)
    if user is None:
        raise _auth_error()

    return user


def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> UserProfile:
    return get_current_user_from_authorization(authorization)


def require_role(user: UserProfile, allowed_roles: set[Role]) -> UserProfile:
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this workspace",
        )

    return user


def require_roles(*allowed_roles: Role):
    role_set = set(allowed_roles)

    def dependency(
        current_user: Annotated[UserProfile, Depends(get_current_user)],
    ) -> UserProfile:
        return require_role(current_user, role_set)

    return dependency


def build_dashboard_response(workspace: Role, user: UserProfile) -> DashboardResponse:
    dashboard = DASHBOARD_COPY[workspace]
    return DashboardResponse(
        workspace=workspace,
        title=str(dashboard["title"]),
        current_user=user,
        allowed_actions=list(dashboard["allowed_actions"]),
        hidden_actions=list(dashboard["hidden_actions"]),
        next_step=str(dashboard["next_step"]),
    )


def _not_found(message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)


def _student_profiles() -> list[UserProfile]:
    return [
        UserProfile(**account.public.model_dump(exclude={"label"}))
        for account in DEMO_ACCOUNTS
        if account.public.role == "student"
    ]


def _ensure_owned_course(course_id: str, teacher: UserProfile) -> CourseResponse:
    course = COURSES.get(course_id)
    if course is None or course.teacher_id != teacher.id:
        raise _not_found("Course not found")

    return course


def _ensure_owned_class(class_id: str, teacher: UserProfile) -> ClassProfileResponse:
    class_profile = CLASSES.get(class_id)
    if class_profile is None or class_profile.teacher_id != teacher.id:
        raise _not_found("Class not found")

    return class_profile


def list_courses(current_user: UserProfile) -> list[CourseResponse]:
    teacher = require_role(current_user, {"teacher"})
    return [
        course for course in COURSES.values() if course.teacher_id == teacher.id
    ]


def create_course(
    payload: CourseCreateRequest,
    current_user: UserProfile,
) -> CourseResponse:
    teacher = require_role(current_user, {"teacher"})
    now = _now_iso()
    course = CourseResponse(
        id=_next_id("course"),
        teacher_id=teacher.id,
        created_at=now,
        updated_at=now,
        **payload.model_dump(),
    )
    COURSES[course.id] = course
    return course


def list_course_classes(
    course_id: str,
    current_user: UserProfile,
) -> list[ClassProfileResponse]:
    teacher = require_role(current_user, {"teacher"})
    _ensure_owned_course(course_id, teacher)
    return [
        class_profile
        for class_profile in CLASSES.values()
        if class_profile.course_id == course_id
        and class_profile.teacher_id == teacher.id
    ]


def create_class_profile(
    course_id: str,
    payload: ClassCreateRequest,
    current_user: UserProfile,
) -> ClassProfileResponse:
    teacher = require_role(current_user, {"teacher"})
    _ensure_owned_course(course_id, teacher)
    now = _now_iso()
    class_profile = ClassProfileResponse(
        id=_next_id("class"),
        course_id=course_id,
        teacher_id=teacher.id,
        created_at=now,
        updated_at=now,
        **payload.model_dump(),
    )
    CLASSES[class_profile.id] = class_profile
    return class_profile


def list_available_students(current_user: UserProfile) -> list[UserProfile]:
    require_role(current_user, {"teacher"})
    return _student_profiles()


def add_student_to_class(
    class_id: str,
    payload: AddStudentRequest,
    current_user: UserProfile,
) -> ClassStudentResponse:
    teacher = require_role(current_user, {"teacher"})
    _ensure_owned_class(class_id, teacher)
    student_ids = {student.id for student in _student_profiles()}
    if payload.student_id not in student_ids:
        raise _not_found("Student not found")

    existing = next(
        (
            membership
            for membership in CLASS_STUDENTS.values()
            if membership.class_id == class_id
            and membership.student_id == payload.student_id
        ),
        None,
    )
    if existing is not None:
        return existing

    membership = ClassStudentResponse(
        id=_next_id("membership"),
        class_id=class_id,
        student_id=payload.student_id,
        added_by_teacher_id=teacher.id,
        created_at=_now_iso(),
    )
    CLASS_STUDENTS[membership.id] = membership
    return membership


def list_student_classes(current_user: UserProfile) -> list[StudentClassSummary]:
    student = require_role(current_user, {"student"})
    summaries: list[StudentClassSummary] = []

    for membership in CLASS_STUDENTS.values():
        if membership.student_id != student.id:
            continue

        class_profile = CLASSES.get(membership.class_id)
        if class_profile is None:
            continue

        course = COURSES.get(class_profile.course_id)
        if course is None:
            continue

        summaries.append(
            StudentClassSummary(
                class_id=class_profile.id,
                class_name=class_profile.name,
                course_id=course.id,
                course_title=course.title,
                teacher_id=course.teacher_id,
                student_level=class_profile.student_level,
                session_count=class_profile.session_count,
                minutes_per_session=class_profile.minutes_per_session,
            )
        )

    return summaries


def _class_ids_for_student(student: UserProfile) -> set[str]:
    return {
        membership.class_id
        for membership in CLASS_STUDENTS.values()
        if membership.student_id == student.id
    }


def list_student_published_lessons(
    current_user: UserProfile,
) -> list[LessonSessionResponse]:
    student = require_role(current_user, {"student"})
    class_ids = _class_ids_for_student(student)
    return sorted(
        (
            lesson
            for lesson in LESSON_SESSIONS.values()
            if lesson.status == "published" and lesson.class_id in class_ids
        ),
        key=lambda lesson: lesson.updated_at,
    )


def get_student_published_lesson(
    lesson_id: str,
    current_user: UserProfile,
) -> LessonSessionResponse:
    student = require_role(current_user, {"student"})
    lesson = LESSON_SESSIONS.get(lesson_id)
    if lesson is None or lesson.status != "published":
        raise _not_found("Lesson not found")
    if lesson.class_id not in _class_ids_for_student(student):
        raise _not_found("Lesson not found")
    return lesson


def _unique_preserving_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    unique_values: list[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        unique_values.append(value)
    return unique_values


def list_source_documents(
    current_user: UserProfile,
    repository: KnowledgeRepository,
) -> list[DocumentRecord]:
    require_role(current_user, {"teacher"})
    return repository.list_documents()


def retrieve_relevant_chunks(
    payload: RetrievalRequest,
    current_user: UserProfile,
    repository: KnowledgeRepository,
) -> RetrievalResponse:
    require_role(current_user, {"teacher"})
    selected_document_ids = _unique_preserving_order(payload.selected_document_ids)
    documents = repository.get_documents_by_ids(selected_document_ids)
    documents_by_id = {document.id: document for document in documents}
    missing_document_ids = [
        document_id
        for document_id in selected_document_ids
        if document_id not in documents_by_id
    ]
    unavailable_document_ids = [
        document.id for document in documents if document.status != "completed"
    ]

    if missing_document_ids or unavailable_document_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Only completed source documents can be retrieved",
                "missing_document_ids": missing_document_ids,
                "unavailable_document_ids": unavailable_document_ids,
            },
        )

    query_embedding = create_text_embedding(payload.topic)
    chunks = repository.search_chunks(
        topic=payload.topic,
        selected_document_ids=selected_document_ids,
        query_embedding=query_embedding,
        top_k=payload.top_k,
    )
    generation_job_id = repository.save_retrieval_job(
        topic=payload.topic,
        selected_document_ids=selected_document_ids,
        chunks=chunks,
    )
    return RetrievalResponse(
        topic=payload.topic,
        selected_document_ids=selected_document_ids,
        generation_job_id=generation_job_id,
        chunks=chunks,
    )


def _outline_not_found() -> HTTPException:
    return _not_found("Outline not found")


def build_outline_prompt(
    *,
    course: CourseResponse,
    class_profile: ClassProfileResponse,
    topic: str,
    chunks: list[RetrievedChunkRecord],
) -> str:
    source_lines = "\n".join(
        (
            f"- [{index}] {chunk.document_title}, page {chunk.page_number or 'n/a'}, "
            f"chunk {chunk.chunk_id}: {chunk.excerpt}"
        )
        for index, chunk in enumerate(chunks, start=1)
    )
    return f"""
Create a course outline for TeachFlow AI.

Course:
- Title: {course.title}
- Description: {course.description}
- Learning goals: {course.learning_goals}
- Teaching language: {course.teaching_language}

Class profile:
- Name: {class_profile.name}
- Student level: {class_profile.student_level}
- Background knowledge: {class_profile.background_knowledge}
- Session count: {class_profile.session_count}
- Minutes per session: {class_profile.minutes_per_session}
- Teaching style: {class_profile.teaching_style}

Topic focus: {topic}

Source excerpts:
{source_lines}

Rules:
- Return exactly {class_profile.session_count} sessions.
- Session indexes must run from 1 to {class_profile.session_count}.
- Keep all content grounded in the source excerpts.
- Use Vietnamese when the course teaching language is Vietnamese.
- Include adaptation_notes for the class student level.
""".strip()


def _validate_ai_outline(
    raw_output: dict[str, object],
    expected_session_count: int,
) -> CourseOutlineAIOutput:
    try:
        outline = CourseOutlineAIOutput.model_validate(raw_output)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI outline output failed schema validation",
        ) from exc

    if len(outline.sessions) != expected_session_count:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "AI outline output session count mismatch: "
                f"expected {expected_session_count}, got {len(outline.sessions)}"
            ),
        )

    expected_indexes = list(range(1, expected_session_count + 1))
    actual_indexes = [session.session_index for session in outline.sessions]
    if actual_indexes != expected_indexes:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI outline output session indexes are invalid",
        )

    return outline


def generate_course_outline(
    payload: CourseOutlineGenerateRequest,
    current_user: UserProfile,
    repository: KnowledgeRepository,
    ai_provider: AIProvider,
) -> CourseOutlineResponse:
    teacher = require_role(current_user, {"teacher"})
    course = _ensure_owned_course(payload.course_id, teacher)
    class_profile = _ensure_owned_class(payload.class_id, teacher)
    if class_profile.course_id != course.id:
        raise _not_found("Class not found")

    retrieval = retrieve_relevant_chunks(
        RetrievalRequest(
            topic=payload.topic,
            selected_document_ids=payload.selected_document_ids,
            top_k=payload.top_k,
        ),
        current_user=teacher,
        repository=repository,
    )
    if not retrieval.chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No source chunks found for selected documents",
        )

    prompt = build_outline_prompt(
        course=course,
        class_profile=class_profile,
        topic=payload.topic,
        chunks=retrieval.chunks,
    )
    raw_output = ai_provider.generate_structured(
        prompt=prompt,
        schema=course_outline_output_schema(),
        schema_name="course_outline",
    )
    ai_outline = _validate_ai_outline(raw_output, class_profile.session_count)
    source_references = retrieval.chunks[:3]
    sessions = [
        OutlineSessionResponse(
            **session.model_dump(),
            source_references=source_references,
        )
        for session in ai_outline.sessions
    ]
    now = _now_iso()
    outline = CourseOutlineResponse(
        id=_next_id("outline"),
        course_id=course.id,
        class_id=class_profile.id,
        teacher_id=teacher.id,
        topic=payload.topic,
        selected_document_ids=_unique_preserving_order(payload.selected_document_ids),
        generation_job_id=retrieval.generation_job_id,
        sessions=sessions,
        created_at=now,
        updated_at=now,
    )
    COURSE_OUTLINES[outline.id] = outline
    return outline


def list_course_outlines(
    class_id: str,
    current_user: UserProfile,
) -> list[CourseOutlineResponse]:
    teacher = require_role(current_user, {"teacher"})
    _ensure_owned_class(class_id, teacher)
    return [
        outline
        for outline in COURSE_OUTLINES.values()
        if outline.class_id == class_id and outline.teacher_id == teacher.id
    ]


def update_outline_session(
    outline_id: str,
    session_index: int,
    payload: OutlineSessionUpdateRequest,
    current_user: UserProfile,
) -> CourseOutlineResponse:
    teacher = require_role(current_user, {"teacher"})
    outline = COURSE_OUTLINES.get(outline_id)
    if outline is None or outline.teacher_id != teacher.id:
        raise _outline_not_found()

    updated_sessions: list[OutlineSessionResponse] = []
    did_update = False
    for session in outline.sessions:
        if session.session_index != session_index:
            updated_sessions.append(session)
            continue

        updated_sessions.append(
            OutlineSessionResponse(
                session_index=session.session_index,
                source_references=session.source_references,
                **payload.model_dump(),
            )
        )
        did_update = True

    if not did_update:
        raise _outline_not_found()

    updated_outline = outline.model_copy(
        update={"sessions": updated_sessions, "updated_at": _now_iso()}
    )
    COURSE_OUTLINES[outline.id] = updated_outline
    return updated_outline


def build_lesson_blocks_prompt(
    *,
    outline: CourseOutlineResponse,
    outline_session: OutlineSessionResponse,
    chunks: list[RetrievedChunkRecord],
) -> str:
    source_lines = "\n".join(
        (
            f"- [{index}] {chunk.document_title}, page {chunk.page_number or 'n/a'}, "
            f"chunk {chunk.chunk_id}: {chunk.excerpt}"
        )
        for index, chunk in enumerate(chunks, start=1)
    )
    return f"""
Create lesson blocks for TeachFlow AI.

Outline topic: {outline.topic}
Session {outline_session.session_index}: {outline_session.title}
Learning objectives:
{chr(10).join(f"- {item}" for item in outline_session.learning_objectives)}
Key topics:
{chr(10).join(f"- {item}" for item in outline_session.key_topics)}
Activities:
{chr(10).join(f"- {item}" for item in outline_session.teaching_activities)}
Exercises:
{chr(10).join(f"- {item}" for item in outline_session.suggested_exercises)}
Adaptation notes: {outline_session.adaptation_notes}

Source excerpts:
{source_lines}

Rules:
- Return exactly one block for each required type: {", ".join(REQUIRED_DEMO_BLOCK_TYPES)}.
- Keep content grounded in the source excerpts.
- Write in Vietnamese.
- Quiz block should include a question, answer options, and correct answer in content.
- Slide block should be concise and presentation-ready.
""".strip()


def _validate_lesson_blocks(raw_output: dict[str, object]) -> LessonBlocksAIOutput:
    try:
        lesson_blocks = LessonBlocksAIOutput.model_validate(raw_output)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI lesson blocks output failed schema validation",
        ) from exc

    block_types = [block.type for block in lesson_blocks.blocks]
    missing_types = [
        block_type
        for block_type in REQUIRED_DEMO_BLOCK_TYPES
        if block_type not in block_types
    ]
    if missing_types:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "message": "AI lesson blocks missing required block types",
                "missing_types": missing_types,
            },
        )

    ordered_blocks: list[LessonBlockDraft] = []
    for block_type in REQUIRED_DEMO_BLOCK_TYPES:
        for block in lesson_blocks.blocks:
            if block.type == block_type:
                ordered_blocks.append(block)
                break
    return LessonBlocksAIOutput(blocks=ordered_blocks)


def _ensure_owned_outline(outline_id: str, teacher: UserProfile) -> CourseOutlineResponse:
    outline = COURSE_OUTLINES.get(outline_id)
    if outline is None or outline.teacher_id != teacher.id:
        raise _outline_not_found()
    return outline


def _ensure_outline_session(
    outline: CourseOutlineResponse,
    session_index: int,
) -> OutlineSessionResponse:
    for session in outline.sessions:
        if session.session_index == session_index:
            return session
    raise _outline_not_found()


def generate_lesson_blocks(
    payload: LessonGenerateRequest,
    current_user: UserProfile,
    repository: KnowledgeRepository,
    ai_provider: AIProvider,
) -> LessonSessionResponse:
    teacher = require_role(current_user, {"teacher"})
    outline = _ensure_owned_outline(payload.outline_id, teacher)
    outline_session = _ensure_outline_session(outline, payload.session_index)

    retrieval_topic = " ".join([outline_session.title, *outline_session.key_topics])
    retrieval = retrieve_relevant_chunks(
        RetrievalRequest(
            topic=retrieval_topic,
            selected_document_ids=outline.selected_document_ids,
            top_k=payload.top_k,
        ),
        current_user=teacher,
        repository=repository,
    )
    prompt = build_lesson_blocks_prompt(
        outline=outline,
        outline_session=outline_session,
        chunks=retrieval.chunks,
    )
    raw_output = ai_provider.generate_structured(
        prompt=prompt,
        schema=lesson_blocks_output_schema(),
        schema_name="lesson_blocks",
    )
    ai_blocks = _validate_lesson_blocks(raw_output)
    citations = retrieval.chunks[:3]
    warning = (
        None
        if citations
        else "Nội dung này chưa được grounding đầy đủ từ tài liệu nguồn."
    )
    blocks = [
        LessonBlockResponse(
            id=_next_id("block"),
            type=block.type,
            title=block.title,
            content=block.content,
            order_index=index,
            status="needs_review",
            citations=citations,
            warning=warning,
        )
        for index, block in enumerate(ai_blocks.blocks, start=1)
    ]
    now = _now_iso()
    lesson = LessonSessionResponse(
        id=_next_id("lesson"),
        outline_id=outline.id,
        outline_session_index=outline_session.session_index,
        course_id=outline.course_id,
        class_id=outline.class_id,
        teacher_id=teacher.id,
        title=outline_session.title,
        status="teacher_reviewing",
        blocks=blocks,
        created_at=now,
        updated_at=now,
    )
    LESSON_SESSIONS[lesson.id] = lesson
    return lesson


def list_teacher_lessons(
    class_id: str,
    current_user: UserProfile,
) -> list[LessonSessionResponse]:
    teacher = require_role(current_user, {"teacher"})
    _ensure_owned_class(class_id, teacher)
    return sorted(
        (
            lesson
            for lesson in LESSON_SESSIONS.values()
            if lesson.teacher_id == teacher.id and lesson.class_id == class_id
        ),
        key=lambda lesson: lesson.updated_at,
        reverse=True,
    )


def _ensure_teacher_can_mutate_lesson(lesson: LessonSessionResponse) -> None:
    if lesson.status not in TEACHER_MUTABLE_LESSON_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lesson is locked for admin review or published access",
        )


def _find_lesson_and_block(
    block_id: str,
    teacher: UserProfile,
) -> tuple[LessonSessionResponse, LessonBlockResponse]:
    for lesson in LESSON_SESSIONS.values():
        if lesson.teacher_id != teacher.id:
            continue
        for block in lesson.blocks:
            if block.id == block_id:
                return lesson, block
    raise _not_found("Lesson block not found")


def _replace_lesson_block(
    lesson: LessonSessionResponse,
    updated_block: LessonBlockResponse,
) -> LessonSessionResponse:
    updated_blocks = [
        updated_block if block.id == updated_block.id else block
        for block in lesson.blocks
    ]
    updated_lesson = lesson.model_copy(
        update={"blocks": updated_blocks, "updated_at": _now_iso()}
    )
    LESSON_SESSIONS[lesson.id] = updated_lesson
    return updated_lesson


def update_lesson_block(
    block_id: str,
    payload: LessonBlockUpdateRequest,
    current_user: UserProfile,
) -> LessonSessionResponse:
    teacher = require_role(current_user, {"teacher"})
    lesson, block = _find_lesson_and_block(block_id, teacher)
    _ensure_teacher_can_mutate_lesson(lesson)
    block_changed = block.title != payload.title or block.content != payload.content
    update_payload = {"title": payload.title, "content": payload.content}
    if block_changed:
        update_payload["status"] = "needs_review"
    updated_block = block.model_copy(update=update_payload)
    return _replace_lesson_block(lesson, updated_block)


def set_lesson_block_status(
    block_id: str,
    payload: LessonBlockStatusRequest,
    current_user: UserProfile,
) -> LessonSessionResponse:
    teacher = require_role(current_user, {"teacher"})
    lesson, block = _find_lesson_and_block(block_id, teacher)
    _ensure_teacher_can_mutate_lesson(lesson)
    if payload.status == "approved_with_warning" and not block.warning:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="approve_with_warning requires a warning",
        )
    updated_block = block.model_copy(update={"status": payload.status})
    return _replace_lesson_block(lesson, updated_block)


def regenerate_lesson_block(
    block_id: str,
    current_user: UserProfile,
    ai_provider: AIProvider,
) -> LessonSessionResponse:
    teacher = require_role(current_user, {"teacher"})
    lesson, block = _find_lesson_and_block(block_id, teacher)
    _ensure_teacher_can_mutate_lesson(lesson)
    citation_context = "\n".join(
        f"- {citation.document_title}, page {citation.page_number or 'n/a'}: {citation.excerpt}"
        for citation in block.citations
    )
    prompt = f"""
Regenerate one TeachFlow AI lesson block.

Block type: {block.type}
Current title: {block.title}
Current content: {block.content}

Source excerpts:
{citation_context}

Rules:
- Return a better title and content for only this block.
- Keep the same block type.
- Ground the content in the source excerpts.
- Write in Vietnamese.
""".strip()
    raw_output = ai_provider.generate_structured(
        prompt=prompt,
        schema=lesson_block_regenerate_schema(),
        schema_name="lesson_block_regenerate",
    )
    try:
        regenerated = LessonBlockRegenerateAIOutput.model_validate(raw_output)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI regenerated block failed schema validation",
        ) from exc
    updated_block = block.model_copy(
        update={
            "title": regenerated.title,
            "content": regenerated.content,
            "status": "needs_review",
        }
    )
    return _replace_lesson_block(lesson, updated_block)


def submit_lesson_for_admin(
    lesson_id: str,
    current_user: UserProfile,
) -> LessonSessionResponse:
    teacher = require_role(current_user, {"teacher"})
    lesson = LESSON_SESSIONS.get(lesson_id)
    if lesson is None or lesson.teacher_id != teacher.id:
        raise _not_found("Lesson not found")
    if lesson.status not in TEACHER_MUTABLE_LESSON_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lesson cannot be submitted from its current status",
        )
    needs_review_count = sum(
        1 for block in lesson.blocks if block.status == "needs_review"
    )
    if needs_review_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot submit lesson while blocks still need review",
        )
    submitted = lesson.model_copy(
        update={"status": "submitted_for_admin_review", "updated_at": _now_iso()}
    )
    LESSON_SESSIONS[lesson.id] = submitted
    return submitted


def list_admin_review_queue(
    current_user: UserProfile,
) -> list[LessonSessionResponse]:
    require_role(current_user, {"admin"})
    return sorted(
        (
            lesson
            for lesson in LESSON_SESSIONS.values()
            if lesson.status == "submitted_for_admin_review"
        ),
        key=lambda lesson: lesson.updated_at,
    )


def _ensure_submitted_lesson_for_admin(lesson_id: str) -> LessonSessionResponse:
    lesson = LESSON_SESSIONS.get(lesson_id)
    if lesson is None:
        raise _not_found("Lesson not found")
    if lesson.status != "submitted_for_admin_review":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lesson is not submitted for admin review",
        )
    return lesson


def publish_lesson_for_admin(
    lesson_id: str,
    current_user: UserProfile,
) -> LessonSessionResponse:
    require_role(current_user, {"admin"})
    lesson = _ensure_submitted_lesson_for_admin(lesson_id)
    if any(block.status == "needs_review" for block in lesson.blocks):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot publish lesson while blocks still need review",
        )
    published = lesson.model_copy(
        update={
            "status": "published",
            "admin_feedback": None,
            "updated_at": _now_iso(),
        }
    )
    LESSON_SESSIONS[lesson.id] = published
    return published


def request_lesson_changes_for_admin(
    lesson_id: str,
    payload: AdminFeedbackRequest,
    current_user: UserProfile,
) -> LessonSessionResponse:
    require_role(current_user, {"admin"})
    lesson = _ensure_submitted_lesson_for_admin(lesson_id)
    changed = lesson.model_copy(
        update={
            "status": "changes_requested",
            "admin_feedback": payload.feedback,
            "updated_at": _now_iso(),
        }
    )
    LESSON_SESSIONS[lesson.id] = changed
    return changed


app = FastAPI(
    title="TeachFlow AI API",
    version=APP_VERSION,
    docs_url=f"{API_BASE_PATH}/docs",
    openapi_url=f"{API_BASE_PATH}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(f"{API_BASE_PATH}/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "teachflow-api",
        "version": APP_VERSION,
        "timestamp": datetime.now(UTC).isoformat(),
    }


@app.get(
    f"{API_BASE_PATH}/auth/demo-accounts",
    response_model=list[PublicDemoAccount],
)
def demo_accounts() -> list[PublicDemoAccount]:
    return list_public_demo_accounts()


@app.post(f"{API_BASE_PATH}/auth/login", response_model=LoginResponse)
def login(credentials: LoginRequest) -> LoginResponse:
    return authenticate_demo_user(credentials)


@app.post(f"{API_BASE_PATH}/auth/logout", response_model=MessageResponse)
def logout(
    authorization: Annotated[str | None, Header()] = None,
) -> MessageResponse:
    token = _extract_bearer_token(authorization)
    if token not in ACTIVE_DEMO_SESSIONS:
        raise _auth_error()

    ACTIVE_DEMO_SESSIONS.pop(token)
    return MessageResponse(message="Logged out")


@app.get(f"{API_BASE_PATH}/me", response_model=UserProfile)
def me(
    current_user: Annotated[UserProfile, Depends(get_current_user)],
) -> UserProfile:
    return current_user


@app.get(f"{API_BASE_PATH}/students", response_model=list[UserProfile])
def students(
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> list[UserProfile]:
    return list_available_students(current_user)


@app.get(f"{API_BASE_PATH}/courses", response_model=list[CourseResponse])
def courses(
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> list[CourseResponse]:
    return list_courses(current_user)


@app.post(f"{API_BASE_PATH}/courses", response_model=CourseResponse)
def create_course_route(
    payload: CourseCreateRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> CourseResponse:
    return create_course(payload, current_user)


@app.get(
    f"{API_BASE_PATH}/courses/{{course_id}}/classes",
    response_model=list[ClassProfileResponse],
)
def course_classes(
    course_id: str,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> list[ClassProfileResponse]:
    return list_course_classes(course_id, current_user)


@app.post(
    f"{API_BASE_PATH}/courses/{{course_id}}/classes",
    response_model=ClassProfileResponse,
)
def create_class_profile_route(
    course_id: str,
    payload: ClassCreateRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> ClassProfileResponse:
    return create_class_profile(course_id, payload, current_user)


@app.post(
    f"{API_BASE_PATH}/classes/{{class_id}}/students",
    response_model=ClassStudentResponse,
)
def class_students(
    class_id: str,
    payload: AddStudentRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> ClassStudentResponse:
    return add_student_to_class(class_id, payload, current_user)


@app.get(
    f"{API_BASE_PATH}/student/classes",
    response_model=list[StudentClassSummary],
)
def student_classes(
    current_user: Annotated[UserProfile, Depends(require_roles("student"))],
) -> list[StudentClassSummary]:
    return list_student_classes(current_user)


@app.get(
    f"{API_BASE_PATH}/student/lessons",
    response_model=list[LessonSessionResponse],
)
def student_lessons(
    current_user: Annotated[UserProfile, Depends(require_roles("student"))],
) -> list[LessonSessionResponse]:
    return list_student_published_lessons(current_user)


@app.get(
    f"{API_BASE_PATH}/student/lessons/{{lesson_id}}",
    response_model=LessonSessionResponse,
)
def student_lesson_detail(
    lesson_id: str,
    current_user: Annotated[UserProfile, Depends(require_roles("student"))],
) -> LessonSessionResponse:
    return get_student_published_lesson(lesson_id, current_user)


@app.get(
    f"{API_BASE_PATH}/teacher/lessons",
    response_model=list[LessonSessionResponse],
)
def teacher_lessons(
    class_id: str,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> list[LessonSessionResponse]:
    return list_teacher_lessons(class_id, current_user)


@app.get(f"{API_BASE_PATH}/documents", response_model=list[DocumentRecord])
def documents(
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
    repository: Annotated[KnowledgeRepository, Depends(get_knowledge_repository)],
) -> list[DocumentRecord]:
    return list_source_documents(current_user, repository)


@app.post(f"{API_BASE_PATH}/rag/retrieve", response_model=RetrievalResponse)
def rag_retrieve(
    payload: RetrievalRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
    repository: Annotated[KnowledgeRepository, Depends(get_knowledge_repository)],
) -> RetrievalResponse:
    return retrieve_relevant_chunks(payload, current_user, repository)


@app.get(f"{API_BASE_PATH}/outlines", response_model=list[CourseOutlineResponse])
def outlines(
    class_id: str,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> list[CourseOutlineResponse]:
    return list_course_outlines(class_id, current_user)


@app.post(f"{API_BASE_PATH}/outlines/generate", response_model=CourseOutlineResponse)
def generate_outline_route(
    payload: CourseOutlineGenerateRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
    repository: Annotated[KnowledgeRepository, Depends(get_knowledge_repository)],
    ai_provider: Annotated[AIProvider, Depends(get_ai_provider)],
) -> CourseOutlineResponse:
    return generate_course_outline(payload, current_user, repository, ai_provider)


@app.patch(
    f"{API_BASE_PATH}/outlines/{{outline_id}}/sessions/{{session_index}}",
    response_model=CourseOutlineResponse,
)
def update_outline_session_route(
    outline_id: str,
    session_index: int,
    payload: OutlineSessionUpdateRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> CourseOutlineResponse:
    return update_outline_session(outline_id, session_index, payload, current_user)


@app.post(f"{API_BASE_PATH}/lessons/generate", response_model=LessonSessionResponse)
def generate_lesson_route(
    payload: LessonGenerateRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
    repository: Annotated[KnowledgeRepository, Depends(get_knowledge_repository)],
    ai_provider: Annotated[AIProvider, Depends(get_ai_provider)],
) -> LessonSessionResponse:
    return generate_lesson_blocks(payload, current_user, repository, ai_provider)


@app.patch(f"{API_BASE_PATH}/lesson-blocks/{{block_id}}", response_model=LessonSessionResponse)
def update_lesson_block_route(
    block_id: str,
    payload: LessonBlockUpdateRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> LessonSessionResponse:
    return update_lesson_block(block_id, payload, current_user)


@app.post(
    f"{API_BASE_PATH}/lesson-blocks/{{block_id}}/status",
    response_model=LessonSessionResponse,
)
def set_lesson_block_status_route(
    block_id: str,
    payload: LessonBlockStatusRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> LessonSessionResponse:
    return set_lesson_block_status(block_id, payload, current_user)


@app.post(
    f"{API_BASE_PATH}/lesson-blocks/{{block_id}}/regenerate",
    response_model=LessonSessionResponse,
)
def regenerate_lesson_block_route(
    block_id: str,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
    ai_provider: Annotated[AIProvider, Depends(get_ai_provider)],
) -> LessonSessionResponse:
    return regenerate_lesson_block(block_id, current_user, ai_provider)


@app.post(
    f"{API_BASE_PATH}/lessons/{{lesson_id}}/submit",
    response_model=LessonSessionResponse,
)
def submit_lesson_route(
    lesson_id: str,
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> LessonSessionResponse:
    return submit_lesson_for_admin(lesson_id, current_user)


@app.get(
    f"{API_BASE_PATH}/admin/review-queue",
    response_model=list[LessonSessionResponse],
)
def admin_review_queue_route(
    current_user: Annotated[UserProfile, Depends(require_roles("admin"))],
) -> list[LessonSessionResponse]:
    return list_admin_review_queue(current_user)


@app.post(
    f"{API_BASE_PATH}/admin/lessons/{{lesson_id}}/publish",
    response_model=LessonSessionResponse,
)
def admin_publish_lesson_route(
    lesson_id: str,
    current_user: Annotated[UserProfile, Depends(require_roles("admin"))],
) -> LessonSessionResponse:
    return publish_lesson_for_admin(lesson_id, current_user)


@app.post(
    f"{API_BASE_PATH}/admin/lessons/{{lesson_id}}/request-changes",
    response_model=LessonSessionResponse,
)
def admin_request_changes_route(
    lesson_id: str,
    payload: AdminFeedbackRequest,
    current_user: Annotated[UserProfile, Depends(require_roles("admin"))],
) -> LessonSessionResponse:
    return request_lesson_changes_for_admin(lesson_id, payload, current_user)


@app.get(f"{API_BASE_PATH}/admin/dashboard", response_model=DashboardResponse)
def admin_dashboard(
    current_user: Annotated[UserProfile, Depends(require_roles("admin"))],
) -> DashboardResponse:
    return build_dashboard_response("admin", current_user)


@app.get(f"{API_BASE_PATH}/teacher/dashboard", response_model=DashboardResponse)
def teacher_dashboard(
    current_user: Annotated[UserProfile, Depends(require_roles("teacher"))],
) -> DashboardResponse:
    return build_dashboard_response("teacher", current_user)


@app.get(f"{API_BASE_PATH}/student/dashboard", response_model=DashboardResponse)
def student_dashboard(
    current_user: Annotated[UserProfile, Depends(require_roles("student"))],
) -> DashboardResponse:
    return build_dashboard_response("student", current_user)
