import { type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  ArchiveX,
  ChevronRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Library,
  MonitorPlay,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  XCircle,
} from 'lucide-react'
import {
  addStudentToClass,
  archiveClassProfile,
  archiveDocument,
  archiveLessonSession,
  createClassProfile,
  createCourse,
  fetchClassOutlines,
  fetchCourseClasses,
  fetchCourses,
  fetchDocuments,
  fetchGenerationJobs,
  fetchLessonAuditEvents,
  fetchLessonExportRecords,
  fetchStudents,
  fetchTeacherClassProgress,
  fetchTeacherLessons,
  generateLessonBlocks,
  generateOutline,
  reindexDocument,
  regenerateLessonBlock,
  recordLessonExport,
  retrieveChunks,
  setLessonBlockStatus,
  submitLesson,
  updateClassProfile,
  updateLessonBlock,
  updateLessonSession,
  updateOutlineSession,
  type ClassCreatePayload,
  type ClassProfile,
  type Course,
  type CourseCreatePayload,
  type CourseOutline,
  type DocumentUploadResponse,
  type GenerationJob,
  type LessonAuditEvent,
  type LessonBlock,
  type LessonExportFormat,
  type LessonExportRecord,
  type LessonSession,
  type OutlineSession,
  type OutlineSessionUpdatePayload,
  type RetrievalResponse,
  type SourceDocument,
  type StudentProfile,
  type TeacherLessonProgressSummary,
} from '../../api/learning'
import { getErrorMessage } from '../../errors'
import { LessonPresentation } from '../../presentation/LessonPresentation'
import {
  blockStatusLabel,
  blockTypeLabel,
  displayName,
  lessonStatusLabel,
  roleLabel,
  studentLevelLabel,
} from '../../labels'
import {
  buildTeacherFirstLessonGuide,
  buildTeacherWorkflowSteps,
  buildTeacherWorkspaceMetrics,
  type TeacherWorkflowStep,
} from '../teacherWorkspace'
import { KnowledgeUploadPanel } from '../knowledge/KnowledgeControls'
import {
  documentGovernanceLabels,
  documentStatusLabel,
  isSourceDocumentUsable,
} from '../knowledge/knowledgeHelpers'
import {
  CitationInspector,
  JobQueue,
  MetricCard,
  SourceStrip,
  WorkflowTimeline,
} from '../../ui/teacherWorkspace'
import type { WorkspacePageId } from '../../workspacePages'
import { buildLessonMarkdown, markdownFileName } from '../../lessonMarkdown'
import { exportLessonPptx } from '../../lessonPptx'
import { documentUploadStatusMessage } from '../../uploadStatus'
import { WORKSPACE_SECTION_IDS } from '../../workspaceActionTargets'

const DEFAULT_COURSE: CourseCreatePayload = {
  title: 'Nhập môn Trí tuệ nhân tạo',
  description: 'Khóa học demo về nền tảng AI và ứng dụng trong thực tế.',
  learning_goals: 'Hiểu khái niệm AI cốt lõi và biết liên hệ với sản phẩm thực tế.',
  teaching_language: 'Tiếng Việt',
}
const DEFAULT_CLASS: ClassCreatePayload = {
  name: 'KTPM-K18',
  student_level: 'average',
  background_knowledge: 'Sinh viên đã học lập trình cơ bản.',
  session_count: 12,
  minutes_per_session: 90,
  teaching_style: 'Giải thích trực quan, nhiều ví dụ và hoạt động ngắn.',
}
const DEFAULT_RAG_TOPIC = 'Kiến trúc Transformer'

const TEACHER_CREATION_ACTIONS: Array<{
  Icon: typeof FileText
  description: string
  label: string
  page: WorkspacePageId
  tone: 'violet' | 'orange' | 'green' | 'blue'
}> = [
  {
    Icon: FileText,
    description: 'Tạo dàn ý và bài giảng từ nguồn đã chọn',
    label: 'Giáo án',
    page: 'teacher-outline',
    tone: 'violet',
  },
  {
    Icon: MonitorPlay,
    description: 'Mở presentation và export slide',
    label: 'Slide',
    page: 'teacher-studio',
    tone: 'orange',
  },
  {
    Icon: Library,
    description: 'Upload PDF hoặc URL làm nguồn cho AI',
    label: 'Tài liệu',
    page: 'teacher-documents',
    tone: 'green',
  },
  {
    Icon: ClipboardCheck,
    description: 'Review quiz, self-check và hoạt động',
    label: 'Luyện tập',
    page: 'teacher-studio',
    tone: 'blue',
  },
]

function auditActionLabel(action: string): string {
  const labels: Record<string, string> = {
    lesson_generated: 'Tạo nội dung bài giảng',
    block_edited: 'Sửa khối nội dung',
    block_status_changed: 'Đổi trạng thái khối nội dung',
    block_regenerated: 'Tạo lại khối nội dung',
    lesson_submitted: 'Gửi Admin duyệt',
    lesson_published: 'Xuất bản bài giảng',
    changes_requested: 'Yêu cầu chỉnh sửa',
    lesson_rejected: 'Từ chối bài giảng',
  }

  return labels[action] ?? action.replaceAll('_', ' ')
}

function exportFormatLabel(format: LessonExportFormat): string {
  const labels: Record<LessonExportFormat, string> = {
    markdown: 'Markdown',
    pptx: 'PPTX',
    pdf: 'PDF',
  }

  return labels[format]
}

function exportDeliveryLabel(delivery: LessonExportRecord['delivery']): string {
  return delivery === 'print' ? 'Print/PDF' : 'Download'
}

function linesToArray(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function arrayToLines(value: string[]): string {
  return value.join('\n')
}

function sessionToDraft(session: OutlineSession): OutlineSessionUpdatePayload {
  return {
    title: session.title,
    learning_objectives: session.learning_objectives,
    key_topics: session.key_topics,
    teaching_activities: session.teaching_activities,
    suggested_exercises: session.suggested_exercises,
    adaptation_notes: session.adaptation_notes,
  }
}

function emptyOutlineDraft(): OutlineSessionUpdatePayload {
  return {
    title: '',
    learning_objectives: [],
    key_topics: [],
    teaching_activities: [],
    suggested_exercises: [],
    adaptation_notes: '',
  }
}

export function TeacherWorkspace({
  activePage,
  onPageChange,
  token,
}: {
  activePage: WorkspacePageId
  onPageChange?: (page: WorkspacePageId) => void
  token: string
}) {
  const [courses, setCourses] = useState<Course[]>([])
  const [classes, setClasses] = useState<ClassProfile[]>([])
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [documents, setDocuments] = useState<SourceDocument[]>([])
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [courseForm, setCourseForm] = useState<CourseCreatePayload>(DEFAULT_COURSE)
  const [classForm, setClassForm] = useState<ClassCreatePayload>(DEFAULT_CLASS)
  const [classEditForm, setClassEditForm] =
    useState<ClassCreatePayload>(DEFAULT_CLASS)
  const [lessonTitleDraft, setLessonTitleDraft] = useState('')
  const [ragTopic, setRagTopic] = useState(DEFAULT_RAG_TOPIC)
  const [retrievalResult, setRetrievalResult] = useState<RetrievalResponse | null>(
    null,
  )
  const [outlines, setOutlines] = useState<CourseOutline[]>([])
  const [teacherLessons, setTeacherLessons] = useState<LessonSession[]>([])
  const [classProgress, setClassProgress] = useState<TeacherLessonProgressSummary[]>(
    [],
  )
  const [lessonResult, setLessonResult] = useState<LessonSession | null>(null)
  const [lessonAuditEvents, setLessonAuditEvents] = useState<LessonAuditEvent[]>([])
  const [lessonExportRecords, setLessonExportRecords] = useState<
    LessonExportRecord[]
  >([])
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([])
  const [presentationLesson, setPresentationLesson] = useState<LessonSession | null>(
    null,
  )
  const [blockDrafts, setBlockDrafts] = useState<
    Record<string, { title: string; content: string }>
  >({})
  const [selectedBlockId, setSelectedBlockId] = useState('')
  const [selectedOutlineId, setSelectedOutlineId] = useState('')
  const [selectedLessonId, setSelectedLessonId] = useState('')
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(1)
  const [outlineDraft, setOutlineDraft] =
    useState<OutlineSessionUpdatePayload>(emptyOutlineDraft)
  const [statusMessage, setStatusMessage] = useState('Đang tải dữ liệu khóa học...')
  const [ragStatusMessage, setRagStatusMessage] = useState(
    'Đang tải kho tri thức...',
  )
  const [outlineStatusMessage, setOutlineStatusMessage] = useState(
    'Chọn khóa học và lớp; AI sẽ dùng thư viện của tổ chức cùng tài liệu bạn chọn nếu có.',
  )
  const [lessonStatusMessage, setLessonStatusMessage] = useState(
    'Chọn một buổi trong dàn ý để tạo nội dung bài giảng.',
  )
  const [progressStatusMessage, setProgressStatusMessage] = useState(
    'Chọn lớp để xem tiến độ học tập.',
  )
  const [auditStatusMessage, setAuditStatusMessage] =
    useState('Chưa có bài giảng để tải lịch sử.')
  const [exportStatusMessage, setExportStatusMessage] =
    useState('Chưa có bài giảng để tải lịch sử export.')
  const [jobQueueStatusMessage, setJobQueueStatusMessage] =
    useState('Đang tải hàng đợi xử lý...')
  const [isBusy, setIsBusy] = useState(false)
  const [isRetrieving, setIsRetrieving] = useState(false)
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false)
  const [isSavingOutline, setIsSavingOutline] = useState(false)
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false)
  const [isReviewingLesson, setIsReviewingLesson] = useState(false)
  const [isRecordingExport, setIsRecordingExport] = useState(false)
  const [isLoadingTeacherData, setIsLoadingTeacherData] = useState(true)
  const [archivingDocumentId, setArchivingDocumentId] = useState<string | null>(null)
  const [archivingClassId, setArchivingClassId] = useState<string | null>(null)
  const [archivingLessonId, setArchivingLessonId] = useState<string | null>(null)
  const [reindexingDocumentId, setReindexingDocumentId] = useState<string | null>(null)

  const selectedOutline = outlines.find((outline) => outline.id === selectedOutlineId)
  const selectedClass =
    classes.find((classProfile) => classProfile.id === selectedClassId) ?? null
  const selectedSession = selectedOutline?.sessions.find(
    (session) => session.session_index === selectedSessionIndex,
  )
  const canReviewLesson =
    lessonResult?.status === 'teacher_reviewing' ||
    lessonResult?.status === 'changes_requested'
  const teacherMetrics = useMemo(
    () =>
      buildTeacherWorkspaceMetrics({
        documents,
        selectedDocumentIds,
        lesson: lessonResult,
      }),
    [documents, selectedDocumentIds, lessonResult],
  )
  const workflowSteps = useMemo(
    () =>
      buildTeacherWorkflowSteps({
        courses,
        classes,
        documents,
        selectedDocumentIds,
        outlines,
        lesson: lessonResult,
      }),
    [courses, classes, documents, selectedDocumentIds, outlines, lessonResult],
  )
  const firstLessonGuide = useMemo(
    () =>
      buildTeacherFirstLessonGuide({
        courses,
        classes,
        documents,
        selectedDocumentIds,
        outlines,
        lesson: lessonResult,
      }),
    [courses, classes, documents, selectedDocumentIds, outlines, lessonResult],
  )
  const selectedBlock =
    lessonResult?.blocks.find((block) => block.id === selectedBlockId) ??
    lessonResult?.blocks[0] ??
    null
  const hasRunningGenerationJob = generationJobs.some((job) =>
    ['queued', 'processing', 'retrying'].includes(job.status),
  )
  const classProgressOverview = useMemo(() => {
    const averageProgressPercent = classProgress.length
      ? Math.round(
          classProgress.reduce(
            (total, progress) => total + progress.average_progress_percent,
            0,
          ) / classProgress.length,
        )
      : 0
    return {
      averageProgressPercent,
      startedCount: classProgress.reduce(
        (total, progress) => total + progress.started_count,
        0,
      ),
      completedCount: classProgress.reduce(
        (total, progress) => total + progress.completed_count,
        0,
      ),
      lessonCount: classProgress.length,
    }
  }, [classProgress])
  const recentTeacherLessons = useMemo(
    () => teacherLessons.slice(0, 5),
    [teacherLessons],
  )
  const showOverview = activePage === 'teacher-overview'
  const showSetup = activePage === 'teacher-setup'
  const showDocuments = activePage === 'teacher-documents'
  const showOutlineOrStudio =
    activePage === 'teacher-outline' || activePage === 'teacher-studio'
  const showJobs = activePage === 'teacher-jobs'

  useEffect(() => {
    let cancelled = false

    async function loadTeacherData() {
      setIsLoadingTeacherData(true)
      try {
        const [courseData, studentData, documentData] = await Promise.all([
          fetchCourses(token),
          fetchStudents(token),
          fetchDocuments(token),
        ])
        if (cancelled) {
          return
        }

        setCourses(courseData)
        setStudents(studentData)
        setDocuments(documentData)
        const jobData = await fetchGenerationJobs(token)
        if (cancelled) {
          return
        }
        setGenerationJobs(jobData)
        setJobQueueStatusMessage(
          jobData.length
            ? `Đã tải ${jobData.length} tác vụ xử lý.`
            : 'Chưa có tác vụ xử lý gần đây.',
        )
        setSelectedDocumentIds(
          documentData
            .filter(isSourceDocumentUsable)
            .slice(0, 1)
            .map((document) => document.id),
        )
        setSelectedStudentId(studentData[0]?.id ?? '')
        setRagStatusMessage(
          documentData.length
            ? `Đã tải ${documentData.length} tài liệu dùng để soạn bài.`
            : 'Chưa có tài liệu riêng; AI vẫn tham khảo thư viện dài hạn của tổ chức nếu Admin đã cấu hình.',
        )

        const firstCourseId = courseData[0]?.id ?? ''
        setSelectedCourseId(firstCourseId)

        if (firstCourseId) {
          const classData = await fetchCourseClasses(firstCourseId, token)
          if (!cancelled) {
            const firstClassId = classData[0]?.id ?? ''
            setClasses(classData)
            setSelectedClassId(firstClassId)
            setStatusMessage('Không gian giảng viên đã sẵn sàng.')
            if (firstClassId) {
              const [outlineData, lessonData, progressData] = await Promise.all([
                fetchClassOutlines(firstClassId, token),
                fetchTeacherLessons(firstClassId, token),
                fetchTeacherClassProgress(firstClassId, token),
              ])
              if (!cancelled) {
                setOutlines(outlineData)
                setTeacherLessons(lessonData)
                setClassProgress(progressData)
                setProgressStatusMessage(
                  progressData.length
                    ? `Đã tải tiến độ ${progressData.length} bài đã xuất bản.`
                    : 'Chưa có bài đã xuất bản để theo dõi tiến độ.',
                )
                selectOutline(outlineData[0] ?? null)
                selectTeacherLesson(lessonData[0] ?? null)
              }
            }
          }
        } else {
          setClasses([])
          setSelectedClassId('')
          setOutlines([])
          setTeacherLessons([])
          setClassProgress([])
          selectOutline(null)
          selectTeacherLesson(null)
          setStatusMessage('Chưa có khóa học nào.')
          setProgressStatusMessage('Chọn lớp để xem tiến độ học tập.')
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const message = getErrorMessage(error, 'Không tải được dữ liệu giảng viên')
          setStatusMessage(message)
          setRagStatusMessage(message)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTeacherData(false)
        }
      }
    }

    void loadTeacherData()

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!selectedClass) {
      setClassEditForm(DEFAULT_CLASS)
      return
    }
    setClassEditForm({
      name: selectedClass.name,
      student_level: selectedClass.student_level,
      background_knowledge: selectedClass.background_knowledge,
      session_count: selectedClass.session_count,
      minutes_per_session: selectedClass.minutes_per_session,
      teaching_style: selectedClass.teaching_style,
    })
  }, [selectedClass])

  async function refreshGenerationJobs() {
    try {
      const jobs = await fetchGenerationJobs(token)
      setGenerationJobs(jobs)
      setJobQueueStatusMessage(
        jobs.length
          ? `Đã tải ${jobs.length} tác vụ xử lý.`
          : 'Chưa có tác vụ xử lý gần đây.',
      )
    } catch (error: unknown) {
      setGenerationJobs([])
      setJobQueueStatusMessage(getErrorMessage(error, 'Không tải được hàng đợi xử lý'))
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadAuditEvents(lesson: LessonSession) {
      setAuditStatusMessage('Đang tải lịch sử chỉnh sửa...')
      try {
        const events = await fetchLessonAuditEvents(lesson.id, token)
        if (!cancelled) {
          setLessonAuditEvents(events)
          setAuditStatusMessage(
            events.length
              ? `Đã tải ${events.length} lần chỉnh sửa.`
              : 'Bài giảng này chưa có lịch sử chỉnh sửa.',
          )
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setLessonAuditEvents([])
          setAuditStatusMessage(
            getErrorMessage(error, 'Không tải được lịch sử chỉnh sửa'),
          )
        }
      }
    }

    if (lessonResult) {
      void loadAuditEvents(lessonResult)
    } else {
      setLessonAuditEvents([])
      setAuditStatusMessage('Chưa có bài giảng để tải lịch sử.')
    }

    return () => {
      cancelled = true
    }
  }, [lessonResult, token])

  useEffect(() => {
    let cancelled = false

    async function loadExportRecords(lesson: LessonSession) {
      setExportStatusMessage('Đang tải lịch sử export...')
      try {
        const records = await fetchLessonExportRecords(lesson.id, token)
        if (!cancelled) {
          setLessonExportRecords(records)
          setExportStatusMessage(
            records.length
              ? `Đã tải ${records.length} lần export.`
              : 'Bài giảng này chưa có lịch sử export.',
          )
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setLessonExportRecords([])
          setExportStatusMessage(
            getErrorMessage(error, 'Không tải được lịch sử export'),
          )
        }
      }
    }

    if (lessonResult) {
      void loadExportRecords(lessonResult)
    } else {
      setLessonExportRecords([])
      setExportStatusMessage('Chưa có bài giảng để tải lịch sử export.')
    }

    return () => {
      cancelled = true
    }
  }, [lessonResult, token])

  async function handleCourseSelect(courseId: string) {
    setSelectedCourseId(courseId)
    setSelectedClassId('')
    setOutlines([])
    setTeacherLessons([])
    setClassProgress([])
    selectOutline(null)
    selectTeacherLesson(null)
    setProgressStatusMessage('Chọn lớp để xem tiến độ học tập.')
    setStatusMessage('Đang tải danh sách lớp...')

    if (!courseId) {
      setClasses([])
      setStatusMessage('Chưa chọn khóa học.')
      return
    }

    try {
      const classData = await fetchCourseClasses(courseId, token)
      const firstClassId = classData[0]?.id ?? ''
      setClasses(classData)
      setSelectedClassId(firstClassId)
      if (firstClassId) {
        const [outlineData, lessonData, progressData] = await Promise.all([
          fetchClassOutlines(firstClassId, token),
          fetchTeacherLessons(firstClassId, token),
          fetchTeacherClassProgress(firstClassId, token),
        ])
        setOutlines(outlineData)
        setTeacherLessons(lessonData)
        setClassProgress(progressData)
        setProgressStatusMessage(
          progressData.length
            ? `Đã tải tiến độ ${progressData.length} bài đã xuất bản.`
            : 'Chưa có bài đã xuất bản để theo dõi tiến độ.',
        )
        selectOutline(outlineData[0] ?? null)
        selectTeacherLesson(lessonData[0] ?? null)
      }
      setStatusMessage('Đã tải danh sách lớp.')
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error, 'Không tải được lớp học'))
    }
  }

  async function handleClassSelect(classId: string) {
    setSelectedClassId(classId)
    setOutlines([])
    setTeacherLessons([])
    setClassProgress([])
    selectOutline(null)
    selectTeacherLesson(null)
    if (!classId) {
      setOutlineStatusMessage('Chọn lớp trước khi tạo dàn ý.')
      setProgressStatusMessage('Chọn lớp để xem tiến độ học tập.')
      return
    }

    try {
      const [outlineData, lessonData, progressData] = await Promise.all([
        fetchClassOutlines(classId, token),
        fetchTeacherLessons(classId, token),
        fetchTeacherClassProgress(classId, token),
      ])
      setOutlines(outlineData)
      setTeacherLessons(lessonData)
      setClassProgress(progressData)
      selectOutline(outlineData[0] ?? null)
      selectTeacherLesson(lessonData[0] ?? null)
      setOutlineStatusMessage(
        outlineData.length ? 'Đã tải dàn ý.' : 'Chưa có dàn ý nào.',
      )
      setProgressStatusMessage(
        progressData.length
          ? `Đã tải tiến độ ${progressData.length} bài đã xuất bản.`
          : 'Chưa có bài đã xuất bản để theo dõi tiến độ.',
      )
    } catch (error: unknown) {
      setOutlineStatusMessage(getErrorMessage(error, 'Không tải được dàn ý'))
      setProgressStatusMessage(getErrorMessage(error, 'Không tải được tiến độ lớp'))
    }
  }

  async function handleCourseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsBusy(true)
    setStatusMessage('Đang tạo khóa học...')

    try {
      const course = await createCourse(courseForm, token)
      setCourses((current) => [...current, course])
      setSelectedCourseId(course.id)
      setClasses([])
      setSelectedClassId('')
      setOutlines([])
      setTeacherLessons([])
      selectOutline(null)
      selectTeacherLesson(null)
      setStatusMessage(`Đã tạo khóa học ${course.title}.`)
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error, 'Không tạo được khóa học'))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleClassSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCourseId) {
      setStatusMessage('Tạo hoặc chọn khóa học trước.')
      return
    }

    setIsBusy(true)
    setStatusMessage('Đang tạo hồ sơ lớp...')

    try {
      const classProfile = await createClassProfile(selectedCourseId, classForm, token)
      setClasses((current) => [...current, classProfile])
      setSelectedClassId(classProfile.id)
      setOutlines([])
      setTeacherLessons([])
      selectOutline(null)
      selectTeacherLesson(null)
      setStatusMessage(`Đã tạo lớp ${classProfile.name}.`)
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error, 'Không tạo được lớp'))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleClassUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedClass) {
      setStatusMessage('Chọn lớp trước khi lưu chỉnh sửa.')
      return
    }

    setIsBusy(true)
    setStatusMessage(`Đang lưu lớp ${selectedClass.name}...`)
    try {
      const updatedClass = await updateClassProfile(
        selectedClass.id,
        classEditForm,
        token,
      )
      setClasses((current) =>
        current.map((classProfile) =>
          classProfile.id === updatedClass.id ? updatedClass : classProfile,
        ),
      )
      setSelectedClassId(updatedClass.id)
      setStatusMessage(`Đã lưu lớp ${updatedClass.name}.`)
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error, 'Không lưu được lớp học'))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleArchiveSelectedClass() {
    if (!selectedClass) {
      setStatusMessage('Chọn lớp trước khi lưu trữ.')
      return
    }

    setArchivingClassId(selectedClass.id)
    setStatusMessage(`Đang lưu trữ lớp ${selectedClass.name}...`)
    try {
      const archivedClass = await archiveClassProfile(selectedClass.id, token)
      const remainingClasses = classes.filter(
        (classProfile) => classProfile.id !== archivedClass.id,
      )
      setClasses(remainingClasses)
      const nextClassId = remainingClasses[0]?.id ?? ''
      setSelectedClassId(nextClassId)
      setOutlines([])
      setTeacherLessons([])
      setClassProgress([])
      selectOutline(null)
      selectTeacherLesson(null)
      if (nextClassId) {
        await handleClassSelect(nextClassId)
      } else {
        setProgressStatusMessage('Chọn lớp để xem tiến độ học tập.')
      }
      setStatusMessage(`Đã lưu trữ lớp ${archivedClass.name}.`)
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error, 'Không lưu trữ được lớp học'))
    } finally {
      setArchivingClassId(null)
    }
  }

  async function handleMembershipSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedClassId || !selectedStudentId) {
      setStatusMessage('Chọn lớp và sinh viên trước.')
      return
    }

    setIsBusy(true)
    setStatusMessage('Đang thêm sinh viên...')

    try {
      await addStudentToClass(selectedClassId, selectedStudentId, token)
      const progressData = await fetchTeacherClassProgress(selectedClassId, token)
      setClassProgress(progressData)
      setProgressStatusMessage(
        progressData.length
          ? `Đã cập nhật tiến độ ${progressData.length} bài đã xuất bản.`
          : 'Đã thêm sinh viên; chưa có bài đã xuất bản để theo dõi.',
      )
      const student = students.find((candidate) => candidate.id === selectedStudentId)
      setStatusMessage(`Đã thêm ${student?.name ?? 'sinh viên'} vào lớp.`)
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error, 'Không thêm được sinh viên'))
    } finally {
      setIsBusy(false)
    }
  }

  function handleDocumentToggle(document: SourceDocument) {
    if (!isSourceDocumentUsable(document)) {
      return
    }

    setSelectedDocumentIds((current) =>
      current.includes(document.id)
        ? current.filter((documentId) => documentId !== document.id)
        : [...current, document.id],
    )
  }

  async function handleTeacherDocumentUploaded(response: DocumentUploadResponse) {
    try {
      const documentData = await fetchDocuments(token)
      setDocuments(documentData)
    } catch (error: unknown) {
      setDocuments((current) => [
        response.document,
        ...current.filter((document) => document.id !== response.document.id),
      ])
      setRagStatusMessage(
        getErrorMessage(error, 'Upload xong nhưng không tải lại được tài liệu soạn bài'),
      )
    }

    if (isSourceDocumentUsable(response.document)) {
      setSelectedDocumentIds((current) =>
        current.includes(response.document.id)
          ? current
          : [...current, response.document.id],
      )
    }

    setRagStatusMessage(documentUploadStatusMessage(response))
  }

  async function handleTeacherArchiveDocument(document: SourceDocument) {
    setArchivingDocumentId(document.id)
    setRagStatusMessage(`Đang lưu trữ ${document.title}...`)

    try {
      const archivedDocument = await archiveDocument(document.id, token)
      const documentData = await fetchDocuments(token)
      const usableIds = new Set(
        documentData.filter(isSourceDocumentUsable).map((candidate) => candidate.id),
      )
      setDocuments(documentData)
      setSelectedDocumentIds((current) =>
        current
          .filter((documentId) => documentId !== archivedDocument.id)
          .filter((documentId) => usableIds.has(documentId)),
      )
      setRagStatusMessage(
        `Đã lưu trữ ${archivedDocument.title}; nguồn dẫn cũ vẫn giữ, bài mới không dùng tài liệu này.`,
      )
    } catch (error: unknown) {
      setRagStatusMessage(getErrorMessage(error, 'Không lưu trữ được tài liệu'))
    } finally {
      setArchivingDocumentId(null)
    }
  }

  async function handleTeacherReindexDocument(document: SourceDocument) {
    setReindexingDocumentId(document.id)
    setRagStatusMessage(`Đang làm mới ${document.title}...`)

    try {
      const response = await reindexDocument(document.id, token)
      const [documentData, jobData] = await Promise.all([
        fetchDocuments(token),
        fetchGenerationJobs(token),
      ])
      setDocuments(documentData)
      setGenerationJobs(jobData)
      setJobQueueStatusMessage(`Đã làm mới ${response.chunk_count} đoạn nguồn.`)
      setRagStatusMessage(
        `Đã làm mới nguồn tham khảo cho ${response.document.title}.`,
      )
    } catch (error: unknown) {
      setRagStatusMessage(getErrorMessage(error, 'Không làm mới được tài liệu'))
    } finally {
      setReindexingDocumentId(null)
    }
  }

  async function handleRetrievalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const usableSelectedDocumentIds = selectedDocumentIds.filter((documentId) => {
      const document = documents.find((candidate) => candidate.id === documentId)
      return document ? isSourceDocumentUsable(document) : false
    })

    setIsRetrieving(true)
    setRagStatusMessage('Đang kiểm tra thư viện tổ chức và tài liệu bạn chọn...')

    try {
      const response = await retrieveChunks(
        {
          topic: ragTopic,
          selected_document_ids: usableSelectedDocumentIds,
          top_k: 5,
        },
        token,
      )
      setRetrievalResult(response)
      setRagStatusMessage(
        response.chunks.length
          ? `Tìm thấy ${response.chunks.length} đoạn nguồn phù hợp.`
          : 'Không tìm thấy nguồn phù hợp với chủ đề này.',
      )
    } catch (error: unknown) {
      setRetrievalResult(null)
      setRagStatusMessage(getErrorMessage(error, 'Không kiểm tra được nguồn'))
    } finally {
      setIsRetrieving(false)
    }
  }

  function selectOutline(outline: CourseOutline | null) {
    setSelectedOutlineId(outline?.id ?? '')
    const session = outline?.sessions[0]
    setSelectedSessionIndex(session?.session_index ?? 1)
    setOutlineDraft(session ? sessionToDraft(session) : emptyOutlineDraft())
    setLessonResult(null)
    setSelectedLessonId('')
    setSelectedBlockId('')
    setBlockDrafts({})
  }

  function selectSession(session: OutlineSession) {
    setSelectedSessionIndex(session.session_index)
    setOutlineDraft(sessionToDraft(session))
    setLessonResult(null)
    setSelectedLessonId('')
    setSelectedBlockId('')
    setBlockDrafts({})
  }

  function selectTeacherLesson(lesson: LessonSession | null) {
    setSelectedLessonId(lesson?.id ?? '')
    setLessonTitleDraft(lesson?.title ?? '')
    setLessonWithDrafts(lesson)
    if (lesson?.admin_feedback) {
      setLessonStatusMessage(`Phản hồi từ Admin: ${lesson.admin_feedback}`)
    } else if (lesson) {
      setLessonStatusMessage(`Đã tải bài giảng: ${lessonStatusLabel(lesson.status)}.`)
    }
  }

  function setLessonWithDrafts(lesson: LessonSession | null) {
    setLessonResult(lesson)
    if (!lesson) {
      setBlockDrafts({})
      setSelectedBlockId('')
      setLessonTitleDraft('')
      setPresentationLesson(null)
      return
    }
    setSelectedLessonId(lesson.id)
    setLessonTitleDraft(lesson.title)
    setTeacherLessons((current) => {
      const exists = current.some((candidate) => candidate.id === lesson.id)
      if (!exists) {
        return [lesson, ...current]
      }
      return current.map((candidate) =>
        candidate.id === lesson.id ? lesson : candidate,
      )
    })
    setPresentationLesson((current) =>
      current?.id === lesson.id ? lesson : current,
    )
    setSelectedBlockId((current) =>
      lesson.blocks.some((block) => block.id === current)
        ? current
        : (lesson.blocks[0]?.id ?? ''),
    )
    setBlockDrafts(
      Object.fromEntries(
        lesson.blocks.map((block) => [
          block.id,
          { title: block.title, content: block.content },
        ]),
      ),
    )
  }

  function handleWorkflowStepSelect(step: TeacherWorkflowStep) {
    const pageByStep: Partial<Record<TeacherWorkflowStep['id'], WorkspacePageId>> = {
      course: 'teacher-setup',
      sources: 'teacher-documents',
      outline: 'teacher-outline',
      'lesson-studio': 'teacher-studio',
      'admin-review': 'teacher-studio',
      'student-publish': 'teacher-studio',
    }
    const targetPage = pageByStep[step.id]
    if (!targetPage) {
      return
    }
    onPageChange?.(targetPage)
  }

  function handleFirstLessonGuideSelect() {
    const step = workflowSteps.find((item) => item.id === firstLessonGuide.stepId)
    if (step) {
      handleWorkflowStepSelect(step)
    }
  }

  async function handleGenerateOutline() {
    if (!selectedCourseId || !selectedClassId) {
      setOutlineStatusMessage('Chọn khóa học và lớp trước khi tạo dàn ý.')
      return
    }
    const usableSelectedDocumentIds = selectedDocumentIds.filter((documentId) => {
      const document = documents.find((candidate) => candidate.id === documentId)
      return document ? isSourceDocumentUsable(document) : false
    })

    setIsGeneratingOutline(true)
    setOutlineStatusMessage('AI đang tạo dàn ý từ thư viện tổ chức và tài liệu bạn chọn...')

    try {
      const outline = await generateOutline(
        {
          course_id: selectedCourseId,
          class_id: selectedClassId,
          selected_document_ids: usableSelectedDocumentIds,
          topic: ragTopic,
        },
        token,
      )
      setOutlines((current) => [outline, ...current])
      selectOutline(outline)
      setOutlineStatusMessage(`Đã tạo ${outline.sessions.length} buổi học.`)
    } catch (error: unknown) {
      setOutlineStatusMessage(getErrorMessage(error, 'Không tạo được dàn ý'))
    } finally {
      setIsGeneratingOutline(false)
      void refreshGenerationJobs()
    }
  }

  async function handleSaveOutlineSession() {
    if (!selectedOutline || !selectedSession) {
      setOutlineStatusMessage('Chọn một buổi trong dàn ý trước.')
      return
    }

    setIsSavingOutline(true)
    setOutlineStatusMessage('Đang lưu buổi học...')

    try {
      const updatedOutline = await updateOutlineSession(
        selectedOutline.id,
        selectedSession.session_index,
        outlineDraft,
        token,
      )
      setOutlines((current) =>
        current.map((outline) =>
          outline.id === updatedOutline.id ? updatedOutline : outline,
        ),
      )
      selectOutline(updatedOutline)
      const updatedSession = updatedOutline.sessions.find(
        (session) => session.session_index === selectedSession.session_index,
      )
      if (updatedSession) {
        selectSession(updatedSession)
      }
      setOutlineStatusMessage('Đã lưu buổi học.')
    } catch (error: unknown) {
      setOutlineStatusMessage(getErrorMessage(error, 'Không lưu được buổi học'))
    } finally {
      setIsSavingOutline(false)
    }
  }

  async function handleGenerateLessonBlocks() {
    if (!selectedOutline || !selectedSession) {
      setLessonStatusMessage('Chọn một buổi trong dàn ý trước.')
      return
    }

    setIsGeneratingLesson(true)
    setLessonStatusMessage('AI đang tạo nội dung bài giảng...')

    try {
      const lesson = await generateLessonBlocks(
        {
          outline_id: selectedOutline.id,
          session_index: selectedSession.session_index,
        },
        token,
      )
      setLessonWithDrafts(lesson)
      setLessonStatusMessage(`Đã tạo ${lesson.blocks.length} khối nội dung.`)
    } catch (error: unknown) {
      setLessonWithDrafts(null)
      setLessonStatusMessage(getErrorMessage(error, 'Không tạo được nội dung bài giảng'))
    } finally {
      setIsGeneratingLesson(false)
      void refreshGenerationJobs()
    }
  }

  async function handleSaveLessonBlock(block: LessonBlock) {
    const draft = blockDrafts[block.id]
    if (!draft) {
      return
    }

    setIsReviewingLesson(true)
    setLessonStatusMessage('Đang lưu khối nội dung...')

    try {
      const lesson = await updateLessonBlock(block.id, draft, token)
      setLessonWithDrafts(lesson)
      setLessonStatusMessage('Đã lưu khối nội dung.')
    } catch (error: unknown) {
      setLessonStatusMessage(getErrorMessage(error, 'Không lưu được khối nội dung'))
    } finally {
      setIsReviewingLesson(false)
    }
  }

  async function handleSetLessonBlockStatus(
    block: LessonBlock,
    status: LessonBlock['status'],
  ) {
    setIsReviewingLesson(true)
    setLessonStatusMessage(`Đang cập nhật trạng thái: ${blockStatusLabel(status)}...`)

    try {
      const lesson = await setLessonBlockStatus(block.id, { status }, token)
      setLessonWithDrafts(lesson)
      setLessonStatusMessage(`Đã cập nhật trạng thái: ${blockStatusLabel(status)}.`)
    } catch (error: unknown) {
      setLessonStatusMessage(getErrorMessage(error, 'Không cập nhật được trạng thái khối nội dung'))
    } finally {
      setIsReviewingLesson(false)
    }
  }

  async function handleRegenerateLessonBlock(block: LessonBlock) {
    setIsReviewingLesson(true)
    setLessonStatusMessage('AI đang tạo lại khối nội dung...')

    try {
      const lesson = await regenerateLessonBlock(block.id, token)
      setLessonWithDrafts(lesson)
      setLessonStatusMessage('Đã tạo lại khối nội dung.')
    } catch (error: unknown) {
      setLessonStatusMessage(getErrorMessage(error, 'Không tạo lại được khối nội dung'))
    } finally {
      setIsReviewingLesson(false)
      void refreshGenerationJobs()
    }
  }

  async function handleSubmitLesson() {
    if (!lessonResult) {
      return
    }

    setIsReviewingLesson(true)
    setLessonStatusMessage('Đang gửi bài giảng cho Admin duyệt...')

    try {
      const lesson = await submitLesson(lessonResult.id, token)
      setLessonWithDrafts(lesson)
      setLessonStatusMessage('Đã gửi bài giảng cho Admin duyệt.')
    } catch (error: unknown) {
      setLessonStatusMessage(getErrorMessage(error, 'Không gửi được bài giảng'))
    } finally {
      setIsReviewingLesson(false)
    }
  }

  async function handleSaveLessonTitle() {
    if (!lessonResult) {
      setLessonStatusMessage('Chọn bài giảng trước khi lưu tên.')
      return
    }
    const title = lessonTitleDraft.trim()
    if (!title) {
      setLessonStatusMessage('Tên bài giảng không được để trống.')
      return
    }

    setIsReviewingLesson(true)
    setLessonStatusMessage('Đang lưu tên bài giảng...')
    try {
      const lesson = await updateLessonSession(
        lessonResult.id,
        { title },
        token,
      )
      setLessonWithDrafts(lesson)
      setLessonStatusMessage(`Đã lưu tên bài giảng: ${lesson.title}.`)
    } catch (error: unknown) {
      setLessonStatusMessage(getErrorMessage(error, 'Không lưu được tên bài giảng'))
    } finally {
      setIsReviewingLesson(false)
    }
  }

  async function handleArchiveLesson() {
    if (!lessonResult) {
      setLessonStatusMessage('Chọn bài giảng trước khi lưu trữ.')
      return
    }

    setArchivingLessonId(lessonResult.id)
    setLessonStatusMessage(`Đang lưu trữ ${lessonResult.title}...`)
    try {
      const archivedLesson = await archiveLessonSession(lessonResult.id, token)
      setTeacherLessons((current) =>
        current.filter((lesson) => lesson.id !== archivedLesson.id),
      )
      setLessonWithDrafts(null)
      const nextLesson =
        teacherLessons.find((lesson) => lesson.id !== archivedLesson.id) ?? null
      if (nextLesson) {
        selectTeacherLesson(nextLesson)
      }
      setLessonStatusMessage(`Đã lưu trữ ${archivedLesson.title}.`)
    } catch (error: unknown) {
      setLessonStatusMessage(getErrorMessage(error, 'Không lưu trữ được bài giảng'))
    } finally {
      setArchivingLessonId(null)
    }
  }

  async function recordTeacherLessonExport(
    lesson: LessonSession,
    exportFormat: LessonExportFormat,
    delivery: LessonExportRecord['delivery'],
    fileName?: string,
  ) {
    setIsRecordingExport(true)
    setExportStatusMessage(`Đang ghi lịch sử export ${exportFormatLabel(exportFormat)}...`)
    try {
      const record = await recordLessonExport(
        lesson.id,
        {
          export_format: exportFormat,
          delivery,
          file_name: fileName,
          client_metadata: { source: 'teacher_workspace' },
        },
        token,
      )
      setLessonExportRecords((current) => [
        record,
        ...current.filter((candidate) => candidate.id !== record.id),
      ])
      setExportStatusMessage(
        `Đã ghi export ${exportFormatLabel(record.export_format)} lúc ${new Date(
          record.created_at,
        ).toLocaleString('vi-VN')}.`,
      )
      return record
    } catch (error: unknown) {
      setExportStatusMessage(getErrorMessage(error, 'Không ghi được lịch sử export'))
      throw error
    } finally {
      setIsRecordingExport(false)
    }
  }

  async function handleExportMarkdown() {
    if (!lessonResult) {
      setLessonStatusMessage('Chưa có bài giảng để export Markdown.')
      return
    }

    try {
      const fileName = markdownFileName(lessonResult)
      await recordTeacherLessonExport(
        lessonResult,
        'markdown',
        'download',
        fileName,
      )
      const markdown = buildLessonMarkdown(lessonResult)
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setLessonStatusMessage('Đã export Markdown.')
    } catch (error: unknown) {
      setLessonStatusMessage(getErrorMessage(error, 'Không export được Markdown'))
    }
  }

  async function handleExportPptx() {
    if (!lessonResult) {
      setLessonStatusMessage('Chưa có bài giảng để export PPTX.')
      return
    }

    setIsReviewingLesson(true)
    setLessonStatusMessage('Đang export PPTX...')
    try {
      await recordTeacherLessonExport(
        lessonResult,
        'pptx',
        'download',
        `${lessonResult.title}.pptx`,
      )
      await exportLessonPptx(lessonResult)
      setLessonStatusMessage('Đã export PPTX.')
    } catch (error: unknown) {
      setLessonStatusMessage(getErrorMessage(error, 'Không export được PPTX'))
    } finally {
      setIsReviewingLesson(false)
    }
  }

  return (
    <section
      className="panel learning-panel v4-teacher-workspace"
      id={WORKSPACE_SECTION_IDS.teacherSetup}
      tabIndex={-1}
    >
      {showOverview && (
        <>
          <div className="v4-teacher-hero">
            <div>
              <p className="section-label">Dashboard</p>
              <h2>Chào buổi sáng 👋</h2>
              <p className="muted">
                {selectedClass?.name ??
                  courses.find((course) => course.id === selectedCourseId)?.title ??
                  'Chọn lớp'}
              </p>
            </div>
            <div className="v4-system-status">
              <span className="status-dot" aria-hidden="true" />
              <strong>Sẵn sàng</strong>
              <small>{statusMessage}</small>
            </div>
          </div>

          <section
            className="teacher-dashboard-showcase"
            aria-label="Teacher dashboard"
          >
            <div className="teacher-create-panel">
              <div className="v4-panel-title">
                <span>Tạo mới</span>
                <strong>{selectedClass?.name ?? 'Chọn lớp'}</strong>
              </div>
              <div className="teacher-create-grid">
                {TEACHER_CREATION_ACTIONS.map((action) => {
                  const Icon = action.Icon
                  return (
                    <button
                      aria-label={`${action.label}: ${action.description}`}
                      className={`teacher-create-card tone-${action.tone}`}
                      key={action.label}
                      title={action.description}
                      type="button"
                      onClick={() => onPageChange?.(action.page)}
                    >
                      <span className="teacher-create-icon">
                        <Icon aria-hidden="true" size={22} />
                      </span>
                      <strong>{action.label}</strong>
                      <ChevronRight aria-hidden="true" size={18} />
                    </button>
                  )
                })}
              </div>

              <div className="teacher-recent-panel">
                <div className="v4-panel-title">
                  <span>Gần đây</span>
                  <button
                    aria-label="Xem tất cả bài giảng"
                    className="ghost-button icon-button"
                    title="Xem tất cả"
                    type="button"
                    onClick={() => onPageChange?.('teacher-studio')}
                  >
                    <ChevronRight aria-hidden="true" size={18} />
                  </button>
                </div>
                {recentTeacherLessons.length > 0 ? (
                  <div className="teacher-recent-list">
                    {recentTeacherLessons.map((lesson) => (
                      <button
                        className="teacher-recent-row"
                        key={lesson.id}
                        type="button"
                        onClick={() => {
                          selectTeacherLesson(lesson)
                          onPageChange?.('teacher-studio')
                        }}
                      >
                        <span className="teacher-create-icon mini-icon">
                          <FileText aria-hidden="true" size={16} />
                        </span>
                        <span>
                          <strong>{lesson.title}</strong>
                          <small>{lessonStatusLabel(lesson.status)}</small>
                        </span>
                        <ChevronRight aria-hidden="true" size={16} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="v4-empty-inline">Chưa có bài giảng.</p>
                )}
              </div>
            </div>

            <aside className="teacher-ai-panel" aria-label="AI assistant">
              <div className="teacher-ai-header">
                <span className="teacher-create-icon ai-icon">
                  <Sparkles aria-hidden="true" size={22} />
                </span>
                <div>
                  <strong>AI Assistant</strong>
                  <small>Nguồn + citation</small>
                </div>
              </div>
              <div className="teacher-ai-suggestions">
                <button
                  aria-label="Chọn nguồn cho AI"
                  title="Chọn nguồn"
                  type="button"
                  onClick={() => onPageChange?.('teacher-documents')}
                >
                  <Library aria-hidden="true" size={18} />
                  <span>Chọn nguồn</span>
                </button>
                <button
                  aria-label="Tạo dàn ý AI"
                  title="Tạo dàn ý"
                  type="button"
                  onClick={() => onPageChange?.('teacher-outline')}
                >
                  <Sparkles aria-hidden="true" size={18} />
                  <span>Tạo dàn ý</span>
                </button>
                <button
                  aria-label="Review citation"
                  title="Review citation"
                  type="button"
                  onClick={() => onPageChange?.('teacher-studio')}
                >
                  <ShieldCheck aria-hidden="true" size={18} />
                  <span>Review</span>
                </button>
              </div>
            </aside>
          </section>

          <div className="teacher-compact-insights">
            <WorkflowTimeline
              steps={workflowSteps}
              onSelectStep={handleWorkflowStepSelect}
            />
            <div className="v4-first-lesson-guide">
              <div>
                <span>{firstLessonGuide.progressLabel}</span>
                <h3>{firstLessonGuide.title}</h3>
              </div>
              <button
                aria-label={firstLessonGuide.detail}
                className="primary-button"
                title={firstLessonGuide.detail}
                type="button"
                onClick={handleFirstLessonGuideSelect}
              >
                <Sparkles aria-hidden="true" size={17} />
                {firstLessonGuide.actionLabel}
              </button>
            </div>
          </div>
        </>
      )}

      {showOverview && (
        <section className="v2-progress-panel" aria-label="Tien do lop hoc">
        <div className="v4-panel-title">
          <span>Tiến độ lớp</span>
          <strong>{progressStatusMessage}</strong>
        </div>
        <div className="v2-progress-summary-grid">
          <MetricCard
            detail="Trung bình"
            label="Hoàn thành"
            tone={classProgressOverview.averageProgressPercent ? 'success' : 'default'}
            value={`${classProgressOverview.averageProgressPercent}%`}
          />
          <MetricCard
            detail="Tổng lượt mở bài"
            label="Đã bắt đầu"
            tone={classProgressOverview.startedCount ? 'info' : 'default'}
            value={String(classProgressOverview.startedCount)}
          />
          <MetricCard
            detail="Tổng lượt hoàn thành"
            label="Đã hoàn thành"
            tone={classProgressOverview.completedCount ? 'success' : 'default'}
            value={String(classProgressOverview.completedCount)}
          />
        </div>
        {classProgress.length > 0 ? (
          <div className="v2-teacher-progress-list">
            {classProgress.map((progress) => (
              <article key={progress.lesson_id}>
                <div>
                  <strong>{progress.title}</strong>
                  <small>
                    {progress.started_count}/{progress.enrolled_student_count} đã mở -{' '}
                    {progress.completed_count} hoàn thành
                  </small>
                </div>
                <span>{progress.average_progress_percent}%</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="v4-empty-inline">
            Chưa có bài đã xuất bản hoặc chưa có sinh viên bắt đầu học.
          </p>
        )}
        </section>
      )}

      {showSetup && (
        <>
          <div className="panel-heading">
            <p className="section-label">Khóa học và lớp học</p>
            <span className="status-pill neutral-pill">Thiết lập</span>
          </div>

          <div className="learning-grid">
        <form className="learning-form" onSubmit={handleCourseSubmit}>
          <h2>Tạo khóa học</h2>
          <label className="field">
            <span>Tiêu đề</span>
            <input
              value={courseForm.title}
              onChange={(event) =>
                setCourseForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Mô tả</span>
            <textarea
              value={courseForm.description}
              onChange={(event) =>
                setCourseForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Mục tiêu học tập</span>
            <textarea
              value={courseForm.learning_goals}
              onChange={(event) =>
                setCourseForm((current) => ({
                  ...current,
                  learning_goals: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Ngôn ngữ giảng dạy</span>
            <input
              value={courseForm.teaching_language}
              onChange={(event) =>
                setCourseForm((current) => ({
                  ...current,
                  teaching_language: event.target.value,
                }))
              }
            />
          </label>
          <button
            className="primary-button"
            disabled={isBusy}
            type="submit"
          >
            <Plus aria-hidden="true" size={17} />
            Tạo khóa học
          </button>
        </form>

        <form className="learning-form" onSubmit={handleClassSubmit}>
          <h2>Tạo hồ sơ lớp</h2>
          <label className="field">
            <span>Khóa học</span>
            <select
              disabled={isBusy}
              value={selectedCourseId}
              onChange={(event) => void handleCourseSelect(event.target.value)}
            >
              <option value="">Chọn khóa học</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Tên lớp</span>
            <input
              value={classForm.name}
              onChange={(event) =>
                setClassForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Trình độ sinh viên</span>
            <select
              value={classForm.student_level}
              onChange={(event) =>
                setClassForm((current) => ({
                  ...current,
                  student_level: event.target.value as ClassCreatePayload['student_level'],
                }))
              }
            >
              <option value="weak">{studentLevelLabel('weak')}</option>
              <option value="average">{studentLevelLabel('average')}</option>
              <option value="strong">{studentLevelLabel('strong')}</option>
            </select>
          </label>
          <label className="field">
            <span>Số buổi</span>
            <input
              min="1"
              type="number"
              value={classForm.session_count}
              onChange={(event) =>
                setClassForm((current) => ({
                  ...current,
                  session_count: Number(event.target.value),
                }))
              }
            />
          </label>
          <label className="field">
            <span>Phút mỗi buổi</span>
            <input
              min="1"
              type="number"
              value={classForm.minutes_per_session}
              onChange={(event) =>
                setClassForm((current) => ({
                  ...current,
                  minutes_per_session: Number(event.target.value),
                }))
              }
            />
          </label>
          <label className="field">
            <span>Nền tảng kiến thức</span>
            <textarea
              value={classForm.background_knowledge}
              onChange={(event) =>
                setClassForm((current) => ({
                  ...current,
                  background_knowledge: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Phong cách dạy</span>
            <textarea
              value={classForm.teaching_style}
              onChange={(event) =>
                setClassForm((current) => ({
                  ...current,
                  teaching_style: event.target.value,
                }))
              }
            />
          </label>
          <button
            className="primary-button"
            disabled={isBusy}
            type="submit"
          >
            <UsersRound aria-hidden="true" size={17} />
            Tạo lớp
          </button>
        </form>

        <form className="learning-form" onSubmit={handleMembershipSubmit}>
          <h2>Thêm sinh viên</h2>
          <label className="field">
            <span>Lớp</span>
            <select
              disabled={isBusy}
              value={selectedClassId}
              onChange={(event) => void handleClassSelect(event.target.value)}
            >
              <option value="">Chọn lớp</option>
              {classes.map((classProfile) => (
                <option key={classProfile.id} value={classProfile.id}>
                  {classProfile.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Sinh viên</span>
            <select
              disabled={isBusy}
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
            >
              <option value="">Chọn sinh viên</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {displayName(student.name)} - {student.email}
                </option>
              ))}
            </select>
          </label>
          <button
            className="primary-button"
            disabled={isBusy}
            type="submit"
          >
            <UserRound aria-hidden="true" size={17} />
            Thêm sinh viên
          </button>
        </form>
          </div>

          <form
            className="learning-form teacher-class-edit-panel"
            onSubmit={handleClassUpdate}
          >
            <div className="v4-panel-title">
              <span>Quản lý lớp đang chọn</span>
              <strong>{selectedClass?.name ?? 'Chưa chọn lớp'}</strong>
            </div>
            {classes.length > 0 ? (
              <div className="teacher-class-list" aria-label="Danh sách lớp">
                {classes.map((classProfile) => (
                  <button
                    className={
                      classProfile.id === selectedClassId ? 'selected' : ''
                    }
                    key={classProfile.id}
                    type="button"
                    onClick={() => void handleClassSelect(classProfile.id)}
                  >
                    <strong>{classProfile.name}</strong>
                    <small>
                      {studentLevelLabel(classProfile.student_level)} -{' '}
                      {classProfile.session_count} buổi
                    </small>
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">Chưa có lớp để quản lý.</p>
            )}

            {selectedClass && (
              <>
                <label className="field">
                  <span>Tên lớp</span>
                  <input
                    value={classEditForm.name}
                    onChange={(event) =>
                      setClassEditForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Trình độ sinh viên</span>
                  <select
                    value={classEditForm.student_level}
                    onChange={(event) =>
                      setClassEditForm((current) => ({
                        ...current,
                        student_level: event.target
                          .value as ClassCreatePayload['student_level'],
                      }))
                    }
                  >
                    <option value="weak">{studentLevelLabel('weak')}</option>
                    <option value="average">{studentLevelLabel('average')}</option>
                    <option value="strong">{studentLevelLabel('strong')}</option>
                  </select>
                </label>
                <div className="class-edit-number-grid">
                  <label className="field">
                    <span>Số buổi</span>
                    <input
                      min="1"
                      type="number"
                      value={classEditForm.session_count}
                      onChange={(event) =>
                        setClassEditForm((current) => ({
                          ...current,
                          session_count: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Phút mỗi buổi</span>
                    <input
                      min="1"
                      type="number"
                      value={classEditForm.minutes_per_session}
                      onChange={(event) =>
                        setClassEditForm((current) => ({
                          ...current,
                          minutes_per_session: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Nền tảng kiến thức</span>
                  <textarea
                    value={classEditForm.background_knowledge}
                    onChange={(event) =>
                      setClassEditForm((current) => ({
                        ...current,
                        background_knowledge: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Phong cách dạy</span>
                  <textarea
                    value={classEditForm.teaching_style}
                    onChange={(event) =>
                      setClassEditForm((current) => ({
                        ...current,
                        teaching_style: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="block-actions">
                  <button
                    className="primary-button"
                    disabled={isBusy}
                    type="submit"
                  >
                    <Save aria-hidden="true" size={17} />
                    Lưu lớp
                  </button>
                  <button
                    className="ghost-button"
                    disabled={archivingClassId !== null}
                    type="button"
                    onClick={() => void handleArchiveSelectedClass()}
                  >
                    <ArchiveX aria-hidden="true" size={17} />
                    {archivingClassId === selectedClass.id
                      ? 'Đang lưu trữ...'
                      : 'Lưu trữ lớp'}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="state-panel compact-state">{statusMessage}</p>
        </>
      )}

      {showJobs && (
        <div className="v4-operations-strip">
        <section>
          <div className="v4-panel-title">
            <span>Tài liệu dùng để soạn bài</span>
            <strong>
              {teacherMetrics.selectedSourceCount}/{teacherMetrics.completedSourceCount}
            </strong>
          </div>
          <SourceStrip
            documents={documents}
            selectedDocumentIds={selectedDocumentIds}
            onToggle={handleDocumentToggle}
          />
        </section>
        <section>
          <div className="v4-panel-title">
            <span>Hàng đợi xử lý</span>
            <strong>
              {isRetrieving ||
              isGeneratingOutline ||
              isGeneratingLesson ||
              hasRunningGenerationJob
                ? 'Đang chạy'
                : jobQueueStatusMessage}
            </strong>
          </div>
          <JobQueue
            jobs={generationJobs}
            isGeneratingLesson={isGeneratingLesson}
            isGeneratingOutline={isGeneratingOutline}
            isRetrieving={isRetrieving}
            isReviewingLesson={isReviewingLesson}
          />
        </section>
        </div>
      )}

      {showDocuments && (
        <section
        className="knowledge-panel"
        id={WORKSPACE_SECTION_IDS.teacherKnowledge}
        tabIndex={-1}
      >
        <div className="panel-heading">
          <p className="section-label">Tài liệu dùng để soạn bài</p>
          <span className="status-pill neutral-pill">Nguồn kiến thức</span>
        </div>

        <KnowledgeUploadPanel
          idleMessage="Chưa chọn PDF cho bài giảng."
          pdfLabel="PDF bài giảng"
          submitLabel="Upload tài liệu"
          token={token}
          urlLabel="URL tài liệu"
          urlSubmitLabel="Thêm URL"
          onUploaded={handleTeacherDocumentUploaded}
        />

        <form className="rag-form" onSubmit={handleRetrievalSubmit}>
          <label className="field">
            <span>Chủ đề cần chuẩn bị</span>
            <input
              value={ragTopic}
              onChange={(event) => setRagTopic(event.target.value)}
            />
          </label>

          {documents.length > 0 ? (
            <div className="document-list">
              {documents.map((document) => {
                const isUsable = isSourceDocumentUsable(document)
                const isSelected = selectedDocumentIds.includes(document.id)
                const governanceLabels = documentGovernanceLabels(document)

                return (
                  <article
                    className={`document-row document-row-with-actions${
                      isUsable ? '' : ' disabled'
                    }`}
                    key={document.id}
                  >
                    <input
                      aria-label={`Chọn ${document.title}`}
                      checked={isSelected}
                      disabled={!isUsable || isRetrieving || isLoadingTeacherData}
                      type="checkbox"
                      onChange={() => handleDocumentToggle(document)}
                    />
                    <span>
                      <strong>{document.title}</strong>
                      <small>{document.file_name}</small>
                      {governanceLabels.length ? (
                        <small className="document-governance">
                          {governanceLabels.join(' · ')}
                        </small>
                      ) : null}
                    </span>
                    <em>{documentStatusLabel(document)}</em>
                    <button
                      aria-label={`Làm mới ${document.title}`}
                      className="document-action-button"
                      disabled={!isUsable || reindexingDocumentId === document.id}
                      title="Làm mới tài liệu"
                      type="button"
                      onClick={() => void handleTeacherReindexDocument(document)}
                    >
                      <RefreshCcw aria-hidden="true" size={16} />
                    </button>
                    <button
                      aria-label={`Lưu trữ ${document.title}`}
                      className="document-action-button"
                      disabled={!document.is_active || archivingDocumentId === document.id}
                      title="Lưu trữ tài liệu"
                      type="button"
                      onClick={() => void handleTeacherArchiveDocument(document)}
                    >
                      <ArchiveX aria-hidden="true" size={16} />
                    </button>
                  </article>
                )
              })}
            </div>
          ) : (
            <p className="muted">{ragStatusMessage}</p>
          )}

          {!selectedDocumentIds.length && documents.length > 0 && (
            <p className="warning-text">
              Có thể chọn tài liệu riêng cho bài này; nếu không chọn, AI sẽ dùng thư viện dài hạn của tổ chức khi phù hợp.
            </p>
          )}

          <button
            className="primary-button"
            disabled={isRetrieving || isLoadingTeacherData}
            type="submit"
          >
            <Library aria-hidden="true" size={17} />
            {isRetrieving ? 'Đang kiểm tra nguồn...' : 'Kiểm tra nguồn'}
          </button>

          <p className="state-panel compact-state">{ragStatusMessage}</p>

          {retrievalResult && (
            <div className="chunk-list">
              {retrievalResult.chunks.map((chunk) => (
                <article className="chunk-row" key={chunk.chunk_id}>
                  <div>
                    <strong>{chunk.document_title}</strong>
                    <span className="citation-meta">
                      Trang {chunk.page_number ?? 'n/a'} - đoạn{' '}
                      {chunk.chunk_index} - điểm {chunk.score.toFixed(2)}
                    </span>
                  </div>
                  <p>{chunk.excerpt}</p>
                </article>
              ))}
            </div>
          )}
        </form>
        </section>
      )}

      {showOutlineOrStudio && (
        <section
        className="outline-panel"
        id={WORKSPACE_SECTION_IDS.teacherOutline}
        tabIndex={-1}
      >
        <div className="panel-heading">
          <p className="section-label">Dàn ý bài giảng AI</p>
          <span className="status-pill neutral-pill">AI</span>
        </div>

        <div className="outline-actions">
          <button
            className="primary-button"
            disabled={isGeneratingOutline || isLoadingTeacherData}
            type="button"
            onClick={() => void handleGenerateOutline()}
          >
            <Sparkles aria-hidden="true" size={17} />
            {isGeneratingOutline ? 'Đang tạo dàn ý...' : 'Tạo dàn ý'}
          </button>

          {outlines.length > 0 && (
            <label className="field">
              <span>Dàn ý</span>
              <select
                value={selectedOutlineId}
                onChange={(event) => {
                  const outline =
                    outlines.find((candidate) => candidate.id === event.target.value) ??
                    null
                  selectOutline(outline)
                }}
              >
                {outlines.map((outline) => (
                  <option key={outline.id} value={outline.id}>
                    {outline.topic} - {outline.sessions.length} buổi
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <p className="state-panel compact-state">{outlineStatusMessage}</p>

        {selectedOutline && (
          <div className="outline-workspace">
            <div className="session-tabs" role="tablist" aria-label="Các buổi trong dàn ý">
              {selectedOutline.sessions.map((session) => (
                <button
                  aria-selected={session.session_index === selectedSessionIndex}
                  className={
                    session.session_index === selectedSessionIndex ? 'active' : ''
                  }
                  key={session.session_index}
                  type="button"
                  onClick={() => selectSession(session)}
                >
                  {session.session_index}
                </button>
              ))}
            </div>

            {selectedSession && (
              <div className="outline-editor">
                <label className="field">
                  <span>Tiêu đề buổi học</span>
                  <input
                    value={outlineDraft.title}
                    onChange={(event) =>
                      setOutlineDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Mục tiêu học tập</span>
                  <textarea
                    value={arrayToLines(outlineDraft.learning_objectives)}
                    onChange={(event) =>
                      setOutlineDraft((current) => ({
                        ...current,
                        learning_objectives: linesToArray(event.target.value),
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Chủ đề chính</span>
                  <textarea
                    value={arrayToLines(outlineDraft.key_topics)}
                    onChange={(event) =>
                      setOutlineDraft((current) => ({
                        ...current,
                        key_topics: linesToArray(event.target.value),
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Hoạt động dạy học</span>
                  <textarea
                    value={arrayToLines(outlineDraft.teaching_activities)}
                    onChange={(event) =>
                      setOutlineDraft((current) => ({
                        ...current,
                        teaching_activities: linesToArray(event.target.value),
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Bài tập gợi ý</span>
                  <textarea
                    value={arrayToLines(outlineDraft.suggested_exercises)}
                    onChange={(event) =>
                      setOutlineDraft((current) => ({
                        ...current,
                        suggested_exercises: linesToArray(event.target.value),
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Ghi chú cá nhân hóa</span>
                  <textarea
                    value={outlineDraft.adaptation_notes}
                    onChange={(event) =>
                      setOutlineDraft((current) => ({
                        ...current,
                        adaptation_notes: event.target.value,
                      }))
                    }
                  />
                </label>

                <button
                  className="primary-button"
                  disabled={isSavingOutline}
                  type="button"
                  onClick={() => void handleSaveOutlineSession()}
                >
                  <Save aria-hidden="true" size={17} />
                  {isSavingOutline ? 'Đang lưu...' : 'Lưu buổi học'}
                </button>

                <div className="chunk-list">
                  {selectedSession.source_references.map((chunk) => (
                    <article className="chunk-row" key={chunk.chunk_id}>
                      <div>
                        <strong>{chunk.document_title}</strong>
                        <span className="citation-meta">
                          Trang {chunk.page_number ?? 'n/a'} - đoạn{' '}
                          {chunk.chunk_index}
                        </span>
                      </div>
                      <p>{chunk.excerpt}</p>
                    </article>
                  ))}
                </div>

                <div
                  className="lesson-block-panel"
                  id={WORKSPACE_SECTION_IDS.teacherLessonStudio}
                  tabIndex={-1}
                >
                  <div className="panel-heading">
                    <p className="section-label">Lesson Studio</p>
                    <span className="status-pill neutral-pill">Review</span>
                  </div>

                  <button
                    className="primary-button"
                    disabled={isGeneratingLesson}
                    type="button"
                    onClick={() => void handleGenerateLessonBlocks()}
                  >
                    <Sparkles aria-hidden="true" size={17} />
                    {isGeneratingLesson
                      ? 'Đang tạo nội dung...'
                      : 'Tạo nội dung bài giảng'}
                  </button>

                  <p className="state-panel compact-state">{lessonStatusMessage}</p>

                  {teacherLessons.length > 0 && (
                    <label className="field">
                      <span>Bài giảng đã có</span>
                      <select
                        value={selectedLessonId}
                        onChange={(event) => {
                          const lesson =
                            teacherLessons.find(
                              (candidate) => candidate.id === event.target.value,
                            ) ?? null
                          selectTeacherLesson(lesson)
                        }}
                      >
                        {teacherLessons.map((lesson) => (
                          <option key={lesson.id} value={lesson.id}>
                            {lesson.title} - {lessonStatusLabel(lesson.status)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {lessonResult && (
                    <div className="v4-lesson-studio-grid">
                      <aside className="v4-block-rail" aria-label="Danh sách khối nội dung">
                        <div className="v4-panel-title">
                          <span>Danh sách khối nội dung</span>
                          <strong>{lessonResult.blocks.length}</strong>
                        </div>
                        {lessonResult.admin_feedback && (
                          <p className="warning-text">
                            Phản hồi từ Admin: {lessonResult.admin_feedback}
                          </p>
                        )}
                        {lessonResult.blocks.map((block) => (
                          <button
                            className={`v4-block-row ${
                              selectedBlock?.id === block.id ? 'selected' : ''
                            }`}
                            key={block.id}
                            type="button"
                            onClick={() => setSelectedBlockId(block.id)}
                          >
                            <span>{block.order_index}</span>
                            <span>
                              <strong>{block.title}</strong>
                              <small>{blockTypeLabel(block.type)}</small>
                              {block.warning && (
                                <small className="grounding-flag">
                                  Cần kiểm tra nguồn
                                </small>
                              )}
                            </span>
                            <em>{blockStatusLabel(block.status)}</em>
                          </button>
                        ))}
                      </aside>

                      <section className="v4-block-editor" aria-label="Chỉnh sửa khối nội dung">
                        <div className="lesson-submit-row">
                          <label className="field lesson-title-field">
                            <span>Tên bài giảng</span>
                            <input
                              disabled={isReviewingLesson || !canReviewLesson}
                              value={lessonTitleDraft}
                              onChange={(event) =>
                                setLessonTitleDraft(event.target.value)
                              }
                            />
                          </label>
                          <span>{lessonStatusLabel(lessonResult.status)}</span>
                          <button
                            className="ghost-button"
                            disabled={isReviewingLesson || !canReviewLesson}
                            type="button"
                            onClick={() => void handleSaveLessonTitle()}
                          >
                            <Save aria-hidden="true" size={17} />
                            Lưu tên
                          </button>
                          <button
                            className="ghost-button"
                            disabled={archivingLessonId !== null}
                            type="button"
                            onClick={() => void handleArchiveLesson()}
                          >
                            <ArchiveX aria-hidden="true" size={17} />
                            {archivingLessonId === lessonResult.id
                              ? 'Đang lưu trữ...'
                              : 'Lưu trữ bài'}
                          </button>
                          <button
                            className="primary-button"
                            disabled={isReviewingLesson || !canReviewLesson}
                            type="button"
                            onClick={() => void handleSubmitLesson()}
                          >
                            <Send aria-hidden="true" size={17} />
                            Gửi Admin duyệt
                          </button>
                          <button
                            className="ghost-button"
                            type="button"
                            onClick={() => setPresentationLesson(lessonResult)}
                          >
                            <MonitorPlay aria-hidden="true" size={17} />
                            Trình chiếu
                          </button>
                          <button
                            className="ghost-button"
                            disabled={isRecordingExport}
                            type="button"
                            onClick={() => void handleExportMarkdown()}
                          >
                            <FileText aria-hidden="true" size={17} />
                            Export Markdown
                          </button>
                          <button
                            className="ghost-button"
                            disabled={isReviewingLesson || isRecordingExport}
                            type="button"
                            onClick={() => void handleExportPptx()}
                          >
                            <MonitorPlay aria-hidden="true" size={17} />
                            Export PPTX
                          </button>
                        </div>

                        {selectedBlock ? (
                          <article className="lesson-block v4-active-block">
                            <div className="lesson-block-header">
                              <span>{blockTypeLabel(selectedBlock.type)}</span>
                              <strong>{blockStatusLabel(selectedBlock.status)}</strong>
                            </div>

                            <label className="field">
                              <span>Tiêu đề khối</span>
                              <input
                                value={
                                  blockDrafts[selectedBlock.id]?.title ??
                                  selectedBlock.title
                                }
                                onChange={(event) =>
                                  setBlockDrafts((current) => ({
                                    ...current,
                                    [selectedBlock.id]: {
                                      title: event.target.value,
                                      content:
                                        current[selectedBlock.id]?.content ??
                                        selectedBlock.content,
                                    },
                                  }))
                                }
                              />
                            </label>

                            <label className="field">
                              <span>Nội dung khối</span>
                              <textarea
                                value={
                                  blockDrafts[selectedBlock.id]?.content ??
                                  selectedBlock.content
                                }
                                onChange={(event) =>
                                  setBlockDrafts((current) => ({
                                    ...current,
                                    [selectedBlock.id]: {
                                      title:
                                        current[selectedBlock.id]?.title ??
                                        selectedBlock.title,
                                      content: event.target.value,
                                    },
                                  }))
                                }
                              />
                            </label>

                            <div className="block-actions">
                              <button
                                className="ghost-button"
                                disabled={isReviewingLesson || !canReviewLesson}
                                type="button"
                                onClick={() =>
                                  void handleSaveLessonBlock(selectedBlock)
                                }
                              >
                                <Save aria-hidden="true" size={16} />
                                Lưu nháp
                              </button>
                              <button
                                className="ghost-button"
                                disabled={isReviewingLesson || !canReviewLesson}
                                type="button"
                                onClick={() =>
                                  void handleRegenerateLessonBlock(selectedBlock)
                                }
                              >
                                <RotateCcw aria-hidden="true" size={16} />
                                Tạo lại
                              </button>
                              <button
                                className="ghost-button"
                                disabled={isReviewingLesson || !canReviewLesson}
                                type="button"
                                onClick={() =>
                                  void handleSetLessonBlockStatus(
                                    selectedBlock,
                                    'approved',
                                  )
                                }
                              >
                                <CheckCircle2 aria-hidden="true" size={16} />
                                Duyệt
                              </button>
                              <button
                                className="ghost-button"
                                disabled={
                                  isReviewingLesson ||
                                  !canReviewLesson ||
                                  !selectedBlock.warning
                                }
                                type="button"
                                onClick={() =>
                                  void handleSetLessonBlockStatus(
                                    selectedBlock,
                                    'approved_with_warning',
                                  )
                                }
                              >
                                <ShieldCheck aria-hidden="true" size={16} />
                                Duyệt kèm cảnh báo
                              </button>
                              <button
                                className="ghost-button"
                                disabled={isReviewingLesson || !canReviewLesson}
                                type="button"
                                onClick={() =>
                                  void handleSetLessonBlockStatus(
                                    selectedBlock,
                                    'rejected',
                                  )
                                }
                              >
                                <XCircle aria-hidden="true" size={16} />
                                Cần sửa
                              </button>
                            </div>
                          </article>
                        ) : (
                          <p className="state-panel compact-state">
                            Chưa có khối nội dung để chỉnh sửa.
                          </p>
                        )}

                        <section className="lesson-block v4-audit-panel">
                          <div className="lesson-block-header">
                            <span>Lịch sử chỉnh sửa</span>
                            <strong>{lessonAuditEvents.length} lần</strong>
                          </div>
                          <p className="muted">{auditStatusMessage}</p>
                          {lessonAuditEvents.length > 0 && (
                            <div className="chunk-list">
                              {lessonAuditEvents.slice(0, 4).map((event) => (
                                <article className="chunk-row" key={event.id}>
                                  <div>
                                    <strong>{auditActionLabel(event.action)}</strong>
                                    <span className="citation-meta">
                                      {roleLabel(event.actor_role)} -{' '}
                                      {new Date(event.created_at).toLocaleString(
                                        'vi-VN',
                                      )}
                                      {event.block_id ? ` - ${event.block_id}` : ''}
                                    </span>
                                  </div>
                                  {event.details && <p>{event.details}</p>}
                                </article>
                              ))}
                            </div>
                          )}
                        </section>

                        <section className="lesson-block v4-audit-panel">
                          <div className="lesson-block-header">
                            <span>Lịch sử export</span>
                            <strong>{lessonExportRecords.length} lần</strong>
                          </div>
                          <p className="muted">{exportStatusMessage}</p>
                          {lessonExportRecords.length > 0 && (
                            <div className="chunk-list">
                              {lessonExportRecords.slice(0, 4).map((record) => (
                                <article className="chunk-row" key={record.id}>
                                  <div>
                                    <strong>
                                      {exportFormatLabel(record.export_format)} -{' '}
                                      {exportDeliveryLabel(record.delivery)}
                                    </strong>
                                    <span className="citation-meta">
                                      {roleLabel(record.actor_role)} -{' '}
                                      {new Date(record.created_at).toLocaleString(
                                        'vi-VN',
                                      )}
                                    </span>
                                  </div>
                                  <p>
                                    {record.file_name ?? 'Không có tên file'} -{' '}
                                    {record.block_count} khối nội dung -{' '}
                                    {record.citation_count} nguồn dẫn
                                  </p>
                                </article>
                              ))}
                            </div>
                          )}
                        </section>
                      </section>

                      <CitationInspector
                        lesson={lessonResult}
                        metrics={teacherMetrics}
                        selectedBlock={selectedBlock}
                      />
                    </div>
                  )}

                  {presentationLesson && (
                    <LessonPresentation
                      isExportingPdf={isRecordingExport}
                      lesson={presentationLesson}
                      onClose={() => setPresentationLesson(null)}
                      onPdfExport={async () => {
                        await recordTeacherLessonExport(
                          presentationLesson,
                          'pdf',
                          'print',
                          `${presentationLesson.title}.pdf`,
                        )
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        </section>
      )}
    </section>
  )
}
