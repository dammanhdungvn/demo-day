import type { LessonSession } from './api/learning'
import { blockStatusLabel, blockTypeLabel, lessonStatusLabel } from './labels'

function markdownLineBreaks(value: string): string {
  return value.trim().replace(/\r\n/g, '\n')
}

function slugify(value: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || 'teachflow-lesson'
}

export function markdownFileName(lesson: LessonSession): string {
  return `${slugify(lesson.title)}.md`
}

export function buildLessonMarkdown(lesson: LessonSession): string {
  const lines: string[] = [
    `# ${lesson.title}`,
    '',
    `**Trạng thái:** ${lessonStatusLabel(lesson.status)}`,
    `**Buổi:** ${lesson.outline_session_index}`,
    '',
  ]

  if (lesson.admin_feedback) {
    lines.push('## Phản hồi Admin', '', `> ${lesson.admin_feedback}`, '')
  }

  lines.push('## Nội dung lesson', '')

  for (const block of [...lesson.blocks].sort((a, b) => a.order_index - b.order_index)) {
    lines.push(
      `## ${block.order_index}. ${blockTypeLabel(block.type)} - ${block.title}`,
      '',
      `**Trạng thái block:** ${blockStatusLabel(block.status)}`,
      '',
      markdownLineBreaks(block.content),
      '',
    )

    if (block.warning) {
      lines.push(`> ${block.warning}`, '')
    }

    lines.push('### Citations')
    if (block.citations.length === 0) {
      lines.push('', '_Chưa có citation._', '')
      continue
    }

    lines.push('')
    for (const citation of block.citations) {
      const pageText = citation.page_number === null ? 'trang n/a' : `trang ${citation.page_number}`
      lines.push(
        `- ${citation.document_title}, ${pageText}, chunk ${citation.chunk_index}, confidence ${citation.score.toFixed(2)}`,
        `  > ${citation.excerpt}`,
      )
    }
    lines.push('')
  }

  return `${lines.join('\n').trim()}\n`
}
