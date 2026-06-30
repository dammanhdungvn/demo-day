import type { LessonSession } from './api/learning'
import { blockTypeLabel, lessonStatusLabel } from './labels'

type CoverSlide = {
  kind: 'cover'
  title: string
  subtitle: string
  notes: string
}

type BlockSlide = {
  kind: 'block'
  title: string
  body: string
  footer: string
  warning?: string
}

export type LessonPptxSlide = CoverSlide | BlockSlide

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

function truncateForSlide(value: string, maxLength = 680): string {
  const trimmed = value.trim()
  if (trimmed.length <= maxLength) {
    return trimmed
  }
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`
}

function citationFooter(lessonBlock: LessonSession['blocks'][number]): string {
  if (lessonBlock.citations.length === 0) {
    return 'Chưa có citation'
  }

  return lessonBlock.citations
    .slice(0, 2)
    .map((citation) => {
      const pageText =
        citation.page_number === null ? 'trang n/a' : `trang ${citation.page_number}`
      return `${citation.document_title}, ${pageText}`
    })
    .join(' | ')
}

export function pptxFileName(lesson: LessonSession): string {
  return `${slugify(lesson.title)}.pptx`
}

export function buildLessonPptxSlides(lesson: LessonSession): LessonPptxSlide[] {
  const slides: LessonPptxSlide[] = [
    {
      kind: 'cover',
      title: lesson.title,
      subtitle: `Buổi ${lesson.outline_session_index} - ${lessonStatusLabel(lesson.status)}`,
      notes: 'TeachFlow AI',
    },
  ]

  for (const block of [...lesson.blocks].sort((a, b) => a.order_index - b.order_index)) {
    slides.push({
      kind: 'block',
      title: `${blockTypeLabel(block.type)}: ${block.title}`,
      body: truncateForSlide(block.content),
      footer: citationFooter(block),
      warning: block.warning ?? undefined,
    })
  }

  return slides
}

export async function exportLessonPptx(lesson: LessonSession): Promise<void> {
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'TeachFlow AI'
  pptx.company = 'TeachFlow AI'
  pptx.subject = lesson.title
  pptx.title = lesson.title

  for (const lessonSlide of buildLessonPptxSlides(lesson)) {
    const slide = pptx.addSlide()
    slide.background = { color: 'F8FAFC' }

    if (lessonSlide.kind === 'cover') {
      slide.addText(lessonSlide.title, {
        x: 0.8,
        y: 1.65,
        w: 11.7,
        h: 0.9,
        fontFace: 'Aptos Display',
        fontSize: 34,
        bold: true,
        color: '0F172A',
        fit: 'shrink',
      })
      slide.addText(lessonSlide.subtitle, {
        x: 0.85,
        y: 2.75,
        w: 10.5,
        h: 0.35,
        fontFace: 'Aptos',
        fontSize: 15,
        color: '475569',
      })
      slide.addText(lessonSlide.notes, {
        x: 0.85,
        y: 6.65,
        w: 3,
        h: 0.25,
        fontSize: 10,
        color: '64748B',
      })
      continue
    }

    slide.addText(lessonSlide.title, {
      x: 0.55,
      y: 0.45,
      w: 12.1,
      h: 0.5,
      fontFace: 'Aptos Display',
      fontSize: 24,
      bold: true,
      color: '0F172A',
      fit: 'shrink',
    })
    slide.addText(lessonSlide.body, {
      x: 0.65,
      y: 1.2,
      w: 11.8,
      h: 4.5,
      fontFace: 'Aptos',
      fontSize: 16,
      breakLine: false,
      color: '1E293B',
      valign: 'top',
      fit: 'shrink',
    })
    if (lessonSlide.warning) {
      slide.addText(`Cảnh báo: ${lessonSlide.warning}`, {
        x: 0.65,
        y: 5.78,
        w: 11.8,
        h: 0.35,
        fontSize: 10,
        color: 'B45309',
        fit: 'shrink',
      })
    }
    slide.addText(lessonSlide.footer, {
      x: 0.65,
      y: 6.55,
      w: 11.8,
      h: 0.35,
      fontSize: 10,
      color: '64748B',
      fit: 'shrink',
    })
  }

  await pptx.writeFile({ fileName: pptxFileName(lesson) })
}
