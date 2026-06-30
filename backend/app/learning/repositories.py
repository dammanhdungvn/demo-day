from __future__ import annotations

import os
from typing import Any, Literal

from fastapi import HTTPException, status
import psycopg
from psycopg.rows import dict_row

from ..core.config import _database_conninfo
from ..core.security import _entity_organization_id
from ..core.time import _now_iso
from .ports import LearningRepository
from .schemas import (
    ClassCreateRequest,
    ClassProfileResponse,
    ClassStudentResponse,
    CourseCreateRequest,
    CourseResponse,
)


def learning_schema_sql() -> str:
    return """
    create table if not exists courses (
      id uuid primary key default gen_random_uuid(),
      teacher_id text not null,
      organization_id text not null default 'org-demo',
      title text not null,
      description text not null,
      learning_goals text not null,
      teaching_language text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists classes (
      id uuid primary key default gen_random_uuid(),
      course_id uuid not null references courses(id) on delete cascade,
      teacher_id text not null,
      organization_id text not null default 'org-demo',
      name text not null,
      student_level text not null check (student_level in ('weak', 'average', 'strong')),
      background_knowledge text not null,
      session_count integer not null check (session_count between 1 and 100),
      minutes_per_session integer not null check (minutes_per_session between 1 and 300),
      teaching_style text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists class_students (
      id uuid primary key default gen_random_uuid(),
      class_id uuid not null references classes(id) on delete cascade,
      student_id text not null,
      added_by_teacher_id text not null,
      created_at timestamptz not null default now(),
      unique (class_id, student_id)
    );

    alter table courses add column if not exists organization_id text;
    update courses set organization_id = 'org-demo' where organization_id is null;
    alter table courses alter column organization_id set default 'org-demo';
    alter table courses alter column organization_id set not null;

    alter table classes add column if not exists organization_id text;
    update classes
    set organization_id = coalesce(
      classes.organization_id,
      (
        select courses.organization_id
        from courses
        where courses.id = classes.course_id
      ),
      'org-demo'
    )
    where organization_id is null;
    alter table classes alter column organization_id set default 'org-demo';
    alter table classes alter column organization_id set not null;

    create index if not exists idx_courses_teacher_id on courses (teacher_id);
    create index if not exists idx_courses_org_teacher on courses (organization_id, teacher_id);
    create index if not exists idx_classes_course_teacher on classes (course_id, teacher_id);
    create index if not exists idx_classes_org_course_teacher on classes (organization_id, course_id, teacher_id);
    create index if not exists idx_class_students_student_id on class_students (student_id);

    alter table courses enable row level security;
    alter table classes enable row level security;
    alter table class_students enable row level security;

    revoke all on table courses from anon, authenticated;
    revoke all on table classes from anon, authenticated;
    revoke all on table class_students from anon, authenticated;
    """


class InMemoryLearningRepository:
    def __init__(
        self,
        *,
        courses: dict[str, CourseResponse] | None = None,
        classes: dict[str, ClassProfileResponse] | None = None,
        memberships: dict[str, ClassStudentResponse] | None = None,
        counters: dict[str, int] | None = None,
    ) -> None:
        self.courses = courses if courses is not None else {}
        self.classes = classes if classes is not None else {}
        self.memberships = memberships if memberships is not None else {}
        self.counters = counters if counters is not None else {
            "course": 0,
            "class": 0,
            "membership": 0,
        }

    def reset(self) -> None:
        self.courses.clear()
        self.classes.clear()
        self.memberships.clear()
        for key in self.counters:
            self.counters[key] = 0

    def _next_id(self, prefix: Literal["course", "class", "membership"]) -> str:
        self.counters[prefix] = self.counters.get(prefix, 0) + 1
        return f"{prefix}-{self.counters[prefix]}"

    def get_course(self, course_id: str) -> CourseResponse | None:
        return self.courses.get(course_id)

    def list_courses_for_teacher(
        self,
        teacher_id: str,
        organization_id: str | None = None,
    ) -> list[CourseResponse]:
        return [
            course
            for course in self.courses.values()
            if course.teacher_id == teacher_id
            and (
                organization_id is None
                or _entity_organization_id(course.organization_id) == organization_id
            )
        ]

    def create_course(
        self,
        *,
        payload: CourseCreateRequest,
        teacher_id: str,
        organization_id: str,
    ) -> CourseResponse:
        now = _now_iso()
        course = CourseResponse(
            id=self._next_id("course"),
            teacher_id=teacher_id,
            organization_id=organization_id,
            created_at=now,
            updated_at=now,
            **payload.model_dump(),
        )
        self.courses[course.id] = course
        return course

    def get_class(self, class_id: str) -> ClassProfileResponse | None:
        return self.classes.get(class_id)

    def list_classes_for_course(
        self,
        *,
        course_id: str,
        teacher_id: str,
        organization_id: str | None = None,
    ) -> list[ClassProfileResponse]:
        return [
            class_profile
            for class_profile in self.classes.values()
            if class_profile.course_id == course_id
            and class_profile.teacher_id == teacher_id
            and (
                organization_id is None
                or _entity_organization_id(class_profile.organization_id)
                == organization_id
            )
        ]

    def create_class_profile(
        self,
        *,
        course_id: str,
        teacher_id: str,
        organization_id: str,
        payload: ClassCreateRequest,
    ) -> ClassProfileResponse:
        now = _now_iso()
        class_profile = ClassProfileResponse(
            id=self._next_id("class"),
            course_id=course_id,
            teacher_id=teacher_id,
            organization_id=organization_id,
            created_at=now,
            updated_at=now,
            **payload.model_dump(),
        )
        self.classes[class_profile.id] = class_profile
        return class_profile

    def get_class_student(
        self,
        *,
        class_id: str,
        student_id: str,
    ) -> ClassStudentResponse | None:
        return next(
            (
                membership
                for membership in self.memberships.values()
                if membership.class_id == class_id
                and membership.student_id == student_id
            ),
            None,
        )

    def add_student_to_class(
        self,
        *,
        class_id: str,
        student_id: str,
        added_by_teacher_id: str,
    ) -> ClassStudentResponse:
        existing = self.get_class_student(class_id=class_id, student_id=student_id)
        if existing is not None:
            return existing

        membership = ClassStudentResponse(
            id=self._next_id("membership"),
            class_id=class_id,
            student_id=student_id,
            added_by_teacher_id=added_by_teacher_id,
            created_at=_now_iso(),
        )
        self.memberships[membership.id] = membership
        return membership

    def list_memberships_for_student(
        self,
        student_id: str,
        organization_id: str | None = None,
    ) -> list[ClassStudentResponse]:
        return [
            membership
            for membership in self.memberships.values()
            if membership.student_id == student_id
            and (
                organization_id is None
                or (
                    (class_profile := self.classes.get(membership.class_id))
                    is not None
                    and _entity_organization_id(class_profile.organization_id)
                    == organization_id
                )
            )
        ]

    def list_memberships_for_class(
        self,
        class_id: str,
    ) -> list[ClassStudentResponse]:
        return [
            membership
            for membership in self.memberships.values()
            if membership.class_id == class_id
        ]


class PostgresLearningRepository:
    def __init__(self, conninfo: str) -> None:
        self.conninfo = conninfo

    def _connect(self) -> psycopg.Connection[dict[str, Any]]:
        return psycopg.connect(
            self.conninfo,
            connect_timeout=20,
            prepare_threshold=None,
            row_factory=dict_row,
        )

    def ensure_schema(self) -> None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(learning_schema_sql())

    def get_course(self, course_id: str) -> CourseResponse | None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      id::text,
                      teacher_id,
                      organization_id,
                      title,
                      description,
                      learning_goals,
                      teaching_language,
                      created_at::text,
                      updated_at::text
                    from courses
                    where id = %s::uuid
                    """,
                    (course_id,),
                )
                row = cur.fetchone()
                return CourseResponse(**row) if row is not None else None

    def list_courses_for_teacher(
        self,
        teacher_id: str,
        organization_id: str | None = None,
    ) -> list[CourseResponse]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      id::text,
                      teacher_id,
                      organization_id,
                      title,
                      description,
                      learning_goals,
                      teaching_language,
                      created_at::text,
                      updated_at::text
                    from courses
                    where teacher_id = %s
                      and (%s::text is null or organization_id = %s)
                    order by created_at asc
                    """,
                    (teacher_id, organization_id, organization_id),
                )
                return [CourseResponse(**row) for row in cur.fetchall()]

    def create_course(
        self,
        *,
        payload: CourseCreateRequest,
        teacher_id: str,
        organization_id: str,
    ) -> CourseResponse:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    insert into courses (
                      teacher_id,
                      organization_id,
                      title,
                      description,
                      learning_goals,
                      teaching_language,
                      updated_at
                    )
                    values (%s, %s, %s, %s, %s, %s, now())
                    returning
                      id::text,
                      teacher_id,
                      organization_id,
                      title,
                      description,
                      learning_goals,
                      teaching_language,
                      created_at::text,
                      updated_at::text
                    """,
                    (
                        teacher_id,
                        organization_id,
                        payload.title,
                        payload.description,
                        payload.learning_goals,
                        payload.teaching_language,
                    ),
                )
                row = cur.fetchone()
                if row is None:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Could not create course",
                    )
                return CourseResponse(**row)

    def get_class(self, class_id: str) -> ClassProfileResponse | None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      id::text,
                      course_id::text,
                      teacher_id,
                      organization_id,
                      name,
                      student_level,
                      background_knowledge,
                      session_count,
                      minutes_per_session,
                      teaching_style,
                      created_at::text,
                      updated_at::text
                    from classes
                    where id = %s::uuid
                    """,
                    (class_id,),
                )
                row = cur.fetchone()
                return ClassProfileResponse(**row) if row is not None else None

    def list_classes_for_course(
        self,
        *,
        course_id: str,
        teacher_id: str,
        organization_id: str | None = None,
    ) -> list[ClassProfileResponse]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      id::text,
                      course_id::text,
                      teacher_id,
                      organization_id,
                      name,
                      student_level,
                      background_knowledge,
                      session_count,
                      minutes_per_session,
                      teaching_style,
                      created_at::text,
                      updated_at::text
                    from classes
                    where course_id = %s::uuid
                      and teacher_id = %s
                      and (%s::text is null or organization_id = %s)
                    order by created_at asc
                    """,
                    (course_id, teacher_id, organization_id, organization_id),
                )
                return [ClassProfileResponse(**row) for row in cur.fetchall()]

    def create_class_profile(
        self,
        *,
        course_id: str,
        teacher_id: str,
        organization_id: str,
        payload: ClassCreateRequest,
    ) -> ClassProfileResponse:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    insert into classes (
                      course_id,
                      teacher_id,
                      organization_id,
                      name,
                      student_level,
                      background_knowledge,
                      session_count,
                      minutes_per_session,
                      teaching_style,
                      updated_at
                    )
                    values (%s::uuid, %s, %s, %s, %s, %s, %s, %s, %s, now())
                    returning
                      id::text,
                      course_id::text,
                      teacher_id,
                      organization_id,
                      name,
                      student_level,
                      background_knowledge,
                      session_count,
                      minutes_per_session,
                      teaching_style,
                      created_at::text,
                      updated_at::text
                    """,
                    (
                        course_id,
                        teacher_id,
                        organization_id,
                        payload.name,
                        payload.student_level,
                        payload.background_knowledge,
                        payload.session_count,
                        payload.minutes_per_session,
                        payload.teaching_style,
                    ),
                )
                row = cur.fetchone()
                if row is None:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Could not create class",
                    )
                return ClassProfileResponse(**row)

    def get_class_student(
        self,
        *,
        class_id: str,
        student_id: str,
    ) -> ClassStudentResponse | None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      id::text,
                      class_id::text,
                      student_id,
                      added_by_teacher_id,
                      created_at::text
                    from class_students
                    where class_id = %s::uuid
                      and student_id = %s
                    """,
                    (class_id, student_id),
                )
                row = cur.fetchone()
                return ClassStudentResponse(**row) if row is not None else None

    def add_student_to_class(
        self,
        *,
        class_id: str,
        student_id: str,
        added_by_teacher_id: str,
    ) -> ClassStudentResponse:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    insert into class_students (
                      class_id,
                      student_id,
                      added_by_teacher_id
                    )
                    values (%s::uuid, %s, %s)
                    on conflict (class_id, student_id) do update
                    set student_id = excluded.student_id
                    returning
                      id::text,
                      class_id::text,
                      student_id,
                      added_by_teacher_id,
                      created_at::text
                    """,
                    (class_id, student_id, added_by_teacher_id),
                )
                row = cur.fetchone()
                if row is None:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Could not add student to class",
                    )
                return ClassStudentResponse(**row)

    def list_memberships_for_student(
        self,
        student_id: str,
        organization_id: str | None = None,
    ) -> list[ClassStudentResponse]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      cs.id::text,
                      cs.class_id::text,
                      cs.student_id,
                      cs.added_by_teacher_id,
                      cs.created_at::text
                    from class_students cs
                    join classes c on c.id = cs.class_id
                    where cs.student_id = %s
                      and (%s::text is null or c.organization_id = %s)
                    order by cs.created_at asc
                    """,
                    (student_id, organization_id, organization_id),
                )
                return [ClassStudentResponse(**row) for row in cur.fetchall()]

    def list_memberships_for_class(
        self,
        class_id: str,
    ) -> list[ClassStudentResponse]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select
                      id::text,
                      class_id::text,
                      student_id,
                      added_by_teacher_id,
                      created_at::text
                    from class_students
                    where class_id = %s::uuid
                    order by created_at asc
                    """,
                    (class_id,),
                )
                return [ClassStudentResponse(**row) for row in cur.fetchall()]


MEMORY_LEARNING_REPOSITORY = InMemoryLearningRepository()


def get_learning_repository(*, ensure_schema: bool = True) -> LearningRepository:
    mode = os.getenv("LEARNING_REPOSITORY", "memory").strip().lower()
    if mode == "memory":
        return MEMORY_LEARNING_REPOSITORY
    if mode == "postgres":
        repository = PostgresLearningRepository(_database_conninfo())
        if ensure_schema:
            repository.ensure_schema()
        return repository
    raise RuntimeError("LEARNING_REPOSITORY must be either 'memory' or 'postgres'")
