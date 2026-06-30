import type {
  LessonProgress,
  LessonSession,
  StudentClassSummary,
} from '../api/learning'

export type AdminLessonMetrics = {
  blockCount: number
  warningCount: number
  citationCount: number
  citationCoveragePercent: number
  reviewedBlockCount: number
  approvedBlockCount: number
  canModerate: boolean
}

export type AdminQueueItem = {
  lesson: LessonSession
  metrics: AdminLessonMetrics
}

export type AdminReviewSummary = {
  totalLessons: number
  pendingLessons: number
  lessonsWithWarnings: number
  averageCitationCoveragePercent: number
  queue: AdminQueueItem[]
  selectedLesson: LessonSession | null
  selectedMetrics: AdminLessonMetrics | null
}

export type StudentLessonMetrics = {
  blockCount: number
  warningCount: number
  citationCount: number
  readingMinutes: number
}

export type FutureLearningSlot = {
  id: 'tutor'
  label: string
  description: string
  enabled: false
}

export type StudentLearningSummary = {
  classCount: number
  publishedLessonCount: number
  startedLessonCount: number
  completedLessonCount: number
  averageProgressPercent: number
  classContext: StudentClassSummary | null
  continueLesson: LessonSession | null
  selectedLessonMetrics: StudentLessonMetrics | null
  selectedLessonProgress: LessonProgress | null
  futureSlots: FutureLearningSlot[]
}

const FUTURE_LEARNING_SLOTS: FutureLearningSlot[] = [
]

function percentage(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

export function buildAdminLessonMetrics(
  lesson: LessonSession,
): AdminLessonMetrics {
  const blockCount = lesson.blocks.length
  const blocksWithCitations = lesson.blocks.filter(
    (block) => block.citations.length > 0,
  ).length
  const citationCount = lesson.blocks.reduce(
    (count, block) => count + block.citations.length,
    0,
  )
  const reviewedBlockCount = lesson.blocks.filter(
    (block) => block.status !== 'needs_review',
  ).length
  const approvedBlockCount = lesson.blocks.filter(
    (block) =>
      block.status === 'approved' || block.status === 'approved_with_warning',
  ).length

  return {
    blockCount,
    warningCount: lesson.blocks.filter((block) => Boolean(block.warning)).length,
    citationCount,
    citationCoveragePercent: percentage(blocksWithCitations, blockCount),
    reviewedBlockCount,
    approvedBlockCount,
    canModerate: lesson.status === 'submitted_for_admin_review',
  }
}

export function buildAdminReviewSummary(
  lessons: LessonSession[],
  selectedLessonId: string | null,
): AdminReviewSummary {
  const queue = lessons.map((lesson) => ({
    lesson,
    metrics: buildAdminLessonMetrics(lesson),
  }))
  const selectedLesson =
    queue.find((item) => item.lesson.id === selectedLessonId)?.lesson ??
    queue[0]?.lesson ??
    null
  const selectedMetrics = selectedLesson
    ? buildAdminLessonMetrics(selectedLesson)
    : null
  const coverageTotal = queue.reduce(
    (total, item) => total + item.metrics.citationCoveragePercent,
    0,
  )

  return {
    totalLessons: lessons.length,
    pendingLessons: lessons.filter(
      (lesson) => lesson.status === 'submitted_for_admin_review',
    ).length,
    lessonsWithWarnings: queue.filter((item) => item.metrics.warningCount > 0)
      .length,
    averageCitationCoveragePercent: queue.length
      ? Math.round(coverageTotal / queue.length)
      : 0,
    queue,
    selectedLesson,
    selectedMetrics,
  }
}

function countWords(value: string): number {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

export function buildStudentLessonMetrics(
  lesson: LessonSession,
): StudentLessonMetrics {
  const wordCount = lesson.blocks.reduce(
    (total, block) => total + countWords(`${block.title} ${block.content}`),
    0,
  )

  return {
    blockCount: lesson.blocks.length,
    warningCount: lesson.blocks.filter((block) => Boolean(block.warning)).length,
    citationCount: lesson.blocks.reduce(
      (count, block) => count + block.citations.length,
      0,
    ),
    readingMinutes: Math.max(1, Math.ceil(wordCount / 180)),
  }
}

export function buildStudentLearningSummary(
  classes: StudentClassSummary[],
  lessons: LessonSession[],
  selectedLesson: LessonSession | null,
  progressByLessonId: Record<string, LessonProgress> = {},
): StudentLearningSummary {
  const publishedLessons = lessons.filter((lesson) => lesson.status === 'published')
  const lessonIds = new Set(publishedLessons.map((lesson) => lesson.id))
  const progressValues = Object.values(progressByLessonId).filter((progress) =>
    lessonIds.has(progress.lesson_id),
  )
  const mostRecentIncompleteProgress = [
    ...progressValues.filter((progress) => !progress.completed_at),
  ].sort((left, right) =>
      (right.last_opened_at ?? '').localeCompare(left.last_opened_at ?? ''),
    )[0]
  const fallbackIncompleteLesson =
    publishedLessons.find(
      (lesson) => progressByLessonId[lesson.id]?.completed_at == null,
    ) ?? null
  const continueLesson =
    selectedLesson ??
    publishedLessons.find(
      (lesson) => lesson.id === mostRecentIncompleteProgress?.lesson_id,
    ) ??
    fallbackIncompleteLesson ??
    publishedLessons[0] ??
    null
  const selectedLessonProgress = continueLesson
    ? (progressByLessonId[continueLesson.id] ?? null)
    : null
  const progressTotal = publishedLessons.reduce(
    (total, lesson) => total + (progressByLessonId[lesson.id]?.progress_percent ?? 0),
    0,
  )

  return {
    classCount: classes.length,
    publishedLessonCount: publishedLessons.length,
    startedLessonCount: progressValues.filter((progress) => progress.started_at).length,
    completedLessonCount: progressValues.filter((progress) => progress.completed_at)
      .length,
    averageProgressPercent: publishedLessons.length
      ? Math.round(progressTotal / publishedLessons.length)
      : 0,
    classContext:
      classes.find((classSummary) => classSummary.class_id === continueLesson?.class_id) ??
      classes[0] ??
      null,
    continueLesson,
    selectedLessonMetrics: continueLesson
      ? buildStudentLessonMetrics(continueLesson)
      : null,
    selectedLessonProgress,
    futureSlots: FUTURE_LEARNING_SLOTS,
  }
}
