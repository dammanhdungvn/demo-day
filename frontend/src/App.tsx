import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  Maximize2,
  MonitorPlay,
  Plus,
  Printer,
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
import './App.css'
import {
  fetchCurrentUser,
  fetchDemoAccounts,
  fetchRoleDashboard,
  getRoleRoute,
  login,
  logout,
  type AuthSession,
  type LoginCredentials,
  type PublicDemoAccount,
  type RoleDashboard,
} from './api/auth'
import { clearAuthSession, loadAuthSession, saveAuthSession } from './auth/session'
import { getWorkspaceConfig } from './auth/workspaces'
import { getBackendUrl } from './config'
import {
  addStudentToClass,
  createClassProfile,
  createCourse,
  fetchAdminReviewQueue,
  fetchClassOutlines,
  fetchCourseClasses,
  fetchCourses,
  fetchDocuments,
  fetchStudentLesson,
  fetchStudentClasses,
  fetchStudentLessons,
  fetchStudents,
  fetchTeacherLessons,
  generateLessonBlocks,
  generateOutline,
  publishLesson,
  regenerateLessonBlock,
  requestLessonChanges,
  retrieveChunks,
  setLessonBlockStatus,
  submitLesson,
  updateLessonBlock,
  updateOutlineSession,
  type ClassCreatePayload,
  type ClassProfile,
  type Course,
  type CourseCreatePayload,
  type CourseOutline,
  type LessonBlock,
  type LessonSession,
  type OutlineSession,
  type OutlineSessionUpdatePayload,
  type RetrievalResponse,
  type SourceDocument,
  type StudentClassSummary,
  type StudentProfile,
} from './api/learning'
import {
  buildLessonSlides,
  clampSlideIndex,
  type LessonSlide,
} from './presentation/slides'
import {
  blockStatusLabel,
  blockTypeLabel,
  lessonStatusLabel,
  roleLabel,
  studentLevelLabel,
} from './labels'

type DemoAccountsState =
  | { status: 'loading' }
  | { status: 'ready'; accounts: PublicDemoAccount[] }
  | { status: 'error'; message: string }

type DashboardState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; dashboard: RoleDashboard }
  | { status: 'error'; message: string }

const EMPTY_CREDENTIALS: LoginCredentials = {
  email: '',
  password: '',
}
const DEMO_PASSWORD = 'teachflow-demo'
const DEFAULT_COURSE: CourseCreatePayload = {
  title: 'Nhập môn Trí tuệ nhân tạo',
  description: 'Course demo về nền tảng AI và ứng dụng trong thực tế.',
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

const ACTION_LABELS: Record<string, string> = {
  'Xem review queue': 'Xem hàng đợi duyệt',
  'Xem citations va warning': 'Xem citation và cảnh báo',
  'Approve & publish lesson': 'Duyệt và xuất bản lesson',
  'Request changes cho Teacher': 'Yêu cầu giảng viên chỉnh sửa',
  'Sua truc tiep lesson content': 'Sửa trực tiếp nội dung lesson',
  'Teacher Lesson Studio controls': 'Điều khiển Lesson Studio của giảng viên',
  'Student reading-only controls': 'Điều khiển chế độ đọc của sinh viên',
  'Tao course': 'Tạo course',
  'Tao class profile': 'Tạo hồ sơ lớp',
  'Add Student vao class': 'Thêm sinh viên vào lớp',
  'Mo Lesson Studio khi cac P0 sau san sang': 'Mở Lesson Studio',
  'Admin approve & publish': 'Admin duyệt và xuất bản',
  'Student-only reading view': 'Chế độ đọc chỉ dành cho sinh viên',
  'Xem class khong thuoc teacher hien tai': 'Xem lớp không thuộc giảng viên hiện tại',
  'Xem class minh duoc add': 'Xem lớp đã được thêm vào',
  'Xem published lessons': 'Xem lesson đã xuất bản',
  'Mo reading view': 'Mở chế độ đọc',
  'Mo presentation/PDF neu duoc phep': 'Mở trình chiếu/PDF khi được phép',
  'Teacher edit/regenerate/approve controls':
    'Công cụ sửa, tạo lại và duyệt của giảng viên',
  'Admin moderation controls': 'Công cụ kiểm duyệt Admin',
  'Draft/submitted lessons': 'Lesson nháp hoặc đang chờ duyệt',
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function displayName(name: string): string {
  const demoNames: Record<string, string> = {
    'Admin Demo': 'Quản trị viên Demo',
    'Teacher Demo': 'Giảng viên Demo',
    'Student Demo': 'Sinh viên Demo',
  }

  return demoNames[name] ?? name
}

function RoleIcon({ role }: { role: PublicDemoAccount['role'] }) {
  if (role === 'admin') {
    return <ShieldCheck aria-hidden="true" size={20} />
  }
  if (role === 'teacher') {
    return <GraduationCap aria-hidden="true" size={20} />
  }
  return <UserRound aria-hidden="true" size={20} />
}

function workflowItems(role: AuthSession['user']['role']) {
  if (role === 'admin') {
    return [
      { icon: ClipboardCheck, label: 'Hàng đợi duyệt' },
      { icon: FileText, label: 'Nguồn dẫn' },
      { icon: CheckCircle2, label: 'Xuất bản' },
    ]
  }

  if (role === 'student') {
    return [
      { icon: UsersRound, label: 'Lớp của tôi' },
      { icon: BookOpen, label: 'Lesson đã xuất bản' },
      { icon: MonitorPlay, label: 'Trình chiếu/PDF' },
    ]
  }

  return [
    { icon: LayoutDashboard, label: 'Tổng quan' },
    { icon: Library, label: 'Kho tri thức' },
    { icon: FileText, label: 'Dàn ý bài giảng' },
    { icon: ClipboardCheck, label: 'Lesson Studio' },
  ]
}

function LoginPanel({
  accountsState,
  backendUrl,
  credentials,
  loginError,
  isSubmitting,
  onChangeCredentials,
  onSelectAccount,
  onSubmit,
}: {
  accountsState: DemoAccountsState
  backendUrl: string
  credentials: LoginCredentials
  loginError: string | null
  isSubmitting: boolean
  onChangeCredentials: (credentials: LoginCredentials) => void
  onSelectAccount: (account: PublicDemoAccount) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <section className="login-layout" aria-labelledby="login-title">
      <div className="product-panel">
        <div className="brand-lockup">
          <span className="brand-mark">
            <GraduationCap aria-hidden="true" size={22} />
          </span>
          <strong>TeachFlow AI</strong>
        </div>
        <h1 id="login-title">Đăng nhập không gian làm việc</h1>
        <p className="lead">
          Chọn tài khoản demo để vào đúng vai trò và kiểm thử luồng tạo lesson
          bằng AI.
        </p>

        <div className="api-strip">
          <span>API</span>
          <code>{backendUrl || 'URL_BACKEND missing'}</code>
          <span>Mật khẩu demo</span>
          <code>{DEMO_PASSWORD}</code>
        </div>
      </div>

      <form className="login-card" onSubmit={onSubmit}>
        <div>
          <p className="section-label">Tài khoản demo</p>
          <div className="account-list" aria-live="polite">
            {accountsState.status === 'loading' && (
              <p className="muted">Đang tải danh sách tài khoản...</p>
            )}

            {accountsState.status === 'error' && (
              <p className="error-text">{accountsState.message}</p>
            )}

            {accountsState.status === 'ready' &&
              accountsState.accounts.map((account) => (
                <button
                  className={`account-button${
                    credentials.email === account.email ? ' selected' : ''
                  }`}
                  disabled={isSubmitting}
                  key={account.id}
                  type="button"
                  onClick={() => onSelectAccount(account)}
                >
                  <RoleIcon role={account.role} />
                  <span>
                    <strong>{roleLabel(account.role)}</strong>
                    <small>{account.email}</small>
                  </span>
                </button>
              ))}
          </div>
        </div>

        <label className="field">
          <span>Email</span>
          <input
            autoComplete="username"
            name="email"
            type="email"
            value={credentials.email}
            onChange={(event) =>
              onChangeCredentials({
                ...credentials,
                email: event.target.value,
              })
            }
          />
        </label>

        <label className="field">
          <span>Mật khẩu</span>
          <input
            autoComplete="current-password"
            name="password"
            type="password"
            value={credentials.password}
            onChange={(event) =>
              onChangeCredentials({
                ...credentials,
                password: event.target.value,
              })
            }
          />
        </label>

        {loginError && <p className="error-text">{loginError}</p>}

        <button className="primary-button" disabled={isSubmitting} type="submit">
          <ShieldCheck aria-hidden="true" size={18} />
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </section>
  )
}

function ActionList({ items }: { items: string[] }) {
  return (
    <ul className="action-list">
      {items.map((item) => (
        <li key={item}>{ACTION_LABELS[item] ?? item}</li>
      ))}
    </ul>
  )
}

function documentStatusLabel(document: SourceDocument): string {
  if (document.status === 'completed') {
    return `${document.chunk_count} chunk`
  }

  return document.error_message ?? document.status
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
              <p>{citation.excerpt}</p>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

function LessonPresentation({
  lesson,
  onClose,
}: {
  lesson: LessonSession
  onClose?: () => void
}) {
  const panelRef = useRef<HTMLElement | null>(null)
  const slides = useMemo(() => buildLessonSlides(lesson), [lesson])
  const [slideIndex, setSlideIndex] = useState(0)
  const currentSlideIndex = clampSlideIndex(slideIndex, slides.length)
  const activeSlide = slides[currentSlideIndex]

  useEffect(() => {
    setSlideIndex(0)
  }, [lesson.id])

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

  function handlePrint() {
    window.print()
  }

  return (
    <section className="presentation-panel presentation-print-area" ref={panelRef}>
      <div className="presentation-controls">
        <button
          className="ghost-button"
          disabled={currentSlideIndex === 0}
          type="button"
          onClick={() => setSlideIndex((current) => clampSlideIndex(current - 1, slides.length))}
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
          onClick={() => setSlideIndex((current) => clampSlideIndex(current + 1, slides.length))}
        >
          Tiếp
          <ChevronRight aria-hidden="true" size={17} />
        </button>
        <button className="ghost-button" type="button" onClick={handleFullscreen}>
          <Maximize2 aria-hidden="true" size={17} />
          Toàn màn hình
        </button>
        <button className="primary-button" type="button" onClick={handlePrint}>
          <Printer aria-hidden="true" size={17} />
          Xuất PDF
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

function TeacherManagement({ token }: { token: string }) {
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
  const [ragTopic, setRagTopic] = useState(DEFAULT_RAG_TOPIC)
  const [retrievalResult, setRetrievalResult] = useState<RetrievalResponse | null>(
    null,
  )
  const [outlines, setOutlines] = useState<CourseOutline[]>([])
  const [teacherLessons, setTeacherLessons] = useState<LessonSession[]>([])
  const [lessonResult, setLessonResult] = useState<LessonSession | null>(null)
  const [presentationLesson, setPresentationLesson] = useState<LessonSession | null>(
    null,
  )
  const [blockDrafts, setBlockDrafts] = useState<
    Record<string, { title: string; content: string }>
  >({})
  const [selectedOutlineId, setSelectedOutlineId] = useState('')
  const [selectedLessonId, setSelectedLessonId] = useState('')
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(1)
  const [outlineDraft, setOutlineDraft] =
    useState<OutlineSessionUpdatePayload>(emptyOutlineDraft)
  const [statusMessage, setStatusMessage] = useState('Đang tải dữ liệu course...')
  const [ragStatusMessage, setRagStatusMessage] = useState(
    'Đang tải kho tri thức...',
  )
  const [outlineStatusMessage, setOutlineStatusMessage] = useState(
    'Chọn course, lớp và nguồn tri thức để tạo dàn ý.',
  )
  const [lessonStatusMessage, setLessonStatusMessage] = useState(
    'Chọn một buổi trong dàn ý để tạo lesson blocks.',
  )
  const [isBusy, setIsBusy] = useState(false)
  const [isRetrieving, setIsRetrieving] = useState(false)
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false)
  const [isSavingOutline, setIsSavingOutline] = useState(false)
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false)
  const [isReviewingLesson, setIsReviewingLesson] = useState(false)

  const selectedOutline = outlines.find((outline) => outline.id === selectedOutlineId)
  const selectedSession = selectedOutline?.sessions.find(
    (session) => session.session_index === selectedSessionIndex,
  )
  const canReviewLesson =
    lessonResult?.status === 'teacher_reviewing' ||
    lessonResult?.status === 'changes_requested'

  useEffect(() => {
    let cancelled = false

    async function loadTeacherData() {
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
        setSelectedDocumentIds(
          documentData
            .filter((document) => document.status === 'completed')
            .slice(0, 1)
            .map((document) => document.id),
        )
        setSelectedStudentId(studentData[0]?.id ?? '')
        setRagStatusMessage(
          documentData.length
            ? 'Đã tải kho tri thức.'
            : 'Chưa có tài liệu nguồn trong kho tri thức.',
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
              const [outlineData, lessonData] = await Promise.all([
                fetchClassOutlines(firstClassId, token),
                fetchTeacherLessons(firstClassId, token),
              ])
              if (!cancelled) {
                setOutlines(outlineData)
                setTeacherLessons(lessonData)
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
          selectOutline(null)
          selectTeacherLesson(null)
          setStatusMessage('Chưa có course nào.')
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const message = getErrorMessage(error, 'Không tải được dữ liệu giảng viên')
          setStatusMessage(message)
          setRagStatusMessage(message)
        }
      }
    }

    void loadTeacherData()

    return () => {
      cancelled = true
    }
  }, [token])

  async function handleCourseSelect(courseId: string) {
    setSelectedCourseId(courseId)
    setSelectedClassId('')
    setOutlines([])
    setTeacherLessons([])
    selectOutline(null)
    selectTeacherLesson(null)
    setStatusMessage('Đang tải danh sách lớp...')

    if (!courseId) {
      setClasses([])
      setStatusMessage('Chưa chọn course.')
      return
    }

    try {
      const classData = await fetchCourseClasses(courseId, token)
      const firstClassId = classData[0]?.id ?? ''
      setClasses(classData)
      setSelectedClassId(firstClassId)
      if (firstClassId) {
        const [outlineData, lessonData] = await Promise.all([
          fetchClassOutlines(firstClassId, token),
          fetchTeacherLessons(firstClassId, token),
        ])
        setOutlines(outlineData)
        setTeacherLessons(lessonData)
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
    selectOutline(null)
    selectTeacherLesson(null)
    if (!classId) {
      setOutlineStatusMessage('Chọn lớp trước khi tạo dàn ý.')
      return
    }

    try {
      const [outlineData, lessonData] = await Promise.all([
        fetchClassOutlines(classId, token),
        fetchTeacherLessons(classId, token),
      ])
      setOutlines(outlineData)
      setTeacherLessons(lessonData)
      selectOutline(outlineData[0] ?? null)
      selectTeacherLesson(lessonData[0] ?? null)
      setOutlineStatusMessage(
        outlineData.length ? 'Đã tải dàn ý.' : 'Chưa có dàn ý nào.',
      )
    } catch (error: unknown) {
      setOutlineStatusMessage(getErrorMessage(error, 'Không tải được dàn ý'))
    }
  }

  async function handleCourseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsBusy(true)
    setStatusMessage('Đang tạo course...')

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
      setStatusMessage(`Đã tạo course ${course.title}.`)
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error, 'Không tạo được course'))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleClassSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCourseId) {
      setStatusMessage('Tạo hoặc chọn course trước.')
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
      const student = students.find((candidate) => candidate.id === selectedStudentId)
      setStatusMessage(`Đã thêm ${student?.name ?? 'sinh viên'} vào lớp.`)
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error, 'Không thêm được sinh viên'))
    } finally {
      setIsBusy(false)
    }
  }

  function handleDocumentToggle(document: SourceDocument) {
    if (document.status !== 'completed') {
      return
    }

    setSelectedDocumentIds((current) =>
      current.includes(document.id)
        ? current.filter((documentId) => documentId !== document.id)
        : [...current, document.id],
    )
  }

  async function handleRetrievalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedDocumentIds.length) {
      setRagStatusMessage('Chọn ít nhất một tài liệu nguồn đã hoàn tất.')
      setRetrievalResult(null)
      return
    }

    setIsRetrieving(true)
    setRagStatusMessage('Đang truy xuất chunks liên quan...')

    try {
      const response = await retrieveChunks(
        {
          topic: ragTopic,
          selected_document_ids: selectedDocumentIds,
          top_k: 5,
        },
        token,
      )
      setRetrievalResult(response)
      setRagStatusMessage(
        response.chunks.length
          ? `Đã truy xuất ${response.chunks.length} chunk.`
          : 'Không tìm thấy chunk phù hợp với chủ đề này.',
      )
    } catch (error: unknown) {
      setRetrievalResult(null)
      setRagStatusMessage(getErrorMessage(error, 'Không truy xuất được chunks'))
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
    setBlockDrafts({})
  }

  function selectSession(session: OutlineSession) {
    setSelectedSessionIndex(session.session_index)
    setOutlineDraft(sessionToDraft(session))
    setLessonResult(null)
    setSelectedLessonId('')
    setBlockDrafts({})
  }

  function selectTeacherLesson(lesson: LessonSession | null) {
    setSelectedLessonId(lesson?.id ?? '')
    setLessonWithDrafts(lesson)
    if (lesson?.admin_feedback) {
      setLessonStatusMessage(`Phản hồi từ Admin: ${lesson.admin_feedback}`)
    } else if (lesson) {
      setLessonStatusMessage(`Đã tải lesson: ${lessonStatusLabel(lesson.status)}.`)
    }
  }

  function setLessonWithDrafts(lesson: LessonSession | null) {
    setLessonResult(lesson)
    if (!lesson) {
      setBlockDrafts({})
      setPresentationLesson(null)
      return
    }
    setSelectedLessonId(lesson.id)
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
    setBlockDrafts(
      Object.fromEntries(
        lesson.blocks.map((block) => [
          block.id,
          { title: block.title, content: block.content },
        ]),
      ),
    )
  }

  async function handleGenerateOutline() {
    if (!selectedCourseId || !selectedClassId) {
      setOutlineStatusMessage('Chọn course và lớp trước khi tạo dàn ý.')
      return
    }
    if (!selectedDocumentIds.length) {
      setOutlineStatusMessage('Chọn ít nhất một tài liệu nguồn đã hoàn tất.')
      return
    }

    setIsGeneratingOutline(true)
    setOutlineStatusMessage('AI đang tạo dàn ý...')

    try {
      const outline = await generateOutline(
        {
          course_id: selectedCourseId,
          class_id: selectedClassId,
          selected_document_ids: selectedDocumentIds,
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
    setLessonStatusMessage('AI đang tạo lesson blocks...')

    try {
      const lesson = await generateLessonBlocks(
        {
          outline_id: selectedOutline.id,
          session_index: selectedSession.session_index,
        },
        token,
      )
      setLessonWithDrafts(lesson)
      setLessonStatusMessage(`Đã tạo ${lesson.blocks.length} lesson block.`)
    } catch (error: unknown) {
      setLessonWithDrafts(null)
      setLessonStatusMessage(getErrorMessage(error, 'Không tạo được lesson blocks'))
    } finally {
      setIsGeneratingLesson(false)
    }
  }

  async function handleSaveLessonBlock(block: LessonBlock) {
    const draft = blockDrafts[block.id]
    if (!draft) {
      return
    }

    setIsReviewingLesson(true)
    setLessonStatusMessage('Đang lưu block...')

    try {
      const lesson = await updateLessonBlock(block.id, draft, token)
      setLessonWithDrafts(lesson)
      setLessonStatusMessage('Đã lưu block.')
    } catch (error: unknown) {
      setLessonStatusMessage(getErrorMessage(error, 'Không lưu được block'))
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
      setLessonStatusMessage(getErrorMessage(error, 'Không cập nhật được trạng thái block'))
    } finally {
      setIsReviewingLesson(false)
    }
  }

  async function handleRegenerateLessonBlock(block: LessonBlock) {
    setIsReviewingLesson(true)
    setLessonStatusMessage('AI đang tạo lại block...')

    try {
      const lesson = await regenerateLessonBlock(block.id, token)
      setLessonWithDrafts(lesson)
      setLessonStatusMessage('Đã tạo lại block.')
    } catch (error: unknown) {
      setLessonStatusMessage(getErrorMessage(error, 'Không tạo lại được block'))
    } finally {
      setIsReviewingLesson(false)
    }
  }

  async function handleSubmitLesson() {
    if (!lessonResult) {
      return
    }

    setIsReviewingLesson(true)
    setLessonStatusMessage('Đang gửi lesson cho Admin duyệt...')

    try {
      const lesson = await submitLesson(lessonResult.id, token)
      setLessonWithDrafts(lesson)
      setLessonStatusMessage('Đã gửi lesson cho Admin duyệt.')
    } catch (error: unknown) {
      setLessonStatusMessage(getErrorMessage(error, 'Không gửi được lesson'))
    } finally {
      setIsReviewingLesson(false)
    }
  }

  return (
    <section className="panel learning-panel">
      <div className="panel-heading">
        <p className="section-label">Course và lớp học</p>
        <span className="status-pill neutral-pill">Thiết lập</span>
      </div>

      <div className="learning-grid">
        <form className="learning-form" onSubmit={handleCourseSubmit}>
          <h2>Tạo course</h2>
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
          <button className="primary-button" disabled={isBusy} type="submit">
            <Plus aria-hidden="true" size={17} />
            Tạo course
          </button>
        </form>

        <form className="learning-form" onSubmit={handleClassSubmit}>
          <h2>Tạo hồ sơ lớp</h2>
          <label className="field">
            <span>Course</span>
            <select
              value={selectedCourseId}
              onChange={(event) => void handleCourseSelect(event.target.value)}
            >
              <option value="">Chọn course</option>
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
          <button className="primary-button" disabled={isBusy} type="submit">
            <UsersRound aria-hidden="true" size={17} />
            Tạo lớp
          </button>
        </form>

        <form className="learning-form" onSubmit={handleMembershipSubmit}>
          <h2>Thêm sinh viên</h2>
          <label className="field">
            <span>Lớp</span>
            <select
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
          <button className="primary-button" disabled={isBusy} type="submit">
            <UserRound aria-hidden="true" size={17} />
            Thêm sinh viên
          </button>
        </form>
      </div>

      <p className="state-panel compact-state">{statusMessage}</p>

      <form className="knowledge-panel" onSubmit={handleRetrievalSubmit}>
        <div className="panel-heading">
          <p className="section-label">Kho tri thức và RAG</p>
          <span className="status-pill neutral-pill">RAG</span>
        </div>

        <label className="field">
          <span>Chủ đề truy xuất</span>
          <input
            value={ragTopic}
            onChange={(event) => setRagTopic(event.target.value)}
          />
        </label>

        {documents.length > 0 ? (
          <div className="document-list">
            {documents.map((document) => {
              const isCompleted = document.status === 'completed'
              const isSelected = selectedDocumentIds.includes(document.id)

              return (
                <label
                  className={`document-row${isCompleted ? '' : ' disabled'}`}
                  key={document.id}
                >
                  <input
                    checked={isSelected}
                    disabled={!isCompleted || isRetrieving}
                    type="checkbox"
                    onChange={() => handleDocumentToggle(document)}
                  />
                  <span>
                    <strong>{document.title}</strong>
                    <small>{document.file_name}</small>
                  </span>
                  <em>{documentStatusLabel(document)}</em>
                </label>
              )
            })}
          </div>
        ) : (
          <p className="muted">{ragStatusMessage}</p>
        )}

        {!selectedDocumentIds.length && documents.length > 0 && (
          <p className="warning-text">
            Chọn một tài liệu đã hoàn tất trước khi truy xuất.
          </p>
        )}

        <button className="primary-button" disabled={isRetrieving} type="submit">
          <Library aria-hidden="true" size={17} />
          {isRetrieving ? 'Đang truy xuất...' : 'Truy xuất chunks'}
        </button>

        <p className="state-panel compact-state">{ragStatusMessage}</p>

        {retrievalResult && (
          <div className="chunk-list">
            {retrievalResult.chunks.map((chunk) => (
              <article className="chunk-row" key={chunk.chunk_id}>
                <div>
                  <strong>{chunk.document_title}</strong>
                  <span className="citation-meta">
                    Trang {chunk.page_number ?? 'n/a'} - chunk {chunk.chunk_index} -
                    điểm {chunk.score.toFixed(2)}
                  </span>
                </div>
                <p>{chunk.excerpt}</p>
              </article>
            ))}
          </div>
        )}
      </form>

      <section className="outline-panel">
        <div className="panel-heading">
          <p className="section-label">Dàn ý bài giảng AI</p>
          <span className="status-pill neutral-pill">AI</span>
        </div>

        <div className="outline-actions">
          <button
            className="primary-button"
            disabled={isGeneratingOutline}
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
                          Trang {chunk.page_number ?? 'n/a'} - chunk{' '}
                          {chunk.chunk_index}
                        </span>
                      </div>
                      <p>{chunk.excerpt}</p>
                    </article>
                  ))}
                </div>

                <div className="lesson-block-panel">
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
                      ? 'Đang tạo lesson blocks...'
                      : 'Tạo lesson blocks'}
                  </button>

                  <p className="state-panel compact-state">{lessonStatusMessage}</p>

                  {teacherLessons.length > 0 && (
                    <label className="field">
                      <span>Lesson đã có</span>
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
                    <div className="lesson-block-list">
                      {lessonResult.admin_feedback && (
                        <p className="warning-text">
                          Phản hồi từ Admin: {lessonResult.admin_feedback}
                        </p>
                      )}
                      <div className="lesson-submit-row">
                        <span>{lessonStatusLabel(lessonResult.status)}</span>
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
                      </div>

                      {lessonResult.blocks.map((block) => (
                        <article className="lesson-block" key={block.id}>
                          <div className="lesson-block-header">
                            <span>{blockTypeLabel(block.type)}</span>
                            <strong>{blockStatusLabel(block.status)}</strong>
                          </div>

                          <label className="field">
                            <span>Tiêu đề block</span>
                            <input
                              value={blockDrafts[block.id]?.title ?? block.title}
                              onChange={(event) =>
                                setBlockDrafts((current) => ({
                                  ...current,
                                  [block.id]: {
                                    title: event.target.value,
                                    content:
                                      current[block.id]?.content ?? block.content,
                                  },
                                }))
                              }
                            />
                          </label>

                          <label className="field">
                            <span>Nội dung block</span>
                            <textarea
                              value={blockDrafts[block.id]?.content ?? block.content}
                              onChange={(event) =>
                                setBlockDrafts((current) => ({
                                  ...current,
                                  [block.id]: {
                                    title: current[block.id]?.title ?? block.title,
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
                              onClick={() => void handleSaveLessonBlock(block)}
                            >
                              <Save aria-hidden="true" size={16} />
                              Lưu
                            </button>
                            <button
                              className="ghost-button"
                              disabled={isReviewingLesson || !canReviewLesson}
                              type="button"
                              onClick={() => void handleRegenerateLessonBlock(block)}
                            >
                              <RotateCcw aria-hidden="true" size={16} />
                              Tạo lại
                            </button>
                            <button
                              className="ghost-button"
                              disabled={isReviewingLesson || !canReviewLesson}
                              type="button"
                              onClick={() =>
                                void handleSetLessonBlockStatus(block, 'approved')
                              }
                            >
                              <CheckCircle2 aria-hidden="true" size={16} />
                              Duyệt
                            </button>
                            <button
                              className="ghost-button"
                              disabled={
                                isReviewingLesson || !canReviewLesson || !block.warning
                              }
                              type="button"
                              onClick={() =>
                                void handleSetLessonBlockStatus(
                                  block,
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
                                void handleSetLessonBlockStatus(block, 'rejected')
                              }
                            >
                              <XCircle aria-hidden="true" size={16} />
                              Cần sửa
                            </button>
                          </div>

                          {block.warning && (
                            <p className="warning-text">{block.warning}</p>
                          )}
                          <div className="chunk-list">
                            {block.citations.map((citation) => (
                              <article className="chunk-row" key={citation.chunk_id}>
                                <div>
                                  <strong>{citation.document_title}</strong>
                                  <span className="citation-meta">
                                    Trang {citation.page_number ?? 'n/a'} - chunk{' '}
                                    {citation.chunk_index} - điểm{' '}
                                    {citation.score.toFixed(2)}
                                  </span>
                                </div>
                                <p>{citation.excerpt}</p>
                              </article>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {presentationLesson && (
                    <LessonPresentation
                      lesson={presentationLesson}
                      onClose={() => setPresentationLesson(null)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </section>
  )
}

function StudentClasses({ token }: { token: string }) {
  const [classes, setClasses] = useState<StudentClassSummary[]>([])
  const [lessons, setLessons] = useState<LessonSession[]>([])
  const [selectedLesson, setSelectedLesson] = useState<LessonSession | null>(null)
  const [statusMessage, setStatusMessage] = useState('Đang tải lớp của tôi...')
  const [lessonStatusMessage, setLessonStatusMessage] = useState(
    'Đang tải lesson đã xuất bản...',
  )
  const [isLoadingLesson, setIsLoadingLesson] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadStudentWorkspace() {
      try {
        const [classData, lessonData] = await Promise.all([
          fetchStudentClasses(token),
          fetchStudentLessons(token),
        ])
        if (!cancelled) {
          setClasses(classData)
          setLessons(lessonData)
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
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const message = getErrorMessage(error, 'Không tải được không gian sinh viên')
          setStatusMessage(message)
          setLessonStatusMessage(message)
        }
      }
    }

    void loadStudentWorkspace()

    return () => {
      cancelled = true
    }
  }, [token])

  async function handleOpenLesson(lesson: LessonSession) {
    setIsLoadingLesson(true)
    setLessonStatusMessage('Đang tải lesson...')
    try {
      const lessonDetail = await fetchStudentLesson(lesson.id, token)
      setSelectedLesson(lessonDetail)
      setLessonStatusMessage(`Đã tải ${lessonDetail.title}.`)
    } catch (error: unknown) {
      setLessonStatusMessage(getErrorMessage(error, 'Không tải được lesson'))
    } finally {
      setIsLoadingLesson(false)
    }
  }

  return (
    <section className="panel learning-panel">
      <div className="panel-heading">
        <p className="section-label">Lớp của tôi</p>
        <span className="status-pill neutral-pill">Thành viên</span>
      </div>

      {classes.length > 0 ? (
        <ul className="class-list">
          {classes.map((classSummary) => (
            <li key={classSummary.class_id}>
              <strong>{classSummary.class_name}</strong>
              <span>{classSummary.course_title}</span>
              <span>
                {studentLevelLabel(classSummary.student_level)} -{' '}
                {classSummary.session_count} buổi x{' '}
                {classSummary.minutes_per_session} phút
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{statusMessage}</p>
      )}

      <div className="outline-panel">
        <div className="panel-heading">
          <p className="section-label">Lesson đã xuất bản</p>
          <span className="status-pill neutral-pill">Đã xuất bản</span>
        </div>

        <p className="state-panel compact-state">{lessonStatusMessage}</p>

        {lessons.length > 0 && (
          <div className="class-list">
            {lessons.map((lesson) => (
              <article className="student-lesson-row" key={lesson.id}>
                <div>
                  <strong>{lesson.title}</strong>
                  <span>
                    Buổi {lesson.outline_session_index} - {lesson.blocks.length}{' '}
                    block
                  </span>
                </div>
                <button
                  className="ghost-button"
                  disabled={isLoadingLesson}
                  type="button"
                  onClick={() => void handleOpenLesson(lesson)}
                >
                  <BookOpen aria-hidden="true" size={16} />
                  Mở
                </button>
              </article>
            ))}
          </div>
        )}

        {selectedLesson && (
          <>
            <LessonPresentation lesson={selectedLesson} />

            <div className="lesson-block-list">
              <div className="lesson-submit-row">
                <span>{lessonStatusLabel(selectedLesson.status)}</span>
                <strong>{selectedLesson.title}</strong>
              </div>

              {selectedLesson.blocks.map((block) => (
                <article className="lesson-block" key={block.id}>
                  <div className="lesson-block-header">
                    <span>{blockTypeLabel(block.type)}</span>
                    <strong>{blockStatusLabel(block.status)}</strong>
                  </div>
                  <h3>{block.title}</h3>
                  <p>{block.content}</p>
                  {block.warning && <p className="warning-text">{block.warning}</p>}
                  <div className="chunk-list">
                    {block.citations.map((citation) => (
                      <article className="chunk-row" key={citation.chunk_id}>
                        <div>
                          <strong>{citation.document_title}</strong>
                          <span className="citation-meta">
                            Trang {citation.page_number ?? 'n/a'} - chunk{' '}
                            {citation.chunk_index} - điểm {citation.score.toFixed(2)}
                          </span>
                        </div>
                        <p>{citation.excerpt}</p>
                      </article>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function AdminModeration({ token }: { token: string }) {
  const [reviewLessons, setReviewLessons] = useState<LessonSession[]>([])
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({})
  const [statusMessage, setStatusMessage] = useState('Đang tải hàng đợi Admin...')
  const [busyLessonId, setBusyLessonId] = useState<string | null>(null)

  const loadReviewQueue = useCallback(async () => {
    setStatusMessage('Đang tải hàng đợi Admin...')
    try {
      const lessons = await fetchAdminReviewQueue(token)
      setReviewLessons(lessons)
      setStatusMessage(
        lessons.length
          ? `Đã tải ${lessons.length} lesson đang chờ duyệt.`
          : 'Không có lesson nào đang chờ Admin duyệt.',
      )
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error, 'Không tải được hàng đợi Admin'))
    }
  }, [token])

  useEffect(() => {
    void loadReviewQueue()
  }, [loadReviewQueue])

  function replaceLesson(updatedLesson: LessonSession) {
    setReviewLessons((current) =>
      current.map((lesson) =>
        lesson.id === updatedLesson.id ? updatedLesson : lesson,
      ),
    )
  }

  async function handlePublish(lesson: LessonSession) {
    setBusyLessonId(lesson.id)
    setStatusMessage('Đang xuất bản lesson...')
    try {
      const updatedLesson = await publishLesson(lesson.id, token)
      replaceLesson(updatedLesson)
      setStatusMessage(`Đã xuất bản ${updatedLesson.title}.`)
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error, 'Không xuất bản được lesson'))
    } finally {
      setBusyLessonId(null)
    }
  }

  async function handleRequestChanges(lesson: LessonSession) {
    const feedback = feedbackDrafts[lesson.id]?.trim()
    if (!feedback) {
      setStatusMessage('Nhập phản hồi trước khi yêu cầu chỉnh sửa.')
      return
    }

    setBusyLessonId(lesson.id)
    setStatusMessage('Đang yêu cầu chỉnh sửa...')
    try {
      const updatedLesson = await requestLessonChanges(
        lesson.id,
        { feedback },
        token,
      )
      replaceLesson(updatedLesson)
      setStatusMessage(`Đã trả ${updatedLesson.title} về cho giảng viên.`)
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error, 'Không gửi được yêu cầu chỉnh sửa'))
    } finally {
      setBusyLessonId(null)
    }
  }

  return (
    <section className="panel learning-panel admin-review-panel">
      <div className="panel-heading">
        <p className="section-label">Kiểm duyệt Admin</p>
        <span className="status-pill neutral-pill">Kiểm duyệt</span>
      </div>

      <div className="outline-actions">
        <button
          className="primary-button"
          disabled={busyLessonId !== null}
          type="button"
          onClick={() => void loadReviewQueue()}
        >
          <RefreshCcw aria-hidden="true" size={17} />
          Tải lại hàng đợi
        </button>
        <p className="state-panel compact-state">{statusMessage}</p>
      </div>

      {reviewLessons.length > 0 ? (
        <div className="admin-lesson-list">
          {reviewLessons.map((lesson) => {
            const warningCount = lesson.blocks.filter((block) => block.warning).length
            const citationCount = lesson.blocks.reduce(
              (count, block) => count + block.citations.length,
              0,
            )
            const isBusy = busyLessonId === lesson.id
            const canModerate = lesson.status === 'submitted_for_admin_review'

            return (
              <article className="admin-lesson-card" key={lesson.id}>
                <div className="lesson-block-header">
                  <span>{lesson.title}</span>
                  <strong>{lessonStatusLabel(lesson.status)}</strong>
                </div>

                <div className="review-stats">
                  <span>{lesson.blocks.length} block</span>
                  <span>{citationCount} citation</span>
                  <span>{warningCount} cảnh báo</span>
                </div>

                {lesson.admin_feedback && (
                  <p className="warning-text">{lesson.admin_feedback}</p>
                )}

                <label className="field">
                  <span>Phản hồi cho giảng viên</span>
                  <textarea
                    disabled={!canModerate || isBusy}
                    value={feedbackDrafts[lesson.id] ?? ''}
                    onChange={(event) =>
                      setFeedbackDrafts((current) => ({
                        ...current,
                        [lesson.id]: event.target.value,
                      }))
                    }
                  />
                </label>

                <div className="block-actions">
                  <button
                    className="primary-button"
                    disabled={!canModerate || isBusy}
                    type="button"
                    onClick={() => void handlePublish(lesson)}
                  >
                    <CheckCircle2 aria-hidden="true" size={17} />
                    Duyệt và xuất bản
                  </button>
                  <button
                    className="ghost-button"
                    disabled={!canModerate || isBusy}
                    type="button"
                    onClick={() => void handleRequestChanges(lesson)}
                  >
                    <Send aria-hidden="true" size={17} />
                    Yêu cầu chỉnh sửa
                  </button>
                </div>

                <div className="lesson-block-list">
                  {lesson.blocks.map((block) => (
                    <article className="lesson-block" key={block.id}>
                      <div className="lesson-block-header">
                        <span>{blockTypeLabel(block.type)}</span>
                        <strong>{blockStatusLabel(block.status)}</strong>
                      </div>
                      <h3>{block.title}</h3>
                      <p>{block.content}</p>
                      {block.warning && (
                        <p className="warning-text">{block.warning}</p>
                      )}
                      <div className="chunk-list">
                        {block.citations.map((citation) => (
                          <article className="chunk-row" key={citation.chunk_id}>
                            <div>
                              <strong>{citation.document_title}</strong>
                              <span className="citation-meta">
                                Trang {citation.page_number ?? 'n/a'} - chunk{' '}
                                {citation.chunk_index} - điểm{' '}
                                {citation.score.toFixed(2)}
                              </span>
                            </div>
                            <p>{citation.excerpt}</p>
                          </article>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="muted">{statusMessage}</p>
      )}
    </section>
  )
}

function DashboardShell({
  backendUrl,
  dashboardState,
  isLoggingOut,
  session,
  onLogout,
}: {
  backendUrl: string
  dashboardState: DashboardState
  isLoggingOut: boolean
  session: AuthSession
  onLogout: () => void
}) {
  const workspace = getWorkspaceConfig(session.user.role)
  const navItems = workflowItems(session.user.role)

  return (
    <section className="workspace" aria-labelledby="workspace-title">
      <header className="workspace-header">
        <div className="workspace-title-group">
          <div className="brand-lockup compact-brand">
            <span className="brand-mark">
              <GraduationCap aria-hidden="true" size={20} />
            </span>
            <strong>TeachFlow AI</strong>
          </div>
          <div>
            <p className="eyebrow">{workspace.eyebrow}</p>
            <h1 id="workspace-title">{workspace.title}</h1>
          </div>
        </div>
        <div className="identity">
          <span>{displayName(session.user.name)}</span>
          <strong>{roleLabel(session.user.role)}</strong>
          <button
            className="ghost-button"
            disabled={isLoggingOut}
            type="button"
            onClick={onLogout}
          >
            <LogOut aria-hidden="true" size={17} />
            {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
          </button>
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="sidebar">
          <p className="section-label">Không gian làm việc</p>
          <strong>{workspace.focus}</strong>
          <nav className="workspace-nav" aria-label="Điều hướng workspace">
            {navItems.map((item, index) => {
              const Icon = item.icon
              return (
                <span className={index === 0 ? 'active' : ''} key={item.label}>
                  <Icon aria-hidden="true" size={18} />
                  {item.label}
                </span>
              )
            })}
          </nav>
          <div className="api-strip compact">
            <span>API</span>
            <code>{backendUrl || 'URL_BACKEND missing'}</code>
          </div>
        </aside>

        <div className="workspace-main" aria-live="polite">
          {dashboardState.status === 'loading' && (
            <div className="state-panel">Đang xác thực vai trò...</div>
          )}

          {dashboardState.status === 'error' && (
            <div className="state-panel error">{dashboardState.message}</div>
          )}

          {dashboardState.status === 'ready' && (
            <>
              <section className="panel">
                <div className="panel-heading">
                  <p className="section-label">Xác thực vai trò</p>
                  <span className="status-pill">Đã xác thực</span>
                </div>
                <h2>{workspace.title}</h2>
                <p className="muted">
                  {dashboardState.dashboard.current_user.email}
                </p>
                <ActionList items={dashboardState.dashboard.allowed_actions} />
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <p className="section-label">Ẩn ngoài vai trò này</p>
                  <span className="status-pill muted-pill">Được bảo vệ</span>
                </div>
                <ActionList items={dashboardState.dashboard.hidden_actions} />
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <p className="section-label">Luồng thao tác</p>
                  <span className="status-pill neutral-pill">
                    {roleLabel(workspace.role)}
                  </span>
                </div>
                <div className="action-buttons">
                  {workspace.primaryActions.map((action) => (
                    <span className="secondary-action" key={action}>
                      {action}
                    </span>
                  ))}
                </div>
              </section>

              {session.user.role === 'teacher' && (
                <TeacherManagement token={session.access_token} />
              )}

              {session.user.role === 'admin' && (
                <AdminModeration token={session.access_token} />
              )}

              {session.user.role === 'student' && (
                <StudentClasses token={session.access_token} />
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function App() {
  const backendUrl = useMemo(() => {
    try {
      return getBackendUrl()
    } catch {
      return ''
    }
  }, [])
  const [accountsState, setAccountsState] = useState<DemoAccountsState>({
    status: 'loading',
  })
  const [credentials, setCredentials] =
    useState<LoginCredentials>(EMPTY_CREDENTIALS)
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    status: 'idle',
  })
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [session, setSession] = useState<AuthSession | null>(() =>
    loadAuthSession(),
  )

  useEffect(() => {
    if (!backendUrl) {
      setAccountsState({
        status: 'error',
        message: 'Chưa cấu hình URL_BACKEND',
      })
      return
    }

    let cancelled = false

    fetchDemoAccounts()
      .then((accounts) => {
        if (!cancelled) {
          setAccountsState({ status: 'ready', accounts })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setAccountsState({
            status: 'error',
            message: getErrorMessage(error, 'Không tải được tài khoản demo'),
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [backendUrl])

  useEffect(() => {
    if (!session) {
      setDashboardState({ status: 'idle' })
      return
    }

    let cancelled = false
    setDashboardState({ status: 'loading' })

    Promise.all([
      fetchCurrentUser(session.access_token),
      fetchRoleDashboard(session.user.role, session.access_token),
    ])
      .then(([currentUser, dashboard]) => {
        if (cancelled) {
          return
        }

        const verifiedSession = { ...session, user: currentUser }
        if (
          currentUser.id !== session.user.id ||
          currentUser.role !== session.user.role
        ) {
          saveAuthSession(verifiedSession)
          setSession(verifiedSession)
        }
        setDashboardState({ status: 'ready', dashboard })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          clearAuthSession()
          setSession(null)
          setLoginError(getErrorMessage(error, 'Phiên đăng nhập đã hết hạn'))
        }
      })

    return () => {
      cancelled = true
    }
  }, [session])

  async function authenticate(nextCredentials: LoginCredentials) {
    setIsLoggingIn(true)
    setLoginError(null)

    try {
      const nextSession = await login(nextCredentials)
      saveAuthSession(nextSession)
      setSession(nextSession)
      setCredentials(EMPTY_CREDENTIALS)
      window.history.pushState(null, '', getRoleRoute(nextSession.user.role))
    } catch (error: unknown) {
      setLoginError(getErrorMessage(error, 'Đăng nhập thất bại'))
    } finally {
      setIsLoggingIn(false)
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await authenticate(credentials)
  }

  function handleSelectAccount(account: PublicDemoAccount) {
    const nextCredentials = {
      email: account.email,
      password: DEMO_PASSWORD,
    }
    setCredentials(nextCredentials)
    void authenticate(nextCredentials)
  }

  async function handleLogout() {
    if (!session) {
      return
    }

    setIsLoggingOut(true)

    try {
      await logout(session.access_token)
    } catch {
      // Local session cleanup still runs if the demo backend was restarted.
    } finally {
      clearAuthSession()
      setSession(null)
      setDashboardState({ status: 'idle' })
      window.history.pushState(null, '', '/')
      setIsLoggingOut(false)
    }
  }

  return (
    <main className="app-shell">
      {session ? (
        <DashboardShell
          backendUrl={backendUrl}
          dashboardState={dashboardState}
          isLoggingOut={isLoggingOut}
          session={session}
          onLogout={handleLogout}
        />
      ) : (
        <LoginPanel
          accountsState={accountsState}
          backendUrl={backendUrl}
          credentials={credentials}
          isSubmitting={isLoggingIn}
          loginError={loginError}
          onChangeCredentials={setCredentials}
          onSelectAccount={handleSelectAccount}
          onSubmit={handleLogin}
        />
      )}
    </main>
  )
}

export default App
