import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Printer,
  XCircle,
} from 'lucide-react'

import {
  buildLessonSlides,
  clampSlideIndex,
  type LessonSlide,
} from './slides'
import type { LessonSession } from '../api/learning'

function PresentationSlideContent({ slide }: { slide: LessonSlide }) {
  return (
    <>
      <p className="section-label">{slide.eyebrow}</p>
      <h2>{slide.title}</h2>
      <p className="presentation-copy">{slide.content}</p>
      {slide.warning && <p className="warning-text">{slide.warning}</p>}
      {slide.citations.length > 0 && (
        <div className="presentation-citations">
          {slide.citations.map((citation) => (
            <article key={citation.chunk_id}>
              <strong>{citation.document_title}</strong>
              <span>
                Trang {citation.page_number ?? 'n/a'} - chunk {citation.chunk_index}
              </span>
              {citation.source_url && (
                <a href={citation.source_url} rel="noreferrer" target="_blank">
                  {citation.source_url}
                </a>
              )}
              <p>{citation.excerpt}</p>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

export function LessonPresentation({
  initialSlideIndex = 0,
  isExportingPdf = false,
  lesson,
  onClose,
  onPdfExport,
  onSlideChange,
}: {
  initialSlideIndex?: number
  isExportingPdf?: boolean
  lesson: LessonSession
  onClose?: () => void
  onPdfExport?: () => Promise<void> | void
  onSlideChange?: (slide: LessonSlide, slideIndex: number) => void
}) {
  const panelRef = useRef<HTMLElement | null>(null)
  const slides = useMemo(() => buildLessonSlides(lesson), [lesson])
  const [slideIndex, setSlideIndex] = useState(() =>
    clampSlideIndex(initialSlideIndex, slides.length),
  )
  const currentSlideIndex = clampSlideIndex(slideIndex, slides.length)
  const activeSlide = slides[currentSlideIndex]

  useEffect(() => {
    setSlideIndex(clampSlideIndex(initialSlideIndex, slides.length))
  }, [initialSlideIndex, lesson.id, slides.length])

  useEffect(() => {
    if (activeSlide) {
      onSlideChange?.(activeSlide, currentSlideIndex)
    }
  }, [activeSlide, currentSlideIndex, onSlideChange])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') {
        setSlideIndex((current) => clampSlideIndex(current + 1, slides.length))
      }
      if (event.key === 'ArrowLeft') {
        setSlideIndex((current) => clampSlideIndex(current - 1, slides.length))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [slides.length])

  function handleFullscreen() {
    void panelRef.current?.requestFullscreen?.()
  }

  async function handlePrint() {
    try {
      await onPdfExport?.()
    } catch {
      return
    }
    window.print()
  }

  return (
    <section className="presentation-panel presentation-print-area" ref={panelRef}>
      <div className="presentation-controls">
        <button
          className="ghost-button"
          disabled={currentSlideIndex === 0}
          type="button"
          onClick={() =>
            setSlideIndex((current) => clampSlideIndex(current - 1, slides.length))
          }
        >
          <ChevronLeft aria-hidden="true" size={17} />
          Trước
        </button>
        <span>
          {currentSlideIndex + 1} / {slides.length}
        </span>
        <button
          className="ghost-button"
          disabled={currentSlideIndex >= slides.length - 1}
          type="button"
          onClick={() =>
            setSlideIndex((current) => clampSlideIndex(current + 1, slides.length))
          }
        >
          Tiếp
          <ChevronRight aria-hidden="true" size={17} />
        </button>
        <button className="ghost-button" type="button" onClick={handleFullscreen}>
          <Maximize2 aria-hidden="true" size={17} />
          Toàn màn hình
        </button>
        <button
          className="primary-button"
          disabled={isExportingPdf}
          type="button"
          onClick={() => void handlePrint()}
        >
          <Printer aria-hidden="true" size={17} />
          {isExportingPdf ? 'Đang ghi export...' : 'Xuất PDF'}
        </button>
        {onClose && (
          <button className="ghost-button" type="button" onClick={onClose}>
            <XCircle aria-hidden="true" size={17} />
            Đóng
          </button>
        )}
      </div>

      {activeSlide && (
        <article className="presentation-slide-screen">
          <PresentationSlideContent slide={activeSlide} />
        </article>
      )}

      <div className="print-slides">
        {slides.map((slide) => (
          <article className="print-slide" key={slide.id}>
            <PresentationSlideContent slide={slide} />
          </article>
        ))}
      </div>
    </section>
  )
}
