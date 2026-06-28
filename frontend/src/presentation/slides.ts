import type { LessonSession, RetrievedChunk } from '../api/learning'
import { blockTypeLabel, lessonStatusLabel } from '../labels'

export type LessonSlide = {
  id: string
  eyebrow: string
  title: string
  content: string
  citations: RetrievedChunk[]
  warning: string | null
}

export function buildLessonSlides(lesson: LessonSession): LessonSlide[] {
  const titleSlide: LessonSlide = {
    id: `${lesson.id}-title`,
    eyebrow: `Buổi ${lesson.outline_session_index}`,
    title: lesson.title,
    content: `Trạng thái lesson: ${lessonStatusLabel(lesson.status)}`,
    citations: [],
    warning: lesson.admin_feedback,
  }

  return [
    titleSlide,
    ...lesson.blocks.map((block) => ({
      id: block.id,
      eyebrow: blockTypeLabel(block.type),
      title: block.title,
      content: block.content,
      citations: block.citations,
      warning: block.warning,
    })),
  ]
}

export function clampSlideIndex(index: number, slideCount: number): number {
  if (slideCount <= 0) {
    return 0
  }
  if (index < 0) {
    return 0
  }
  if (index >= slideCount) {
    return slideCount - 1
  }
  return index
}
