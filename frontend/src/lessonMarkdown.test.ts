import { describe, expect, it } from 'vitest'

import { buildLessonMarkdown, markdownFileName } from './lessonMarkdown'
import type { LessonSession } from './api/learning'

const lesson: LessonSession = {
  id: 'lesson-1',
  outline_id: 'outline-1',
  outline_session_index: 1,
  course_id: 'course-1',
  class_id: 'class-1',
  teacher_id: 'demo-teacher',
  title: 'Kiến trúc Transformer: nền tảng',
  status: 'admin_rejected',
  admin_feedback: 'Bổ sung citation cho câu hỏi quiz.',
  blocks: [
    {
      id: 'block-1',
      type: 'concept_explanation',
      title: 'Attention là gì?',
      content: 'Attention giúp mô hình tập trung vào token liên quan.',
      order_index: 1,
      status: 'approved_with_warning',
      warning: 'Nội dung này chưa được grounding đầy đủ từ tài liệu nguồn.',
      citations: [
        {
          chunk_id: 'chunk-1',
          document_id: 'doc-1',
          document_title: 'Building Applications with AI Agents',
          page_number: 42,
          chunk_index: 3,
          excerpt: 'Agents use context and orchestration loops.',
          score: 0.94,
        },
      ],
    },
    {
      id: 'block-2',
      type: 'quiz',
      title: 'Câu hỏi nhanh',
      content: 'Self-attention giải quyết vấn đề gì?',
      order_index: 2,
      status: 'approved',
      warning: null,
      citations: [],
    },
  ],
  created_at: '2026-06-28T00:00:00+00:00',
  updated_at: '2026-06-28T00:00:00+00:00',
}

describe('lesson markdown export', () => {
  it('serializes lesson status, feedback, blocks, warnings, and citations', () => {
    const markdown = buildLessonMarkdown(lesson)

    expect(markdown).toContain('# Kiến trúc Transformer: nền tảng')
    expect(markdown).toContain('**Trạng thái:** Admin từ chối')
    expect(markdown).toContain('> Bổ sung citation cho câu hỏi quiz.')
    expect(markdown).toContain('## 1. Giải thích khái niệm - Attention là gì?')
    expect(markdown).toContain('**Trạng thái block:** Duyệt kèm cảnh báo')
    expect(markdown).toContain('> Nội dung này chưa được grounding đầy đủ từ tài liệu nguồn.')
    expect(markdown).toContain('- Building Applications with AI Agents, trang 42, chunk 3, confidence 0.94')
    expect(markdown).toContain('  > Agents use context and orchestration loops.')
    expect(markdown).toContain('## 2. Câu hỏi kiểm tra - Câu hỏi nhanh')
    expect(markdown).toContain('_Chưa có citation._')
  })

  it('creates a stable markdown file name', () => {
    expect(markdownFileName(lesson)).toBe('kien-truc-transformer-nen-tang.md')
  })
})
