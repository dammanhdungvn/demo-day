from __future__ import annotations

from typing import Protocol

from .schemas import (
    ClassCreateRequest,
    ClassProfileResponse,
    ClassStudentResponse,
    ClassUpdateRequest,
    CourseCreateRequest,
    CourseResponse,
)


class LearningRepository(Protocol):
    def get_course(self, course_id: str) -> CourseResponse | None: ...

    def list_courses_for_teacher(
        self,
        teacher_id: str,
        organization_id: str | None = None,
    ) -> list[CourseResponse]: ...

    def create_course(
        self,
        *,
        payload: CourseCreateRequest,
        teacher_id: str,
        organization_id: str,
    ) -> CourseResponse: ...

    def get_class(self, class_id: str) -> ClassProfileResponse | None: ...

    def list_classes_for_course(
        self,
        *,
        course_id: str,
        teacher_id: str,
        organization_id: str | None = None,
    ) -> list[ClassProfileResponse]: ...

    def create_class_profile(
        self,
        *,
        course_id: str,
        teacher_id: str,
        organization_id: str,
        payload: ClassCreateRequest,
    ) -> ClassProfileResponse: ...

    def update_class_profile(
        self,
        *,
        class_id: str,
        payload: ClassUpdateRequest,
    ) -> ClassProfileResponse: ...

    def archive_class_profile(self, class_id: str) -> ClassProfileResponse: ...

    def get_class_student(
        self,
        *,
        class_id: str,
        student_id: str,
    ) -> ClassStudentResponse | None: ...

    def add_student_to_class(
        self,
        *,
        class_id: str,
        student_id: str,
        added_by_teacher_id: str,
    ) -> ClassStudentResponse: ...

    def list_memberships_for_student(
        self,
        student_id: str,
        organization_id: str | None = None,
    ) -> list[ClassStudentResponse]: ...

    def list_memberships_for_class(
        self,
        class_id: str,
    ) -> list[ClassStudentResponse]: ...
