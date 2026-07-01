import { describe, expect, it } from 'vitest'
import type {
  LessonProgress,
  LessonSession,
  StudentClassSummary,
} from '../api/learning'
import {
  buildAdminReviewSummary,
  buildStudentLearningSummary,
} from './adminStudentWorkspace'
import adminWorkspaceSource from './admin/AdminWorkspace.tsx?raw'
import lessonPresentationSource from '../presentation/LessonPresentation.tsx?raw'
import studentWorkspaceSource from './student/StudentWorkspace.tsx?raw'

const timestamp = '2026-06-28T00:00:00+00:00'

const submittedLesson: LessonSession = {
  id: 'lesson-1',
  outline_id: 'outline-1',
  outline_session_index: 2,
  course_id: 'course-1',
  class_id: 'class-1',
  teacher_id: 'teacher-1',
  title: 'Hàm số bậc nhất',
  status: 'submitted_for_admin_review',
  admin_feedback: null,
  created_at: timestamp,
  updated_at: timestamp,
  blocks: [
    {
      id: 'block-1',
      type: 'concept_explanation',
      title: 'Khái niệm',
      content: 'Nội dung',
      order_index: 1,
      status: 'approved',
      warning: null,
      citations: [
        {
          chunk_id: 'chunk-1',
          document_id: 'doc-1',
          document_title: 'SGK Toán 10',
          source_url: null,
          page_number: 45,
          chunk_index: 8,
          excerpt: 'Bằng chứng',
          score: 0.91,
        },
      ],
    },
    {
      id: 'block-2',
      type: 'teaching_activity',
      title: 'Hoạt động',
      content: 'Nội dung',
      order_index: 2,
      status: 'approved_with_warning',
      warning: 'Cần kiểm tra ví dụ.',
      citations: [],
    },
  ],
}

const publishedLesson: LessonSession = {
  ...submittedLesson,
  id: 'lesson-2',
  outline_session_index: 1,
  title: 'Đồ thị hàm số',
  status: 'published',
  admin_feedback: 'Đã duyệt',
}

const classes: StudentClassSummary[] = [
  {
    class_id: 'class-1',
    class_name: '10A1',
    course_id: 'course-1',
    course_title: 'Toán học',
    teacher_id: 'teacher-1',
    student_level: 'average',
    session_count: 12,
    minutes_per_session: 45,
  },
]

describe('admin and student workspace helpers', () => {
  it('keeps admin HTML parity views code-native and normalized', () => {
    expect(adminWorkspaceSource).toContain('admin-design-overview')
    expect(adminWorkspaceSource).toContain('admin-design-lesson-library')
    expect(adminWorkspaceSource).toContain('admin-design-lesson-library-part1')
    expect(adminWorkspaceSource).toContain('admin-design-knowledge-part2')
    expect(adminWorkspaceSource).toContain('admin-design-users-part1')
    expect(adminWorkspaceSource).toContain('admin-design-users-part2')
    expect(adminWorkspaceSource).toContain('admin-user-bulk-bar')
    expect(adminWorkspaceSource).toContain('bulkUpdateManagedUserStatus')
    expect(adminWorkspaceSource).toContain('bulkResetManagedUserPasswords')
    expect(adminWorkspaceSource).toContain('admin-design-reports')
    expect(adminWorkspaceSource).toContain('admin-design-reports-part1')
    expect(adminWorkspaceSource).toContain('admin-design-activity-log')
    expect(adminWorkspaceSource).toContain('admin-design-activity-log-part2')
    expect(adminWorkspaceSource).toContain('admin-design-settings')
    expect(adminWorkspaceSource).toContain('adminDesignStats')
    expect(adminWorkspaceSource).not.toContain('tailwindcss.com')
    expect(adminWorkspaceSource).not.toContain('admin-ai-knowledge-library-design-v2.png')
  })

  it('keeps the student HTML design conversion layout surfaces code-native', () => {
    expect(studentWorkspaceSource).toContain('student-design-page')
    expect(studentWorkspaceSource).toContain('student-design-classes')
    expect(studentWorkspaceSource).toContain('student-design-reader-grid')
    expect(studentWorkspaceSource).toContain('student-design-practice')
    expect(studentWorkspaceSource).toContain('student-design-documents')
    expect(studentWorkspaceSource).toContain('student-design-tutor-panel')
    expect(studentWorkspaceSource).not.toContain('student-my-classes-dashboard-design-v2.png')
    expect(studentWorkspaceSource).not.toContain('tailwindcss.com')
  })

  it('keeps student presentation part1 and part2 mapped into code-native viewer', () => {
    expect(lessonPresentationSource).toContain('lesson-presentation-design-part1')
    expect(lessonPresentationSource).toContain('lesson-presentation-design-part2')
    expect(lessonPresentationSource).toContain('presentation-citations')
    expect(lessonPresentationSource).toContain('Toàn màn hình')
    expect(lessonPresentationSource).toContain('Xuất PDF')
    expect(lessonPresentationSource).not.toContain(
      'student-lesson-presentation-viewer-design-v2-part1.html',
    )
  })

  it('summarizes admin review queue from lesson blocks', () => {
    const summary = buildAdminReviewSummary([submittedLesson, publishedLesson], 'lesson-1')

    expect(summary.totalLessons).toBe(2)
    expect(summary.pendingLessons).toBe(1)
    expect(summary.lessonsWithWarnings).toBe(2)
    expect(summary.averageCitationCoveragePercent).toBe(50)
    expect(summary.selectedLesson?.id).toBe('lesson-1')
    expect(summary.selectedMetrics).toMatchObject({
      blockCount: 2,
      warningCount: 1,
      citationCount: 1,
      citationCoveragePercent: 50,
      reviewedBlockCount: 2,
      canModerate: true,
    })
  })

  it('summarizes student learning with real progress and no disabled tutor slot', () => {
    const progress: LessonProgress = {
      lesson_id: publishedLesson.id,
      class_id: publishedLesson.class_id,
      student_id: 'demo-student',
      current_block_id: 'block-1',
      current_slide_index: 2,
      progress_percent: 50,
      started_at: timestamp,
      last_opened_at: '2026-06-28T01:00:00+00:00',
      completed_at: null,
    }
    const summary = buildStudentLearningSummary(classes, [publishedLesson], null, {
      [publishedLesson.id]: progress,
    })

    expect(summary.classCount).toBe(1)
    expect(summary.publishedLessonCount).toBe(1)
    expect(summary.startedLessonCount).toBe(1)
    expect(summary.completedLessonCount).toBe(0)
    expect(summary.averageProgressPercent).toBe(50)
    expect(summary.continueLesson?.id).toBe('lesson-2')
    expect(summary.selectedLessonProgress).toEqual(progress)
    expect(summary.futureSlots).toEqual([])
  })
})
