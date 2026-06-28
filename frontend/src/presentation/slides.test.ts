import { describe, expect, it } from 'vitest'

import type { LessonSession } from '../api/learning'
import { buildLessonSlides, clampSlideIndex } from './slides'

const lesson: LessonSession = {
  id: 'lesson-1',
  outline_id: 'outline-1',
  outline_session_index: 1,
  course_id: 'course-1',
  class_id: 'class-1',
  teacher_id: 'demo-teacher',
  title: 'AI Agent Architecture',
  status: 'published',
  admin_feedback: null,
  created_at: '2026-06-28T00:00:00+00:00',
  updated_at: '2026-06-28T00:00:00+00:00',
  blocks: [
    {
      id: 'block-1',
      type: 'concept_explanation',
      title: 'Agent loop',
      content: 'An agent observes, plans, acts, and checks the result.',
      order_index: 1,
      status: 'approved',
      warning: null,
      citations: [
        {
          chunk_id: 'chunk-1',
          document_id: 'doc-1',
          document_title: 'Building Applications with AI Agents',
          page_number: 42,
          chunk_index: 3,
          excerpt: 'Agents coordinate models, tools, and memory.',
          score: 0.93,
        },
      ],
    },
  ],
}

describe('presentation slides', () => {
  it('builds a title slide and block slides with citations', () => {
    const slides = buildLessonSlides(lesson)

    expect(slides).toHaveLength(2)
    expect(slides[0]).toMatchObject({
      id: 'lesson-1-title',
      eyebrow: 'Buổi 1',
      title: 'AI Agent Architecture',
    })
    expect(slides[1]).toMatchObject({
      id: 'block-1',
      eyebrow: 'Giải thích khái niệm',
      title: 'Agent loop',
    })
    expect(slides[1].citations[0].document_title).toBe(
      'Building Applications with AI Agents',
    )
  })

  it('clamps slide indexes to the available range', () => {
    expect(clampSlideIndex(-1, 3)).toBe(0)
    expect(clampSlideIndex(2, 3)).toBe(2)
    expect(clampSlideIndex(3, 3)).toBe(2)
    expect(clampSlideIndex(5, 0)).toBe(0)
  })
})
