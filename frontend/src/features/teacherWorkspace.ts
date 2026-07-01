import type {
  Course,
  ClassProfile,
  CourseOutline,
  LessonSession,
  SourceDocument,
} from '../api/learning'

export type TeacherWorkspaceMetrics = {
  citationCoveragePercent: number
  reviewedBlocks: number
  totalBlocks: number
  warningCount: number
  pendingAdminCount: number
  completedSourceCount: number
  selectedSourceCount: number
}

export type WorkflowStepStatus = 'done' | 'active' | 'waiting'

export type TeacherWorkflowStep = {
  id:
    | 'course'
    | 'sources'
    | 'outline'
    | 'lesson-studio'
    | 'admin-review'
    | 'student-publish'
  label: string
  detail: string
  status: WorkflowStepStatus
}

export type TeacherFirstLessonGuide = {
  title: string
  detail: string
  actionLabel: string
  stepId: TeacherWorkflowStep['id']
  progressLabel: string
}

export type TeacherWorkspaceState = {
  courses: Course[]
  classes: ClassProfile[]
  documents: SourceDocument[]
  selectedDocumentIds: string[]
  outlines: CourseOutline[]
  lesson: LessonSession | null
}

export function buildTeacherWorkspaceMetrics(
  state: Pick<TeacherWorkspaceState, 'documents' | 'selectedDocumentIds' | 'lesson'>,
): TeacherWorkspaceMetrics {
  const completedSourceIds = new Set(
    state.documents
      .filter((document) => document.status === 'completed' && document.is_active)
      .map((document) => document.id),
  )
  const selectedSourceCount = state.selectedDocumentIds.filter((documentId) =>
    completedSourceIds.has(documentId),
  ).length
  const blocks = state.lesson?.blocks ?? []
  const totalBlocks = blocks.length
  const citedBlocks = blocks.filter((block) => block.citations.length > 0).length
  const reviewedBlocks = blocks.filter(
    (block) => block.status !== 'needs_review',
  ).length
  return {
    citationCoveragePercent: totalBlocks
      ? Math.round((citedBlocks / totalBlocks) * 100)
      : 0,
    reviewedBlocks,
    totalBlocks,
    warningCount: blocks.filter((block) => Boolean(block.warning)).length,
    pendingAdminCount:
      state.lesson?.status === 'submitted_for_admin_review' ? 1 : 0,
    completedSourceCount: completedSourceIds.size,
    selectedSourceCount,
  }
}

function statusAfter(condition: boolean, priorDone: boolean): WorkflowStepStatus {
  if (condition) {
    return 'done'
  }
  return priorDone ? 'active' : 'waiting'
}

export function buildTeacherWorkflowSteps(
  state: TeacherWorkspaceState,
): TeacherWorkflowStep[] {
  const hasCourse = state.courses.length > 0
  const hasClass = state.classes.length > 0
  const hasSelectedSource = state.selectedDocumentIds.length > 0
  const hasOutline = state.outlines.length > 0
  const hasLesson = Boolean(state.lesson)
  const isSubmitted =
    state.lesson?.status === 'submitted_for_admin_review' ||
    state.lesson?.status === 'published'
  const isPublished = state.lesson?.status === 'published'
  const metrics = buildTeacherWorkspaceMetrics(state)

  return [
    {
      id: 'course',
      label: 'Khóa học & lớp',
      detail: hasCourse && hasClass ? 'Đã thiết lập' : 'Cần khóa học và lớp',
      status: hasCourse && hasClass ? 'done' : 'active',
    },
    {
      id: 'sources',
      label: 'Nguồn kiến thức',
      detail: hasSelectedSource
        ? `${metrics.selectedSourceCount}/${metrics.completedSourceCount} nguồn sẵn sàng`
        : 'Cần chọn tài liệu',
      status: statusAfter(hasSelectedSource, hasCourse && hasClass),
    },
    {
      id: 'outline',
      label: 'Dàn ý',
      detail: hasOutline ? 'Đã tạo' : 'Chờ tạo',
      status: statusAfter(hasOutline, hasSelectedSource),
    },
    {
      id: 'lesson-studio',
      label: 'Soạn bài',
      detail: hasLesson
        ? `${metrics.reviewedBlocks}/${metrics.totalBlocks} khối đã duyệt`
        : 'Chờ tạo nội dung',
      status: statusAfter(hasLesson, hasOutline),
    },
    {
      id: 'admin-review',
      label: 'Gửi duyệt',
      detail: isSubmitted ? 'Đã gửi' : 'Chờ gửi',
      status: statusAfter(isSubmitted, hasLesson),
    },
    {
      id: 'student-publish',
      label: 'Học viên học',
      detail: isPublished ? 'Đã xuất bản' : 'Chưa xuất bản',
      status: statusAfter(isPublished, isSubmitted),
    },
  ]
}

export function buildTeacherFirstLessonGuide(
  state: TeacherWorkspaceState,
): TeacherFirstLessonGuide {
  const hasCourse = state.courses.length > 0
  const hasClass = state.classes.length > 0
  const hasSelectedSource = state.selectedDocumentIds.length > 0
  const hasOutline = state.outlines.length > 0
  const lesson = state.lesson
  const metrics = buildTeacherWorkspaceMetrics(state)
  const allBlocksReviewed =
    Boolean(lesson?.blocks.length) &&
    lesson?.blocks.every((block) => block.status !== 'needs_review')

  if (!hasCourse || !hasClass) {
    return {
      title: 'Thiết lập lớp học',
      detail:
        'Tạo khóa học và hồ sơ lớp để TeachFlow biết mục tiêu, trình độ và số buổi cần soạn.',
      actionLabel: 'Thiết lập khóa học/lớp',
      stepId: 'course',
      progressLabel: 'Bước 1/5',
    }
  }

  if (!hasSelectedSource) {
    return {
      title: 'Chọn tài liệu dùng để soạn bài',
      detail:
        metrics.completedSourceCount > 0
          ? 'Chọn ít nhất một tài liệu đã xử lý để AI bám sát nội dung lớp học.'
          : 'Upload PDF hoặc thêm URL đáng tin cậy để AI có nguồn tham khảo khi soạn bài.',
      actionLabel: 'Thêm hoặc chọn tài liệu',
      stepId: 'sources',
      progressLabel: 'Bước 2/5',
    }
  }

  if (!hasOutline) {
    return {
      title: 'Tạo dàn ý bài giảng',
      detail:
        'Dàn ý giúp chia nội dung thành từng buổi học trước khi tạo bài giảng chi tiết.',
      actionLabel: 'Tạo dàn ý',
      stepId: 'outline',
      progressLabel: 'Bước 3/5',
    }
  }

  if (!lesson) {
    return {
      title: 'Tạo nội dung bài giảng',
      detail:
        'Chọn một buổi trong dàn ý rồi tạo nội dung bài giảng để bắt đầu review.',
      actionLabel: 'Tạo nội dung bài giảng',
      stepId: 'outline',
      progressLabel: 'Bước 4/5',
    }
  }

  if (lesson.status === 'submitted_for_admin_review') {
    return {
      title: 'Chờ Admin duyệt',
      detail:
        'Bài đã được gửi duyệt. Bạn có thể theo dõi phản hồi hoặc chuẩn bị bài tiếp theo.',
      actionLabel: 'Xem trạng thái duyệt',
      stepId: 'admin-review',
      progressLabel: 'Bước 5/5',
    }
  }

  if (lesson.status === 'published') {
    return {
      title: 'Bài đã sẵn sàng cho học viên',
      detail:
        'Bài đã xuất bản. Theo dõi tiến độ lớp để biết học viên đã bắt đầu và hoàn thành đến đâu.',
      actionLabel: 'Xem tiến độ học',
      stepId: 'student-publish',
      progressLabel: 'Hoàn tất',
    }
  }

  if (allBlocksReviewed) {
    return {
      title: 'Gửi bài cho Admin duyệt',
      detail:
        'Các khối nội dung đã được duyệt. Gửi bài để Admin kiểm tra và xuất bản cho học viên.',
      actionLabel: 'Gửi duyệt',
      stepId: 'lesson-studio',
      progressLabel: 'Bước 5/5',
    }
  }

  return {
    title: 'Duyệt và chỉnh bài giảng',
    detail: `Còn ${Math.max(
      metrics.totalBlocks - metrics.reviewedBlocks,
      0,
    )} khối cần xem lại trước khi gửi duyệt.`,
    actionLabel: 'Mở Lesson Studio',
    stepId: 'lesson-studio',
    progressLabel: 'Bước 5/5',
  }
}
