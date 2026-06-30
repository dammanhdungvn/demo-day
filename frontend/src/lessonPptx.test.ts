import { describe, expect, it } from 'vitest'

import { buildLessonPptxSlides, pptxFileName } from './lessonPptx'
import type { LessonSession } from './api/learning'

const lesson: LessonSession = {
  id: 'lesson-1',
  outline_id: 'outline-1',
  outline_session_index: 2,
  course_id: 'course-1',
  class_id: 'class-1',
  teacher_id: 'demo-teacher',
  title: 'Transformer Architecture',
  status: 'published',
  admin_feedback: null,
  blocks: [
    {
      id: 'block-1',
      type: 'learning_objectives',
      title: 'Mục tiêu',
      content: 'Giải thích self-attention.\nLiên hệ với ứng dụng AI.',
      order_index: 1,
      status: 'approved',
      warning: null,
      citations: [
        {
          chunk_id: 'chunk-1',
          document_id: 'doc-1',
          document_title: 'Building Applications with AI Agents',
          page_number: 12,
          chunk_index: 4,
          excerpt: 'Transformer systems use attention to focus context.',
          score: 0.88,
        },
      ],
    },
    {
      id: 'block-2',
      type: 'quiz',
      title: 'Quiz nhanh',
      content: 'Self-attention giúp mô hình làm gì?',
      order_index: 2,
      status: 'approved_with_warning',
      warning: 'Nội dung này chưa được grounding đầy đủ từ tài liệu nguồn.',
      citations: [],
    },
  ],
  created_at: '2026-06-28T00:00:00+00:00',
  updated_at: '2026-06-28T00:00:00+00:00',
}

describe('lesson PPTX export', () => {
  it('builds cover and block slide payloads', () => {
    const slides = buildLessonPptxSlides(lesson)

    expect(slides).toHaveLength(3)
    expect(slides[0]).toEqual({
      kind: 'cover',
      title: 'Transformer Architecture',
      subtitle: 'Buổi 2 - Đã xuất bản',
      notes: 'TeachFlow AI',
    })
    expect(slides[1]).toMatchObject({
      kind: 'block',
      title: 'Mục tiêu học tập: Mục tiêu',
      body: 'Giải thích self-attention.\nLiên hệ với ứng dụng AI.',
      footer: 'Building Applications with AI Agents, trang 12',
    })
    expect(slides[2]).toMatchObject({
      kind: 'block',
      title: 'Câu hỏi kiểm tra: Quiz nhanh',
      footer: 'Chưa có citation',
      warning: 'Nội dung này chưa được grounding đầy đủ từ tài liệu nguồn.',
    })
  })

  it('creates a stable pptx file name', () => {
    expect(pptxFileName(lesson)).toBe('transformer-architecture.pptx')
  })
})
