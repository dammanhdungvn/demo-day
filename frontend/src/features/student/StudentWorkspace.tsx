import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bookmark,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MonitorPlay,
  Printer,
  Save,
  Sparkles,
} from 'lucide-react'

import {
  askStudentLessonTutor,
  archiveDocument,
  fetchDocuments,
  fetchStudentClasses,
  fetchStudentLesson,
  fetchStudentLessonProgress,
  fetchStudentLessonStudyState,
  fetchStudentLessons,
  fetchStudentPracticeAttempt,
  fetchStudentPracticeItems,
  fetchStudentStudyReview,
  reindexDocument,
  recordLessonExport,
  type DocumentUploadResponse,
  updateStudentPracticeAttempt,
  updateStudentLessonProgress,
  updateStudentLessonStudyState,
  type LessonBlock,
  type LessonPracticeAttempt,
  type LessonPracticeItem,
  type LessonProgress,
  type LessonSession,
  type LessonStudyReviewItem,
  type LessonStudyState,
  type LessonTutorAnswer,
  type PracticeSelfCheckStatus,
  type SourceDocument,
  type StudentClassSummary,
} from '../../api/learning'
import { getErrorMessage } from '../../errors'
import { buildStudentLearningSummary } from '../adminStudentWorkspace'
import {
  blockStatusLabel,
  blockTypeLabel,
  studentLevelLabel,
} from '../../labels'
import { LessonPresentation } from '../../presentation/LessonPresentation'
import type { LessonSlide } from '../../presentation/slides'
import { MetricCard } from '../../ui/teacherWorkspace'
import { documentUploadStatusMessage } from '../../uploadStatus'
import { WORKSPACE_SECTION_IDS } from '../../workspaceActionTargets'
import {
  DocumentStatusList,
  KnowledgeUploadPanel,
} from '../knowledge/KnowledgeControls'
import type { WorkspacePageId } from '../../workspacePages'

function studyNoteKey(lessonId: string, blockId: string): string {
  return `${lessonId}:${blockId}`
}

function practiceAttemptKey(lessonId: string, blockId: string): string {
  return `${lessonId}:${blockId}`
}

function isPracticeBlockType(type: LessonBlock['type']): boolean {
  return type === 'quiz' || type === 'assignment' || type === 'common_misconception'
}

function practiceStatusLabel(status: PracticeSelfCheckStatus): string {
  if (status === 'got_it') {
    return 'Đã hiểu'
  }
  if (status === 'needs_review') {
    return 'Cần ôn lại'
  }
  return 'Chưa làm'
}

function formatStudyUpdatedAt(value: string): string {
  const updatedAt = new Date(value)
  if (Number.isNaN(updatedAt.getTime())) {
    return 'vừa lưu'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(updatedAt)
}

export function StudentWorkspace({
  activePage,
  token,
}: {
  activePage: WorkspacePageId
  token: string
}) {
  const [classes, setClasses] = useState<StudentClassSummary[]>([])
  const [lessons, setLessons] = useState<LessonSession[]>([])
  const [documents, setDocuments] = useState<SourceDocument[]>([])
  const [lessonProgressById, setLessonProgressById] = useState<
    Record<string, LessonProgress>
  >({})
  const [studyStateByLessonId, setStudyStateByLessonId] = useState<
    Record<string, LessonStudyState>
  >({})
  const [studyReviewItems, setStudyReviewItems] = useState<LessonStudyReviewItem[]>(
    [],
  )
  const [practiceItems, setPracticeItems] = useState<LessonPracticeItem[]>([])
  const [practiceAttemptByKey, setPracticeAttemptByKey] = useState<
    Record<string, LessonPracticeAttempt>
  >({})
  const [draftPracticeAnswersByKey, setDraftPracticeAnswersByKey] = useState<
    Record<string, string>
  >({})
  const [draftPracticeStatusByKey, setDraftPracticeStatusByKey] = useState<
    Record<string, PracticeSelfCheckStatus>
  >({})
  const [draftNotesByKey, setDraftNotesByKey] = useState<Record<string, string>>({})
  const [tutorQuestion, setTutorQuestion] = useState('')
  const [tutorAnswer, setTutorAnswer] = useState<LessonTutorAnswer | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<LessonSession | null>(null)
  const [selectedStudentBlockId, setSelectedStudentBlockId] = useState<string | null>(
    null,
  )
  const [statusMessage, setStatusMessage] = useState('Đang tải lớp của tôi...')
  const [lessonStatusMessage, setLessonStatusMessage] = useState(
    'Đang tải lesson đã xuất bản...',
  )
  const [documentStatusMessage, setDocumentStatusMessage] = useState(
    'Đang tải tài liệu ngữ cảnh cá nhân...',
  )
  const [studyReviewStatusMessage, setStudyReviewStatusMessage] = useState(
    'Đang tải ôn tập cá nhân...',
  )
  const [practiceStatusMessage, setPracticeStatusMessage] = useState(
    'Đang tải bài luyện tập...',
  )
  const [tutorStatusMessage, setTutorStatusMessage] =
    useState('Chọn lesson để hỏi AI Tutor.')
  const [isLoadingLesson, setIsLoadingLesson] = useState(false)
  const [isSavingProgress, setIsSavingProgress] = useState(false)
  const [isSavingStudyState, setIsSavingStudyState] = useState(false)
  const [isSavingPracticeAttempt, setIsSavingPracticeAttempt] = useState(false)
  const [isAskingTutor, setIsAskingTutor] = useState(false)
  const [isRecordingExport, setIsRecordingExport] = useState(false)
  const [archivingDocumentId, setArchivingDocumentId] = useState<string | null>(null)
  const [reindexingDocumentId, setReindexingDocumentId] = useState<string | null>(null)
  const learningSummary = useMemo(
    () =>
      buildStudentLearningSummary(
        classes,
        lessons,
        selectedLesson,
        lessonProgressById,
      ),
    [classes, lessonProgressById, lessons, selectedLesson],
  )
  const showClassesPage = activePage === 'student-classes'
  const showLessonsPage = activePage === 'student-lessons'
  const showPracticePage = activePage === 'student-practice'
  const showDocumentsPage = activePage === 'student-documents'
  const selectedLessonProgress = selectedLesson
    ? (lessonProgressById[selectedLesson.id] ?? null)
    : learningSummary.selectedLessonProgress
  const selectedStudentBlock =
    selectedLesson?.blocks.find((block) => block.id === selectedStudentBlockId) ??
    selectedLesson?.blocks[0] ??
    null
  const selectedPresentationSlideIndex = selectedLessonProgress?.current_slide_index ?? 0
  const selectedStudyState = selectedLesson
    ? (studyStateByLessonId[selectedLesson.id] ?? null)
    : null
  const selectedStudyNoteKey =
    selectedLesson && selectedStudentBlock
      ? studyNoteKey(selectedLesson.id, selectedStudentBlock.id)
      : null
  const selectedBlockNote =
    selectedStudyNoteKey === null
      ? ''
      : (draftNotesByKey[selectedStudyNoteKey] ??
        selectedStudyState?.notes_by_block_id[selectedStudentBlock?.id ?? ''] ??
        '')
  const selectedBlockBookmarked = Boolean(
    selectedStudentBlock &&
      selectedStudyState?.bookmarked_block_ids.includes(selectedStudentBlock.id),
  )
  const selectedLessonBookmarkCount =
    selectedStudyState?.bookmarked_block_ids.length ?? 0
  const selectedLessonNoteCount = Object.keys(
    selectedStudyState?.notes_by_block_id ?? {},
  ).length
  const selectedPracticeAttemptKey =
    selectedLesson && selectedStudentBlock && isPracticeBlockType(selectedStudentBlock.type)
      ? practiceAttemptKey(selectedLesson.id, selectedStudentBlock.id)
      : null
  const selectedPracticeAttempt =
    selectedPracticeAttemptKey === null
      ? null
      : (practiceAttemptByKey[selectedPracticeAttemptKey] ?? null)
  const selectedPracticeAnswer =
    selectedPracticeAttemptKey === null
      ? ''
      : (draftPracticeAnswersByKey[selectedPracticeAttemptKey] ??
        selectedPracticeAttempt?.answer_text ??
        '')
  const selectedPracticeStatus =
    selectedPracticeAttemptKey === null
      ? 'not_started'
      : (draftPracticeStatusByKey[selectedPracticeAttemptKey] ??
        selectedPracticeAttempt?.self_check_status ??
        'not_started')

  useEffect(() => {
    let cancelled = false

    async function loadStudentWorkspace() {
      try {
        const [
          classData,
          lessonData,
          documentData,
          reviewItems,
          loadedPracticeItems,
        ] = await Promise.all([
          fetchStudentClasses(token),
          fetchStudentLessons(token),
          fetchDocuments(token),
          fetchStudentStudyReview(token),
          fetchStudentPracticeItems(token),
        ])
        if (!cancelled) {
          const [progressResults, studyStateResults] = await Promise.all([
            Promise.allSettled(
              lessonData.map((lesson) => fetchStudentLessonProgress(lesson.id, token)),
            ),
            Promise.allSettled(
              lessonData.map((lesson) => fetchStudentLessonStudyState(lesson.id, token)),
            ),
          ])
          if (cancelled) {
            return
          }
          setLessonProgressById(
            Object.fromEntries(
              progressResults.flatMap((result) =>
                result.status === 'fulfilled'
                  ? [[result.value.lesson_id, result.value] as const]
                  : [],
              ),
            ),
          )
          setStudyStateByLessonId(
            Object.fromEntries(
              studyStateResults.flatMap((result) =>
                result.status === 'fulfilled'
                  ? [[result.value.lesson_id, result.value] as const]
                  : [],
              ),
            ),
          )
          setClasses(classData)
          setLessons(lessonData)
          setDocuments(documentData)
          setStudyReviewItems(reviewItems)
          setPracticeItems(loadedPracticeItems)
          setStatusMessage(
            classData.length
              ? 'Đã tải danh sách lớp được gán.'
              : 'Chưa được thêm vào lớp nào.',
          )
          setLessonStatusMessage(
            lessonData.length
              ? `Đã tải ${lessonData.length} lesson đã xuất bản.`
              : 'Chưa có lesson nào được xuất bản.',
          )
          setDocumentStatusMessage(
            documentData.length
              ? `Đã tải ${documentData.length} tài liệu ngữ cảnh cá nhân.`
              : 'Chưa có tài liệu ngữ cảnh cá nhân.',
          )
          setStudyReviewStatusMessage(
            reviewItems.length
              ? `Đã tải ${reviewItems.length} mục ôn tập cá nhân.`
              : 'Chưa có bookmark hoặc ghi chú để ôn tập.',
          )
          setPracticeStatusMessage(
            loadedPracticeItems.length
              ? `Đã tải ${loadedPracticeItems.length} bài luyện tập.`
              : 'Lesson đã xuất bản chưa có quiz hoặc bài tập luyện tập.',
          )
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const message = getErrorMessage(error, 'Không tải được không gian sinh viên')
          setStatusMessage(message)
          setLessonStatusMessage(message)
          setDocumentStatusMessage(message)
          setStudyReviewStatusMessage(message)
          setPracticeStatusMessage(message)
        }
      }
    }

    void loadStudentWorkspace()

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    setSelectedStudentBlockId(
      selectedLessonProgress?.current_block_id ??
        selectedLesson?.blocks[0]?.id ??
        null,
    )
  }, [
    selectedLesson?.id,
    selectedLesson?.blocks,
    selectedLessonProgress?.current_block_id,
  ])

  useEffect(() => {
    if (
      selectedLesson === null ||
      selectedStudentBlock === null ||
      selectedPracticeAttemptKey === null ||
      practiceAttemptByKey[selectedPracticeAttemptKey]
    ) {
      return
    }

    const lesson = selectedLesson
    const block = selectedStudentBlock
    let cancelled = false
    async function loadPracticeAttempt() {
      try {
        const attempt = await fetchStudentPracticeAttempt(
          lesson.id,
          block.id,
          token,
        )
        if (cancelled) {
          return
        }
        setPracticeAttemptByKey((current) => ({
          ...current,
          [practiceAttemptKey(attempt.lesson_id, attempt.block_id)]: attempt,
        }))
        setDraftPracticeAnswersByKey((current) => ({
          ...current,
          [practiceAttemptKey(attempt.lesson_id, attempt.block_id)]: attempt.answer_text,
        }))
        setDraftPracticeStatusByKey((current) => ({
          ...current,
          [practiceAttemptKey(attempt.lesson_id, attempt.block_id)]:
            attempt.self_check_status,
        }))
      } catch (error: unknown) {
        if (!cancelled) {
          setPracticeStatusMessage(
            getErrorMessage(error, 'Không tải được self-check luyện tập'),
          )
        }
      }
    }

    void loadPracticeAttempt()

    return () => {
      cancelled = true
    }
  }, [
    practiceAttemptByKey,
    selectedLesson,
    selectedPracticeAttemptKey,
    selectedStudentBlock,
    token,
  ])

  const saveStudentProgress = useCallback(
    async (
      lesson: LessonSession,
      payload: {
        current_block_id?: string | null
        current_slide_index?: number
        completed?: boolean
      },
      successMessage?: string,
    ) => {
      setIsSavingProgress(true)
      try {
        const progress = await updateStudentLessonProgress(
          lesson.id,
          payload,
          token,
        )
        setLessonProgressById((current) => ({
          ...current,
          [progress.lesson_id]: progress,
        }))
        if (successMessage) {
          setLessonStatusMessage(successMessage)
        }
        return progress
      } catch (error: unknown) {
        setLessonStatusMessage(getErrorMessage(error, 'Không lưu được tiến độ học'))
        return null
      } finally {
        setIsSavingProgress(false)
      }
    },
    [token],
  )

  const saveStudentStudyState = useCallback(
    async (
      lesson: LessonSession,
      payload: {
        bookmarked_block_ids: string[]
        notes_by_block_id: Record<string, string>
      },
      successMessage: string,
    ) => {
      setIsSavingStudyState(true)
      try {
        const studyState = await updateStudentLessonStudyState(
          lesson.id,
          payload,
          token,
        )
        setStudyStateByLessonId((current) => ({
          ...current,
          [studyState.lesson_id]: studyState,
        }))
        try {
          const reviewItems = await fetchStudentStudyReview(token)
          setStudyReviewItems(reviewItems)
          setStudyReviewStatusMessage(
            reviewItems.length
              ? `Đã tải ${reviewItems.length} mục ôn tập cá nhân.`
              : 'Chưa có bookmark hoặc ghi chú để ôn tập.',
          )
        } catch (reviewError: unknown) {
          setStudyReviewStatusMessage(
            getErrorMessage(reviewError, 'Không tải lại được ôn tập cá nhân'),
          )
        }
        setLessonStatusMessage(successMessage)
        return studyState
      } catch (error: unknown) {
        setLessonStatusMessage(
          getErrorMessage(error, 'Không lưu được ghi chú học tập'),
        )
        return null
      } finally {
        setIsSavingStudyState(false)
      }
    },
    [token],
  )

  async function handleStudentDocumentUploaded(response: DocumentUploadResponse) {
    try {
      const documentData = await fetchDocuments(token)
      setDocuments(documentData)
    } catch (error: unknown) {
      setDocuments((current) => [
        response.document,
        ...current.filter((document) => document.id !== response.document.id),
      ])
      setDocumentStatusMessage(
        getErrorMessage(
          error,
          'Upload xong nhưng không tải lại được tài liệu ngữ cảnh cá nhân',
        ),
      )
    }

    setDocumentStatusMessage(documentUploadStatusMessage(response))
  }

  async function handleStudentArchiveDocument(document: SourceDocument) {
    setArchivingDocumentId(document.id)
    try {
      const archivedDocument = await archiveDocument(document.id, token)
      setDocuments((current) =>
        current.map((candidate) =>
          candidate.id === archivedDocument.id ? archivedDocument : candidate,
        ),
      )
      setDocumentStatusMessage(`Đã archive tài liệu ngữ cảnh ${archivedDocument.title}.`)
    } catch (error: unknown) {
      setDocumentStatusMessage(
        getErrorMessage(error, 'Không archive được tài liệu ngữ cảnh cá nhân'),
      )
    } finally {
      setArchivingDocumentId(null)
    }
  }

  async function handleStudentReindexDocument(document: SourceDocument) {
    setReindexingDocumentId(document.id)
    try {
      const result = await reindexDocument(document.id, token)
      setDocuments((current) =>
        current.map((candidate) =>
          candidate.id === result.document.id ? result.document : candidate,
        ),
      )
      setDocumentStatusMessage(result.message)
    } catch (error: unknown) {
      setDocumentStatusMessage(
        getErrorMessage(error, 'Không re-index được tài liệu ngữ cảnh cá nhân'),
      )
    } finally {
      setReindexingDocumentId(null)
    }
  }

  async function handleOpenLesson(lesson: LessonSession, targetBlockId?: string) {
    setIsLoadingLesson(true)
    setLessonStatusMessage('Đang tải lesson...')
    try {
      const [lessonDetail, progress, studyState] = await Promise.all([
        fetchStudentLesson(lesson.id, token),
        fetchStudentLessonProgress(lesson.id, token),
        fetchStudentLessonStudyState(lesson.id, token),
      ])
      const preferredBlockId =
        targetBlockId &&
        lessonDetail.blocks.some((block) => block.id === targetBlockId)
          ? targetBlockId
          : null
      const preferredSlideIndex =
        preferredBlockId === null
          ? null
          : lessonDetail.blocks.findIndex((block) => block.id === preferredBlockId) + 1
      const resumeBlockId =
        preferredBlockId ?? progress.current_block_id ?? lessonDetail.blocks[0]?.id ?? null
      const resumeSlideIndex =
        preferredSlideIndex !== null && preferredSlideIndex >= 0
          ? preferredSlideIndex
          : progress.current_slide_index
      const openedProgress = await updateStudentLessonProgress(
        lesson.id,
        {
          current_block_id: resumeBlockId,
          current_slide_index: resumeSlideIndex,
          completed: false,
        },
        token,
      )
      setSelectedLesson(lessonDetail)
      setLessonProgressById((current) => ({
        ...current,
        [openedProgress.lesson_id]: openedProgress,
      }))
      setStudyStateByLessonId((current) => ({
        ...current,
        [studyState.lesson_id]: studyState,
      }))
      setSelectedStudentBlockId(
        preferredBlockId ??
          openedProgress.current_block_id ??
          lessonDetail.blocks[0]?.id ??
          null,
      )
      setTutorAnswer(null)
      setTutorQuestion('')
      setTutorStatusMessage('Sẵn sàng hỏi AI Tutor theo lesson này.')
      setLessonStatusMessage(`Đã tải ${lessonDetail.title} và lưu vị trí học.`)
    } catch (error: unknown) {
      setLessonStatusMessage(getErrorMessage(error, 'Không tải được lesson'))
    } finally {
      setIsLoadingLesson(false)
    }
  }

  function handleOpenStudyReviewItem(item: LessonStudyReviewItem) {
    const lesson = lessons.find((candidate) => candidate.id === item.lesson_id)
    if (!lesson) {
      setStudyReviewStatusMessage('Không tìm thấy lesson tương ứng trong danh sách.')
      return
    }
    void handleOpenLesson(lesson, item.block_id)
  }

  function handleOpenPracticeItem(item: LessonPracticeItem) {
    const lesson = lessons.find((candidate) => candidate.id === item.lesson_id)
    if (!lesson) {
      setPracticeStatusMessage('Không tìm thấy lesson tương ứng trong danh sách.')
      return
    }
    void handleOpenLesson(lesson, item.block_id)
  }

  function handleStudentBlockSelect(block: LessonBlock) {
    setSelectedStudentBlockId(block.id)
    setTutorAnswer(null)
    if (!selectedLesson) {
      return
    }
    const selectedBlockSlideIndex =
      selectedLesson.blocks.findIndex((candidate) => candidate.id === block.id) + 1
    void saveStudentProgress(
      selectedLesson,
      {
        current_block_id: block.id,
        current_slide_index:
          selectedBlockSlideIndex > 0
            ? selectedBlockSlideIndex
            : selectedPresentationSlideIndex,
        completed: false,
      },
      `Đã lưu vị trí: ${block.title}.`,
    )
  }

  function handleStudyNoteChange(lesson: LessonSession, block: LessonBlock, note: string) {
    const key = studyNoteKey(lesson.id, block.id)
    setDraftNotesByKey((current) => ({
      ...current,
      [key]: note,
    }))
  }

  function handleToggleBookmark(lesson: LessonSession, block: LessonBlock) {
    const currentState = studyStateByLessonId[lesson.id]
    const bookmarks = currentState?.bookmarked_block_ids ?? []
    const nextBookmarks = bookmarks.includes(block.id)
      ? bookmarks.filter((blockId) => blockId !== block.id)
      : [...bookmarks, block.id]
    void saveStudentStudyState(
      lesson,
      {
        bookmarked_block_ids: nextBookmarks,
        notes_by_block_id: currentState?.notes_by_block_id ?? {},
      },
      nextBookmarks.includes(block.id)
        ? `Đã đánh dấu ${block.title}.`
        : `Đã bỏ đánh dấu ${block.title}.`,
    )
  }

  async function handleSaveStudyNote(lesson: LessonSession, block: LessonBlock) {
    const currentState = studyStateByLessonId[lesson.id]
    const note = selectedBlockNote.trim()
    const nextNotes = { ...(currentState?.notes_by_block_id ?? {}) }
    if (note) {
      nextNotes[block.id] = note
    } else {
      delete nextNotes[block.id]
    }
    const saved = await saveStudentStudyState(
      lesson,
      {
        bookmarked_block_ids: currentState?.bookmarked_block_ids ?? [],
        notes_by_block_id: nextNotes,
      },
      note ? `Đã lưu ghi chú cho ${block.title}.` : `Đã xóa ghi chú cho ${block.title}.`,
    )
    if (saved) {
      const key = studyNoteKey(lesson.id, block.id)
      setDraftNotesByKey((current) => ({
        ...current,
        [key]: saved.notes_by_block_id[block.id] ?? '',
      }))
    }
  }

  function handlePracticeAnswerChange(
    lesson: LessonSession,
    block: LessonBlock,
    answer: string,
  ) {
    const key = practiceAttemptKey(lesson.id, block.id)
    setDraftPracticeAnswersByKey((current) => ({
      ...current,
      [key]: answer,
    }))
  }

  function handlePracticeStatusChange(
    lesson: LessonSession,
    block: LessonBlock,
    status: PracticeSelfCheckStatus,
  ) {
    const key = practiceAttemptKey(lesson.id, block.id)
    setDraftPracticeStatusByKey((current) => ({
      ...current,
      [key]: status,
    }))
  }

  async function handleSavePracticeAttempt(
    lesson: LessonSession,
    block: LessonBlock,
  ) {
    if (!isPracticeBlockType(block.type)) {
      setPracticeStatusMessage('Block này không phải quiz hoặc bài tập luyện tập.')
      return
    }
    setIsSavingPracticeAttempt(true)
    const key = practiceAttemptKey(lesson.id, block.id)
    try {
      const attempt = await updateStudentPracticeAttempt(
        lesson.id,
        block.id,
        {
          answer_text: selectedPracticeAnswer,
          self_check_status: selectedPracticeStatus,
        },
        token,
      )
      setPracticeAttemptByKey((current) => ({
        ...current,
        [key]: attempt,
      }))
      setDraftPracticeAnswersByKey((current) => ({
        ...current,
        [key]: attempt.answer_text,
      }))
      setDraftPracticeStatusByKey((current) => ({
        ...current,
        [key]: attempt.self_check_status,
      }))
      setPracticeItems((current) =>
        current.map((item) =>
          item.lesson_id === attempt.lesson_id && item.block_id === attempt.block_id
            ? {
                ...item,
                self_check_status: attempt.self_check_status,
                attempt_count: attempt.attempt_count,
                attempt_updated_at: attempt.updated_at,
              }
            : item,
        ),
      )
      setPracticeStatusMessage(
        `Đã lưu self-check: ${practiceStatusLabel(attempt.self_check_status)}.`,
      )
    } catch (error: unknown) {
      setPracticeStatusMessage(getErrorMessage(error, 'Không lưu được self-check'))
    } finally {
      setIsSavingPracticeAttempt(false)
    }
  }

  async function handleAskTutor() {
    if (!selectedLesson) {
      setTutorStatusMessage('Chọn lesson trước khi hỏi AI Tutor.')
      return
    }
    const question = tutorQuestion.trim()
    if (question.length < 3) {
      setTutorStatusMessage('Câu hỏi cần rõ hơn một chút.')
      return
    }

    setIsAskingTutor(true)
    setTutorStatusMessage('Đang tạo câu trả lời có citation...')
    try {
      const answer = await askStudentLessonTutor(
        selectedLesson.id,
        {
          question,
          block_id: selectedStudentBlock?.id ?? null,
        },
        token,
      )
      setTutorAnswer(answer)
      setTutorStatusMessage(
        answer.warning
          ? 'Câu trả lời cần kiểm tra thêm bằng citation.'
          : 'Đã tạo câu trả lời từ lesson này.',
      )
    } catch (error: unknown) {
      setTutorStatusMessage(getErrorMessage(error, 'Không tạo được câu trả lời tutor'))
    } finally {
      setIsAskingTutor(false)
    }
  }

  const handleStudentSlideChange = useCallback(
    (slide: LessonSlide, slideIndex: number) => {
      if (!selectedLesson) {
        return
      }
      const slideBlockId = selectedLesson.blocks.some((block) => block.id === slide.id)
        ? slide.id
        : (selectedLesson.blocks[0]?.id ?? null)
      void saveStudentProgress(selectedLesson, {
        current_block_id: slideBlockId,
        current_slide_index: slideIndex,
        completed: false,
      })
    },
    [saveStudentProgress, selectedLesson],
  )

  async function recordStudentPdfExport(lesson: LessonSession) {
    setIsRecordingExport(true)
    try {
      await recordLessonExport(
        lesson.id,
        {
          export_format: 'pdf',
          delivery: 'print',
          file_name: `${lesson.title}.pdf`,
          client_metadata: { source: 'student_reader' },
        },
        token,
      )
      setLessonStatusMessage('Đã ghi lịch sử export PDF.')
    } catch (error: unknown) {
      setLessonStatusMessage(getErrorMessage(error, 'Không ghi được export PDF'))
      throw error
    } finally {
      setIsRecordingExport(false)
    }
  }

  async function handleStudentPdfPrint(lesson: LessonSession) {
    try {
      await recordStudentPdfExport(lesson)
      window.print()
    } catch {
      // recordStudentPdfExport already writes a user-facing status message.
    }
  }

  return (
    <section
      className={`panel learning-panel v4-student-workspace student-design-page student-design-${activePage}`}
      id={WORKSPACE_SECTION_IDS.studentClasses}
      tabIndex={-1}
    >
      {showClassesPage && (
        <div className="student-design-classes">
          <div className="v4-student-hero">
            <div>
              <p className="section-label">Không gian học tập</p>
              <h2>Học bài đã xuất bản, không lẫn công cụ của giảng viên</h2>
              <p className="muted">
                {learningSummary.classContext
                  ? `${learningSummary.classContext.class_name} - ${learningSummary.classContext.course_title}`
                  : statusMessage}
              </p>
            </div>
            {learningSummary.continueLesson ? (
              <button
                className="primary-button"
                disabled={isLoadingLesson}
                type="button"
                onClick={() => {
                  const lesson = learningSummary.continueLesson
                  if (lesson) {
                    void handleOpenLesson(lesson)
                  }
                }}
              >
                <BookOpen aria-hidden="true" size={17} />
                Tiếp tục học
              </button>
            ) : (
              <span className="status-pill neutral-pill">Chờ lesson published</span>
            )}
          </div>

          <div className="v4-metric-grid v4-student-metrics">
            <MetricCard
              detail="Class membership từ API"
              label="Lớp đang học"
              value={String(learningSummary.classCount)}
            />
            <MetricCard
              detail={lessonStatusMessage}
              label="Lesson published"
              tone="success"
              value={String(learningSummary.publishedLessonCount)}
            />
            <MetricCard
              detail={`${learningSummary.startedLessonCount}/${learningSummary.publishedLessonCount} lesson đã mở`}
              label="Tiến độ học"
              tone={learningSummary.averageProgressPercent ? 'info' : 'default'}
              value={`${learningSummary.averageProgressPercent}%`}
            />
            <MetricCard
              detail={
                learningSummary.selectedLessonMetrics
                  ? `${learningSummary.selectedLessonMetrics.citationCount} citation trong lesson tiếp tục`
                  : 'Chưa mở lesson'
              }
              label="Hoàn thành"
              tone={learningSummary.completedLessonCount ? 'success' : 'default'}
              value={`${learningSummary.completedLessonCount}/${learningSummary.publishedLessonCount}`}
            />
          </div>
        </div>
      )}

      {showClassesPage && (
        <section className="v4-student-review-hub" aria-labelledby="student-review-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">Ôn tập cá nhân</p>
            <h3 id="student-review-title">Bookmark và ghi chú cần quay lại</h3>
          </div>
          <span className="status-pill info-pill">
            {studyReviewItems.length} mục
          </span>
        </div>
        <p className="state-panel compact-state">{studyReviewStatusMessage}</p>
        {studyReviewItems.length > 0 ? (
          <div className="v4-student-review-list">
            {studyReviewItems.map((item) => (
              <button
                className="v4-student-review-item"
                key={`${item.lesson_id}:${item.block_id}`}
                type="button"
                onClick={() => handleOpenStudyReviewItem(item)}
              >
                <span className="review-icon">
                  {item.bookmarked ? (
                    <Bookmark aria-hidden="true" size={17} />
                  ) : (
                    <FileText aria-hidden="true" size={17} />
                  )}
                </span>
                <span>
                  <strong>{item.block_title}</strong>
                  <small>
                    {item.lesson_title} - {blockTypeLabel(item.block_type)} -{' '}
                    {item.citation_count} citation
                  </small>
                  {item.note && <em>{item.note}</em>}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="v4-empty-inline">
            <Bookmark aria-hidden="true" size={16} />
            Bookmark hoặc lưu ghi chú trong lesson để tạo danh sách ôn tập.
          </div>
        )}
        </section>
      )}

      {showPracticePage && (
        <section
        className="v4-student-review-hub v4-student-practice-hub student-design-practice"
        aria-labelledby="student-practice-title"
        id={WORKSPACE_SECTION_IDS.studentPractice}
        tabIndex={-1}
      >
        <div className="panel-heading">
          <div>
            <p className="section-label">Luyện tập</p>
            <h3 id="student-practice-title">Quiz và bài tập từ lesson đã học</h3>
          </div>
          <span className="status-pill info-pill">
            {practiceItems.length} bài
          </span>
        </div>
        <p className="state-panel compact-state">{practiceStatusMessage}</p>
        {practiceItems.length > 0 ? (
          <div className="v4-student-review-list">
            {practiceItems.map((item) => (
              <button
                className={`v4-student-review-item ${
                  item.self_check_status !== 'not_started' ? 'attempted' : ''
                }`}
                key={`${item.lesson_id}:${item.block_id}`}
                type="button"
                onClick={() => handleOpenPracticeItem(item)}
              >
                <span className="review-icon practice-icon">
                  <ClipboardCheck aria-hidden="true" size={17} />
                </span>
                <span>
                  <strong>{item.block_title}</strong>
                  <small>
                    {item.lesson_title} - {blockTypeLabel(item.block_type)} -{' '}
                    {item.citation_count} citation
                  </small>
                  <small className="practice-attempt-summary">
                    {practiceStatusLabel(item.self_check_status)}
                    {item.attempt_count > 0
                      ? ` - ${item.attempt_count} lần tự kiểm tra`
                      : ''}
                    {item.attempt_updated_at
                      ? ` - ${formatStudyUpdatedAt(item.attempt_updated_at)}`
                      : ''}
                  </small>
                  <em>{item.prompt}</em>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="v4-empty-inline">
            <ClipboardCheck aria-hidden="true" size={16} />
            Lesson đã xuất bản chưa có quiz hoặc bài tập để luyện tập.
          </div>
        )}
        </section>
      )}

      {showDocumentsPage && (
        <section
        className="knowledge-panel student-context-panel student-design-documents"
        id={WORKSPACE_SECTION_IDS.studentKnowledge}
        tabIndex={-1}
      >
        <div className="panel-heading">
          <p className="section-label">Tài liệu ngữ cảnh cá nhân</p>
          <span className="status-pill neutral-pill">Context</span>
        </div>
        <KnowledgeUploadPanel
          idleMessage="Chưa chọn PDF ngữ cảnh cá nhân."
          pdfLabel="PDF ngữ cảnh"
          submitLabel="Upload ngữ cảnh"
          token={token}
          urlLabel="URL ngữ cảnh"
          urlSubmitLabel="Ingest ngữ cảnh"
          onUploaded={handleStudentDocumentUploaded}
        />
        <p className="state-panel compact-state">{documentStatusMessage}</p>
        {documents.length > 0 ? (
          <DocumentStatusList
            busyDocumentId={archivingDocumentId}
            busyReindexDocumentId={reindexingDocumentId}
            documents={documents}
            onArchive={(document) => void handleStudentArchiveDocument(document)}
            onReindex={(document) => void handleStudentReindexDocument(document)}
          />
        ) : (
          <p className="muted">
            Tài liệu này chỉ dùng làm ngữ cảnh cá nhân, không nhập vào library dài hạn.
          </p>
        )}
        </section>
      )}

      {showLessonsPage && (
        <div className="v4-student-grid student-design-reader-grid">
        <aside className="v4-student-sidebar">
          <div className="v4-panel-title">
            <span>Lớp của tôi</span>
            <strong>{classes.length}</strong>
          </div>
          {classes.length > 0 ? (
            <div className="v4-student-class-stack">
              {classes.map((classSummary) => (
                <article className="v4-student-class-card" key={classSummary.class_id}>
                  <strong>{classSummary.class_name}</strong>
                  <span>{classSummary.course_title}</span>
                  <small>
                    {studentLevelLabel(classSummary.student_level)} -{' '}
                    {classSummary.session_count} buổi x{' '}
                    {classSummary.minutes_per_session} phút
                  </small>
                </article>
              ))}
            </div>
          ) : (
            <div className="v4-empty-inline">{statusMessage}</div>
          )}

          <div
            className="v4-student-lesson-list"
            id={WORKSPACE_SECTION_IDS.studentLessons}
            tabIndex={-1}
          >
            <div className="v4-panel-title">
              <span>Lesson đã xuất bản</span>
              <strong>{lessons.length}</strong>
            </div>
            <p className="state-panel compact-state">{lessonStatusMessage}</p>
            {lessons.map((lesson) => {
              const progress = lessonProgressById[lesson.id]
              const studyState = studyStateByLessonId[lesson.id]
              return (
                <button
                  className={`v4-student-lesson-button ${
                    selectedLesson?.id === lesson.id ? 'selected' : ''
                  }`}
                  disabled={isLoadingLesson}
                  key={lesson.id}
                  type="button"
                  onClick={() => void handleOpenLesson(lesson)}
                >
                  <BookOpen aria-hidden="true" size={17} />
                  <span>
                    <strong>{lesson.title}</strong>
                    <small>
                      Buổi {lesson.outline_session_index} - {lesson.blocks.length}{' '}
                      block - {studyState?.bookmarked_block_ids.length ?? 0} đánh dấu
                    </small>
                  </span>
                  <em className="v2-progress-chip">
                    {progress?.completed_at
                      ? 'Xong'
                      : `${progress?.progress_percent ?? 0}%`}
                  </em>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="v4-student-reader" aria-label="Student reading view">
          {!selectedLesson ? (
            <div className="v4-empty-inline">
              <BookOpen aria-hidden="true" size={18} />
              Chọn lesson đã xuất bản để mở chế độ đọc.
            </div>
          ) : (
            <>
              <div className="v4-student-reader-header">
                <div>
                  <p className="section-label">Reading mode</p>
                  <h2>{selectedLesson.title}</h2>
                  <span>
                    {selectedLessonProgress?.completed_at
                      ? 'Đã hoàn thành'
                      : `${selectedLessonProgress?.progress_percent ?? 0}% đã học`}
                    {' - '}
                    {selectedLessonBookmarkCount} đánh dấu, {selectedLessonNoteCount}{' '}
                    ghi chú
                  </span>
                </div>
                <div className="presentation-controls v4-student-reader-actions">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() =>
                      document
                        .querySelector('.v4-student-reader .presentation-panel')
                        ?.scrollIntoView({ block: 'start', behavior: 'smooth' })
                    }
                  >
                    <MonitorPlay aria-hidden="true" size={17} />
                    Chế độ trình bày
                  </button>
                  <button
                    className="primary-button"
                    disabled={isRecordingExport}
                    type="button"
                    onClick={() => void handleStudentPdfPrint(selectedLesson)}
                  >
                    <Printer aria-hidden="true" size={17} />
                    {isRecordingExport ? 'Đang ghi export...' : 'Tải PDF'}
                  </button>
                  <button
                    className="ghost-button"
                    disabled={isSavingProgress}
                    type="button"
                    onClick={() =>
                      void saveStudentProgress(
                        selectedLesson,
                        {
                          current_block_id:
                            selectedStudentBlock?.id ??
                            selectedLesson.blocks[0]?.id ??
                            null,
                          current_slide_index: selectedPresentationSlideIndex,
                          completed: true,
                        },
                        'Đã đánh dấu hoàn thành lesson.',
                      )
                    }
                  >
                    <CheckCircle2 aria-hidden="true" size={17} />
                    Hoàn thành
                  </button>
                </div>
              </div>

              <div className="v2-student-progress-bar" aria-hidden="true">
                <span
                  style={{
                    width: `${selectedLessonProgress?.progress_percent ?? 0}%`,
                  }}
                />
              </div>

              <LessonPresentation
                initialSlideIndex={selectedPresentationSlideIndex}
                isExportingPdf={isRecordingExport}
                lesson={selectedLesson}
                onPdfExport={() => recordStudentPdfExport(selectedLesson)}
                onSlideChange={handleStudentSlideChange}
              />

              <div className="v4-student-reading-grid">
                <nav className="v4-student-block-nav" aria-label="Lesson blocks">
                  {selectedLesson.blocks.map((block, index) => (
                    <button
                      className={selectedStudentBlock?.id === block.id ? 'selected' : ''}
                      key={block.id}
                      type="button"
                      onClick={() => handleStudentBlockSelect(block)}
                    >
                      <span>{index + 1}</span>
                      <strong>{block.title}</strong>
                      <small>{blockTypeLabel(block.type)}</small>
                    </button>
                  ))}
                </nav>

                {selectedStudentBlock && (
                  <div className="v4-student-reading-main">
                    <article className="v4-student-reading-card">
                      <div className="lesson-block-header">
                        <span>{blockTypeLabel(selectedStudentBlock.type)}</span>
                        <strong>{blockStatusLabel(selectedStudentBlock.status)}</strong>
                      </div>
                      <h3>{selectedStudentBlock.title}</h3>
                      <p>{selectedStudentBlock.content}</p>
                      {selectedStudentBlock.warning && (
                        <div className="v4-warning-box">
                          <AlertTriangle aria-hidden="true" size={17} />
                          <span>{selectedStudentBlock.warning}</span>
                        </div>
                      )}
                    </article>

                    <aside className="v4-student-study-panel student-design-tutor-panel">
                      <div className="v4-panel-title">
                        <span>Ghi chú học tập</span>
                        <strong>
                          {selectedBlockBookmarked ? 'Đã đánh dấu' : 'Cá nhân'}
                        </strong>
                      </div>
                      <button
                        className={
                          selectedBlockBookmarked ? 'primary-button' : 'ghost-button'
                        }
                        disabled={isSavingStudyState}
                        type="button"
                        onClick={() =>
                          handleToggleBookmark(selectedLesson, selectedStudentBlock)
                        }
                      >
                        <Bookmark aria-hidden="true" size={17} />
                        {selectedBlockBookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu block'}
                      </button>
                      <label>
                        <span>Ghi chú riêng cho block này</span>
                        <textarea
                          disabled={isSavingStudyState}
                          maxLength={4000}
                          placeholder="Viết điều cần nhớ, câu hỏi hoặc ví dụ muốn ôn lại..."
                          value={selectedBlockNote}
                          onChange={(event) =>
                            handleStudyNoteChange(
                              selectedLesson,
                              selectedStudentBlock,
                              event.currentTarget.value,
                            )
                          }
                        />
                      </label>
                      <div className="lesson-submit-row">
                        <button
                          className="primary-button"
                          disabled={isSavingStudyState}
                          type="button"
                          onClick={() =>
                            void handleSaveStudyNote(
                              selectedLesson,
                              selectedStudentBlock,
                            )
                          }
                        >
                          <Save aria-hidden="true" size={17} />
                          {isSavingStudyState ? 'Đang lưu...' : 'Lưu ghi chú'}
                        </button>
                        <span>
                          {selectedStudyState?.updated_at
                            ? `Cập nhật ${formatStudyUpdatedAt(
                                selectedStudyState.updated_at,
                              )}`
                            : 'Chưa có ghi chú đã lưu'}
                        </span>
                      </div>
                    </aside>

                    <aside className="v4-student-study-panel v4-student-tutor-panel student-design-tutor-panel">
                      <div className="v4-panel-title">
                        <span>AI Tutor có citation</span>
                        <strong>
                          {tutorAnswer?.citations.length ??
                            selectedStudentBlock?.citations.length ??
                            0}{' '}
                          nguồn
                        </strong>
                      </div>
                      <label>
                        <span>Câu hỏi của tôi</span>
                        <textarea
                          disabled={isAskingTutor}
                          maxLength={1000}
                          placeholder="Hỏi về block hoặc lesson đang học..."
                          value={tutorQuestion}
                          onChange={(event) =>
                            setTutorQuestion(event.currentTarget.value)
                          }
                        />
                      </label>
                      <div className="lesson-submit-row">
                        <button
                          className="primary-button"
                          disabled={isAskingTutor}
                          type="button"
                          onClick={() => void handleAskTutor()}
                        >
                          <Sparkles aria-hidden="true" size={17} />
                          {isAskingTutor ? 'Đang trả lời...' : 'Hỏi AI Tutor'}
                        </button>
                        <span>{tutorStatusMessage}</span>
                      </div>
                      {tutorAnswer && (
                        <div className="v4-tutor-answer">
                          {tutorAnswer.warning && (
                            <div className="v4-warning-inline">
                              <AlertTriangle aria-hidden="true" size={15} />
                              {tutorAnswer.warning}
                            </div>
                          )}
                          <p>{tutorAnswer.answer}</p>
                          {tutorAnswer.citations.length > 0 && (
                            <div className="v4-tutor-citations">
                              {tutorAnswer.citations.map((citation) => (
                                <span key={citation.chunk_id}>
                                  {citation.document_title} - trang{' '}
                                  {citation.page_number ?? 'n/a'}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </aside>

                    {isPracticeBlockType(selectedStudentBlock.type) && (
                      <aside className="v4-student-study-panel v4-practice-attempt-panel">
                        <div className="v4-panel-title">
                          <span>Self-check luyện tập</span>
                          <strong>{practiceStatusLabel(selectedPracticeStatus)}</strong>
                        </div>
                        <p className="muted">
                          Đây là tự đánh giá của học viên, không phải AI chấm điểm.
                        </p>
                        <label>
                          <span>Câu trả lời hoặc cách giải của tôi</span>
                          <textarea
                            disabled={isSavingPracticeAttempt}
                            maxLength={4000}
                            placeholder="Viết câu trả lời, cách nghĩ hoặc điểm chưa chắc chắn..."
                            value={selectedPracticeAnswer}
                            onChange={(event) =>
                              handlePracticeAnswerChange(
                                selectedLesson,
                                selectedStudentBlock,
                                event.currentTarget.value,
                              )
                            }
                          />
                        </label>
                        <div
                          className="v4-self-check-options"
                          role="group"
                          aria-label="Trạng thái tự đánh giá"
                        >
                          {(
                            [
                              'not_started',
                              'needs_review',
                              'got_it',
                            ] satisfies PracticeSelfCheckStatus[]
                          ).map((status) => (
                            <button
                              className={
                                selectedPracticeStatus === status ? 'selected' : ''
                              }
                              disabled={isSavingPracticeAttempt}
                              key={status}
                              type="button"
                              onClick={() =>
                                handlePracticeStatusChange(
                                  selectedLesson,
                                  selectedStudentBlock,
                                  status,
                                )
                              }
                            >
                              {practiceStatusLabel(status)}
                            </button>
                          ))}
                        </div>
                        <div className="lesson-submit-row">
                          <button
                            className="primary-button"
                            disabled={isSavingPracticeAttempt}
                            type="button"
                            onClick={() =>
                              void handleSavePracticeAttempt(
                                selectedLesson,
                                selectedStudentBlock,
                              )
                            }
                          >
                            <Save aria-hidden="true" size={17} />
                            {isSavingPracticeAttempt
                              ? 'Đang lưu...'
                              : 'Lưu self-check'}
                          </button>
                          <span>
                            {selectedPracticeAttempt?.updated_at
                              ? `${selectedPracticeAttempt.attempt_count} lần - ${formatStudyUpdatedAt(
                                  selectedPracticeAttempt.updated_at,
                                )}`
                              : 'Chưa có self-check đã lưu'}
                          </span>
                        </div>
                      </aside>
                    )}
                  </div>
                )}

                <aside className="v4-citation-panel v4-student-citation-panel">
                  <div className="v4-panel-title">
                    <span>Trích dẫn</span>
                    <strong>{selectedStudentBlock?.citations.length ?? 0}</strong>
                  </div>
                  {selectedStudentBlock?.citations.length ? (
                    <div className="v4-citation-list">
                      {selectedStudentBlock.citations.map((citation) => (
                        <article key={citation.chunk_id}>
                          <div>
                            <strong>{citation.document_title}</strong>
                            <small>
                              Trang {citation.page_number ?? 'n/a'} - chunk{' '}
                              {citation.chunk_index} - {citation.score.toFixed(2)}
                            </small>
                            {citation.source_url && (
                              <a
                                href={citation.source_url}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {citation.source_url}
                              </a>
                            )}
                          </div>
                          <p>{citation.excerpt}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="v4-empty-inline">
                      <FileText aria-hidden="true" size={16} />
                      Block này chưa có citation.
                    </div>
                  )}
                </aside>
              </div>
            </>
          )}
        </section>
        </div>
      )}

      {showClassesPage && (
        <div className="v4-future-slots" aria-label="Tinh nang hoc tap tuong lai">
        {learningSummary.futureSlots.map((slot) => (
          <article className="v4-future-slot" key={slot.id}>
            <span>{slot.label}</span>
            <strong>Chưa kích hoạt</strong>
            <small>{slot.description}</small>
          </article>
        ))}
        </div>
      )}
    </section>
  )
}
