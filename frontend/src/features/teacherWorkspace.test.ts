import { describe, expect, it } from 'vitest'
import type {
  Course,
  ClassProfile,
  LessonSession,
  SourceDocument,
} from '../api/learning'
import {
  buildTeacherFirstLessonGuide,
  buildTeacherWorkflowSteps,
  buildTeacherWorkspaceMetrics,
} from './teacherWorkspace'

const course: Course = {
  id: 'course-1',
  teacher_id: 'teacher-1',
  title: 'AI',
  description: 'Course',
  learning_goals: 'Learn',
  teaching_language: 'Vietnamese',
  created_at: '2026-06-28T00:00:00+00:00',
  updated_at: '2026-06-28T00:00:00+00:00',
}

const classProfile: ClassProfile = {
  id: 'class-1',
  course_id: course.id,
  teacher_id: 'teacher-1',
  name: 'KTPM',
  student_level: 'average',
  background_knowledge: 'Basic',
  session_count: 12,
  minutes_per_session: 90,
  teaching_style: 'Workshop',
  created_at: course.created_at,
  updated_at: course.updated_at,
}

const documents: SourceDocument[] = [
  {
    id: 'doc-1',
    title: 'Completed',
    file_name: 'completed.pdf',
    file_hash: 'hash-1',
    source_type: 'pdf',
    status: 'completed',
    knowledge_scope: 'contextual',
    owner_user_id: 'teacher-1',
    chunk_count: 12,
    last_ingested_at: course.created_at,
    error_message: null,
    is_active: true,
    created_at: course.created_at,
    updated_at: course.updated_at,
  },
  {
    id: 'doc-2',
    title: 'Failed',
    file_name: 'failed.pdf',
    file_hash: 'hash-2',
    source_type: 'pdf',
    status: 'failed',
    knowledge_scope: 'contextual',
    owner_user_id: 'teacher-1',
    chunk_count: 0,
    last_ingested_at: null,
    error_message: 'failed',
    is_active: true,
    created_at: course.created_at,
    updated_at: course.updated_at,
  },
  {
    id: 'doc-3',
    title: 'Archived',
    file_name: 'archived.pdf',
    file_hash: 'hash-3',
    source_type: 'pdf',
    status: 'completed',
    knowledge_scope: 'contextual',
    owner_user_id: 'teacher-1',
    chunk_count: 8,
    last_ingested_at: course.created_at,
    error_message: null,
    is_active: false,
    created_at: course.created_at,
    updated_at: course.updated_at,
  },
]

const lesson: LessonSession = {
  id: 'lesson-1',
  outline_id: 'outline-1',
  outline_session_index: 1,
  course_id: course.id,
  class_id: classProfile.id,
  teacher_id: 'teacher-1',
  title: 'Lesson',
  status: 'submitted_for_admin_review',
  admin_feedback: null,
  created_at: course.created_at,
  updated_at: course.updated_at,
  blocks: [
    {
      id: 'block-1',
      type: 'learning_objectives',
      title: 'Objectives',
      content: 'Content',
      order_index: 1,
      status: 'approved',
      citations: [
        {
          chunk_id: 'chunk-1',
          document_id: 'doc-1',
          document_title: 'Completed',
          page_number: 1,
          chunk_index: 1,
          excerpt: 'Evidence',
          score: 0.9,
        },
      ],
      warning: null,
    },
    {
      id: 'block-2',
      type: 'slide',
      title: 'Slide',
      content: 'Content',
      order_index: 2,
      status: 'needs_review',
      citations: [],
      warning: 'Canh bao',
    },
  ],
}

describe('teacher workspace helpers', () => {
  it('builds metrics from lesson and source state without fake data', () => {
    expect(
      buildTeacherWorkspaceMetrics({
        documents,
        selectedDocumentIds: ['doc-1', 'doc-2', 'doc-3'],
        lesson,
      }),
    ).toEqual({
      citationCoveragePercent: 50,
      reviewedBlocks: 1,
      totalBlocks: 2,
      warningCount: 1,
      pendingAdminCount: 1,
      completedSourceCount: 1,
      selectedSourceCount: 1,
    })
  })

  it('builds workflow steps from real state', () => {
    const steps = buildTeacherWorkflowSteps({
      courses: [course],
      classes: [classProfile],
      documents,
      selectedDocumentIds: ['doc-1'],
      outlines: [
        {
          id: 'outline-1',
          course_id: course.id,
          class_id: classProfile.id,
          teacher_id: 'teacher-1',
          topic: 'AI',
          selected_document_ids: ['doc-1'],
          generation_job_id: 'job-1',
          sessions: [],
          created_at: course.created_at,
          updated_at: course.updated_at,
        },
      ],
      lesson,
    })

    expect(steps.map((step) => step.status)).toEqual([
      'done',
      'done',
      'done',
      'done',
      'done',
      'active',
    ])
    expect(steps[3].detail).toBe('1/2 khối đã duyệt')
    expect(steps.map((step) => step.label)).toEqual([
      'Khóa học & lớp',
      'Nguồn kiến thức',
      'Dàn ý',
      'Soạn bài',
      'Gửi duyệt',
      'Học viên học',
    ])
  })

  it('guides a new teacher toward the first required setup action', () => {
    expect(
      buildTeacherFirstLessonGuide({
        courses: [],
        classes: [],
        documents: [],
        selectedDocumentIds: [],
        outlines: [],
        lesson: null,
      }),
    ).toEqual({
      title: 'Thiết lập lớp học',
      detail:
        'Tạo khóa học và hồ sơ lớp để TeachFlow biết mục tiêu, trình độ và số buổi cần soạn.',
      actionLabel: 'Thiết lập khóa học/lớp',
      stepId: 'course',
      progressLabel: 'Bước 1/5',
    })
  })

  it('guides a teacher through source, outline, lesson and review states', () => {
    const baseState = {
      courses: [course],
      classes: [classProfile],
      documents,
      selectedDocumentIds: [],
      outlines: [],
      lesson: null,
    }

    expect(buildTeacherFirstLessonGuide(baseState)).toMatchObject({
      title: 'Chọn tài liệu dùng để soạn bài',
      actionLabel: 'Thêm hoặc chọn tài liệu',
      stepId: 'sources',
      progressLabel: 'Bước 2/5',
    })

    const outlineState = {
      ...baseState,
      selectedDocumentIds: ['doc-1'],
    }
    expect(buildTeacherFirstLessonGuide(outlineState)).toMatchObject({
      title: 'Tạo dàn ý bài giảng',
      actionLabel: 'Tạo dàn ý',
      stepId: 'outline',
      progressLabel: 'Bước 3/5',
    })

    const lessonState = {
      ...outlineState,
      outlines: [
        {
          id: 'outline-1',
          course_id: course.id,
          class_id: classProfile.id,
          teacher_id: 'teacher-1',
          topic: 'AI',
          selected_document_ids: ['doc-1'],
          generation_job_id: 'job-1',
          sessions: [],
          created_at: course.created_at,
          updated_at: course.updated_at,
        },
      ],
    }
    expect(buildTeacherFirstLessonGuide(lessonState)).toMatchObject({
      title: 'Tạo nội dung bài giảng',
      actionLabel: 'Tạo nội dung bài giảng',
      stepId: 'outline',
      progressLabel: 'Bước 4/5',
    })

    expect(
      buildTeacherFirstLessonGuide({
        ...lessonState,
        lesson: {
          ...lesson,
          status: 'teacher_reviewing',
        },
      }),
    ).toMatchObject({
      title: 'Duyệt và chỉnh bài giảng',
      actionLabel: 'Mở Lesson Studio',
      stepId: 'lesson-studio',
    })

    expect(
      buildTeacherFirstLessonGuide({
        ...lessonState,
        lesson: {
          ...lesson,
          blocks: lesson.blocks.map((block) => ({
            ...block,
            status: 'approved' as const,
          })),
          status: 'teacher_reviewing',
        },
      }),
    ).toMatchObject({
      title: 'Gửi bài cho Admin duyệt',
      actionLabel: 'Gửi duyệt',
      stepId: 'lesson-studio',
    })
  })
})
