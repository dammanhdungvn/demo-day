import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  FileText,
  Link2,
  RefreshCcw,
  Save,
  Send,
  Search,
  Trash2,
  UploadCloud,
  UserCheck,
  UserX,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react'
import {
  createInvite,
  fetchInvites,
  fetchManagedUsers,
  updateManagedUser,
  updateManagedUserStatus,
  type ManagedUser,
  type ManagedUserRole,
  type ManagedUserStatus,
  type ManagedUserUpdatePayload,
  type OrganizationInviteRole,
  type OrganizationInvite,
} from '../../api/auth'
import {
  archiveDocument,
  fetchAdminReviewQueue,
  fetchDocuments,
  publishLesson,
  reindexDocument,
  rejectLesson,
  requestLessonChanges,
  updateDocumentMetadata,
  type DocumentUploadResponse,
  type LessonSession,
  type SourceDocument,
} from '../../api/learning'
import { getErrorMessage } from '../../errors'
import {
  blockStatusLabel,
  blockTypeLabel,
  lessonStatusLabel,
  roleLabel,
} from '../../labels'
import { MetricCard } from '../../ui/teacherWorkspace'
import {
  DataTable,
  PaginationControls,
  Spinner,
} from '../../ui/application'
import { buildPaginationState } from '../../ui/pagination'
import { documentUploadStatusMessage } from '../../uploadStatus'
import { WORKSPACE_SECTION_IDS } from '../../workspaceActionTargets'
import type { WorkspacePageId } from '../../workspacePages'
import { buildAdminReviewSummary } from '../adminStudentWorkspace'
import {
  buildManagedUserSummary,
  filterManagedUsers,
  type ManagedUserFilterState,
} from './userManagement'
import { KnowledgeUploadPanel } from '../knowledge/KnowledgeControls'
import {
  documentGovernanceLabels,
  documentStatusLabel,
  isSourceDocumentUsable,
} from '../knowledge/knowledgeHelpers'

function managedUserStatusLabel(status: ManagedUserStatus): string {
  return status === 'active' ? 'Đang hoạt động' : 'Đã tạm khóa'
}

function formatDateTime(value?: string | null): string {
  return value ? new Date(value).toLocaleString('vi-VN') : 'Chưa có'
}

function sourceTypeLabel(document: SourceDocument): string {
  if (document.source_type === 'url' || document.source_type === 'web_url') {
    return 'URL'
  }

  return 'PDF'
}

export function AdminWorkspace({
  activePage,
  token,
}: {
  activePage: WorkspacePageId
  token: string
}) {
  const [reviewLessons, setReviewLessons] = useState<LessonSession[]>([])
  const [documents, setDocuments] = useState<SourceDocument[]>([])
  const [invites, setInvites] = useState<OrganizationInvite[]>([])
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([])
  const [documentTitleDrafts, setDocumentTitleDrafts] = useState<Record<string, string>>(
    {},
  )
  const [managedUserDrafts, setManagedUserDrafts] = useState<
    Record<string, { name: string; email: string }>
  >({})
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<OrganizationInviteRole>('teacher')
  const [documentPage, setDocumentPage] = useState(1)
  const [invitePage, setInvitePage] = useState(1)
  const [managedUserPage, setManagedUserPage] = useState(1)
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null)
  const [editingManagedUserId, setEditingManagedUserId] = useState<string | null>(
    null,
  )
  const [managedUserFilters, setManagedUserFilters] =
    useState<ManagedUserFilterState>({
      query: '',
      role: 'all',
      status: 'all',
    })
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({})
  const [selectedReviewLessonId, setSelectedReviewLessonId] = useState<string | null>(
    null,
  )
  const [selectedAdminBlockId, setSelectedAdminBlockId] = useState<string | null>(
    null,
  )
  const [statusMessage, setStatusMessage] = useState('Đang tải hàng đợi Admin...')
  const [knowledgeStatusMessage, setKnowledgeStatusMessage] = useState(
    'Đang tải kho tri thức dài hạn...',
  )
  const [inviteStatusMessage, setInviteStatusMessage] = useState(
    'Đang tải invite...',
  )
  const [managedUserStatusMessage, setManagedUserStatusMessage] = useState(
    'Đang tải Teacher và Student...',
  )
  const [busyLessonId, setBusyLessonId] = useState<string | null>(null)
  const [archivingDocumentId, setArchivingDocumentId] = useState<string | null>(null)
  const [savingDocumentTitleId, setSavingDocumentTitleId] = useState<string | null>(
    null,
  )
  const [reindexingDocumentId, setReindexingDocumentId] = useState<string | null>(null)
  const [isInviteBusy, setIsInviteBusy] = useState(false)
  const [busyManagedUserId, setBusyManagedUserId] = useState<string | null>(null)
  const adminSummary = useMemo(
    () => buildAdminReviewSummary(reviewLessons, selectedReviewLessonId),
    [reviewLessons, selectedReviewLessonId],
  )
  const selectedReviewLesson = adminSummary.selectedLesson
  const selectedReviewMetrics = adminSummary.selectedMetrics
  const selectedAdminBlock =
    selectedReviewLesson?.blocks.find((block) => block.id === selectedAdminBlockId) ??
    selectedReviewLesson?.blocks[0] ??
    null
  const paginatedDocuments = useMemo(
    () =>
      buildPaginationState(documents, {
        page: documentPage,
        pageSize: 8,
      }),
    [documentPage, documents],
  )
  const paginatedInvites = useMemo(
    () =>
      buildPaginationState(invites, {
        page: invitePage,
        pageSize: 6,
      }),
    [invitePage, invites],
  )
  const managedUserSummary = useMemo(
    () => buildManagedUserSummary(managedUsers),
    [managedUsers],
  )
  const filteredManagedUsers = useMemo(
    () => filterManagedUsers(managedUsers, managedUserFilters),
    [managedUserFilters, managedUsers],
  )
  const paginatedManagedUsers = useMemo(
    () =>
      buildPaginationState(filteredManagedUsers, {
        page: managedUserPage,
        pageSize: 8,
      }),
    [filteredManagedUsers, managedUserPage],
  )

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

  const loadKnowledgeDocuments = useCallback(async () => {
    setKnowledgeStatusMessage('Đang tải kho tri thức dài hạn...')
    try {
      const documentData = await fetchDocuments(token)
      setDocuments(documentData)
      setKnowledgeStatusMessage(
        documentData.length
          ? `Đã tải ${documentData.length} tài liệu dài hạn.`
          : 'Kho tri thức dài hạn chưa có tài liệu.',
      )
    } catch (error: unknown) {
      setKnowledgeStatusMessage(
        getErrorMessage(error, 'Không tải được kho tri thức dài hạn'),
      )
    }
  }, [token])

  const loadInvites = useCallback(async () => {
    setInviteStatusMessage('Đang tải invite...')
    try {
      const inviteData = await fetchInvites(token)
      setInvites(inviteData)
      setInviteStatusMessage(
        inviteData.length
          ? `Đã tải ${inviteData.length} invite.`
          : 'Chưa có invite nào.',
      )
    } catch (error: unknown) {
      setInviteStatusMessage(getErrorMessage(error, 'Không tải được invite'))
    }
  }, [token])

  const loadManagedUsers = useCallback(async () => {
    setManagedUserStatusMessage('Đang tải Teacher và Student...')
    try {
      const users = await fetchManagedUsers(token)
      setManagedUsers(users)
      setManagedUserStatusMessage(
        users.length
          ? `Đã tải ${users.length} Teacher/Student trong organization.`
          : 'Organization chưa có Teacher hoặc Student active/disabled.',
      )
    } catch (error: unknown) {
      setManagedUserStatusMessage(
        getErrorMessage(error, 'Không tải được Teacher/Student'),
      )
    }
  }, [token])

  useEffect(() => {
    void loadReviewQueue()
    void loadKnowledgeDocuments()
    void loadInvites()
    void loadManagedUsers()
  }, [loadInvites, loadKnowledgeDocuments, loadManagedUsers, loadReviewQueue])

  useEffect(() => {
    setManagedUserPage(1)
  }, [managedUserFilters])

  useEffect(() => {
    setDocumentPage(1)
  }, [documents.length])

  useEffect(() => {
    if (!reviewLessons.length) {
      setSelectedReviewLessonId(null)
      return
    }
    if (!reviewLessons.some((lesson) => lesson.id === selectedReviewLessonId)) {
      setSelectedReviewLessonId(reviewLessons[0].id)
    }
  }, [reviewLessons, selectedReviewLessonId])

  useEffect(() => {
    setSelectedAdminBlockId(selectedReviewLesson?.blocks[0]?.id ?? null)
  }, [selectedReviewLesson?.id, selectedReviewLesson?.blocks])

  function replaceLesson(updatedLesson: LessonSession) {
    setReviewLessons((current) =>
      current.map((lesson) =>
        lesson.id === updatedLesson.id ? updatedLesson : lesson,
      ),
    )
  }

  function focusKnowledgeUpload(mode: 'pdf' | 'url') {
    setKnowledgeStatusMessage(
      mode === 'pdf'
        ? 'Chọn file PDF trong khung thêm tài liệu bên dưới.'
        : 'Nhập URL trong khung thêm tài liệu bên dưới.',
    )
    window.requestAnimationFrame(() => {
      document.getElementById('admin-knowledge-add')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  function startInvite(role: OrganizationInviteRole) {
    setInviteRole(role)
    setInviteStatusMessage(
      role === 'teacher'
        ? 'Nhập email để thêm Teacher bằng mã mời.'
        : 'Nhập email để thêm Student bằng mã mời.',
    )
    window.requestAnimationFrame(() => {
      document.getElementById('admin-invite-panel')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
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

  async function handleRejectLesson(lesson: LessonSession) {
    const feedback = feedbackDrafts[lesson.id]?.trim()
    if (!feedback) {
      setStatusMessage('Nhập lý do trước khi từ chối lesson.')
      return
    }

    setBusyLessonId(lesson.id)
    setStatusMessage('Đang từ chối lesson...')
    try {
      const updatedLesson = await rejectLesson(lesson.id, { feedback }, token)
      replaceLesson(updatedLesson)
      setStatusMessage(`Đã từ chối ${updatedLesson.title}.`)
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error, 'Không từ chối được lesson'))
    } finally {
      setBusyLessonId(null)
    }
  }

  async function handleAdminDocumentUploaded(response: DocumentUploadResponse) {
    try {
      const documentData = await fetchDocuments(token)
      setDocuments(documentData)
    } catch (error: unknown) {
      setDocuments((current) => [
        response.document,
        ...current.filter((document) => document.id !== response.document.id),
      ])
      setKnowledgeStatusMessage(
        getErrorMessage(error, 'Upload xong nhưng không tải lại được kho tri thức'),
      )
    }

    setKnowledgeStatusMessage(documentUploadStatusMessage(response))
  }

  async function handleAdminArchiveDocument(document: SourceDocument) {
    setArchivingDocumentId(document.id)
    setKnowledgeStatusMessage(`Đang archive ${document.title}...`)

    try {
      const archivedDocument = await archiveDocument(document.id, token)
      await loadKnowledgeDocuments()
      setKnowledgeStatusMessage(
        `Đã archive ${archivedDocument.title}; tài liệu không còn dùng cho generation mới.`,
      )
    } catch (error: unknown) {
      setKnowledgeStatusMessage(getErrorMessage(error, 'Không archive được tài liệu'))
    } finally {
      setArchivingDocumentId(null)
    }
  }

  function handleAdminDocumentTitleChange(
    document: SourceDocument,
    title: string,
  ) {
    setDocumentTitleDrafts((current) => ({
      ...current,
      [document.id]: title,
    }))
  }

  function startDocumentEdit(document: SourceDocument) {
    setEditingDocumentId(document.id)
    setDocumentTitleDrafts((current) => ({
      ...current,
      [document.id]: current[document.id] ?? document.title,
    }))
  }

  function cancelDocumentEdit(document: SourceDocument) {
    setEditingDocumentId((current) => (current === document.id ? null : current))
    setDocumentTitleDrafts((current) => {
      const next = { ...current }
      delete next[document.id]
      return next
    })
  }

  async function handleAdminSaveDocumentTitle(document: SourceDocument) {
    const title = (documentTitleDrafts[document.id] ?? document.title).trim()
    if (!title) {
      setKnowledgeStatusMessage('Tên tài liệu không được để trống.')
      return
    }

    setSavingDocumentTitleId(document.id)
    setKnowledgeStatusMessage(`Đang lưu tên ${document.title}...`)
    try {
      const updatedDocument = await updateDocumentMetadata(
        document.id,
        { title },
        token,
      )
      setDocuments((current) =>
        current.map((candidate) =>
          candidate.id === updatedDocument.id ? updatedDocument : candidate,
        ),
      )
      setDocumentTitleDrafts((current) => {
        const next = { ...current }
        delete next[updatedDocument.id]
        return next
      })
      setEditingDocumentId(null)
      setKnowledgeStatusMessage(`Đã lưu tên tài liệu: ${updatedDocument.title}.`)
    } catch (error: unknown) {
      setKnowledgeStatusMessage(getErrorMessage(error, 'Không lưu được tên tài liệu'))
    } finally {
      setSavingDocumentTitleId(null)
    }
  }

  async function handleAdminReindexDocument(document: SourceDocument) {
    setReindexingDocumentId(document.id)
    setKnowledgeStatusMessage(`Đang re-index ${document.title}...`)

    try {
      const response = await reindexDocument(document.id, token)
      await loadKnowledgeDocuments()
      setKnowledgeStatusMessage(
        `Đã re-index ${response.chunk_count} chunk bằng ${response.embedding.model}.`,
      )
    } catch (error: unknown) {
      setKnowledgeStatusMessage(getErrorMessage(error, 'Không re-index được tài liệu'))
    } finally {
      setReindexingDocumentId(null)
    }
  }

  function handleManagedUserDraftChange(
    user: ManagedUser,
    field: 'name' | 'email',
    value: string,
  ) {
    setManagedUserDrafts((current) => ({
      ...current,
      [user.id]: {
        name: current[user.id]?.name ?? user.name,
        email: current[user.id]?.email ?? user.email,
        [field]: value,
      },
    }))
  }

  function startManagedUserEdit(user: ManagedUser) {
    setEditingManagedUserId(user.id)
    setManagedUserDrafts((current) => ({
      ...current,
      [user.id]: current[user.id] ?? {
        name: user.name,
        email: user.email,
      },
    }))
  }

  function cancelManagedUserEdit(user: ManagedUser) {
    setEditingManagedUserId((current) => (current === user.id ? null : current))
    setManagedUserDrafts((current) => {
      const next = { ...current }
      delete next[user.id]
      return next
    })
  }

  async function handleManagedUserSave(user: ManagedUser) {
    const draft = managedUserDrafts[user.id] ?? {
      name: user.name,
      email: user.email,
    }
    const payload: ManagedUserUpdatePayload = {
      name: draft.name.trim(),
      email: draft.email.trim().toLowerCase(),
    }
    if (!payload.name || !payload.email) {
      setManagedUserStatusMessage('Tên và email không được để trống.')
      return
    }

    setBusyManagedUserId(user.id)
    setManagedUserStatusMessage(`Đang lưu ${user.name}...`)
    try {
      const updatedUser = await updateManagedUser(user.id, payload, token)
      setManagedUsers((current) =>
        current.map((candidate) =>
          candidate.id === updatedUser.id ? updatedUser : candidate,
        ),
      )
      setManagedUserDrafts((current) => {
        const next = { ...current }
        delete next[updatedUser.id]
        return next
      })
      setEditingManagedUserId(null)
      setManagedUserStatusMessage(`Đã lưu thông tin ${updatedUser.name}.`)
    } catch (error: unknown) {
      setManagedUserStatusMessage(
        getErrorMessage(error, 'Không lưu được thông tin user'),
      )
    } finally {
      setBusyManagedUserId(null)
    }
  }

  async function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = inviteEmail.trim().toLowerCase()
    if (!email) {
      setInviteStatusMessage('Nhập email trước khi tạo invite.')
      return
    }

    setIsInviteBusy(true)
    setInviteStatusMessage('Đang tạo invite...')
    try {
      const invite = await createInvite({ email, role: inviteRole }, token)
      setInvites((current) => [
        invite,
        ...current.filter((candidate) => candidate.id !== invite.id),
      ])
      setInviteEmail('')
      setInviteStatusMessage(
        `Đã lưu invite cho ${invite.email}. Gửi mã ${invite.invite_code} để người dùng kích hoạt tài khoản.`,
      )
    } catch (error: unknown) {
      setInviteStatusMessage(getErrorMessage(error, 'Không tạo được invite'))
    } finally {
      setIsInviteBusy(false)
    }
  }

  async function handleManagedUserStatusChange(
    user: ManagedUser,
    nextStatus: ManagedUserStatus,
  ) {
    setBusyManagedUserId(user.id)
    setManagedUserStatusMessage(
      nextStatus === 'disabled'
        ? `Đang tạm khóa ${user.name}...`
        : `Đang mở lại ${user.name}...`,
    )
    try {
      const updatedUser = await updateManagedUserStatus(
        user.id,
        nextStatus,
        token,
      )
      setManagedUsers((current) =>
        current.map((candidate) =>
          candidate.id === updatedUser.id ? updatedUser : candidate,
        ),
      )
      setManagedUserStatusMessage(
        `${updatedUser.name}: ${managedUserStatusLabel(updatedUser.status)}.`,
      )
    } catch (error: unknown) {
      setManagedUserStatusMessage(
        getErrorMessage(error, 'Không cập nhật được trạng thái user'),
      )
    } finally {
      setBusyManagedUserId(null)
    }
  }

  const isSelectedReviewBusy = selectedReviewLesson
    ? busyLessonId === selectedReviewLesson.id
    : false
  const canModerateSelected =
    Boolean(selectedReviewMetrics?.canModerate) && !isSelectedReviewBusy

  return (
    <section
      className="panel learning-panel admin-review-panel v4-admin-workspace"
      id={WORKSPACE_SECTION_IDS.adminReview}
      tabIndex={-1}
    >
      {activePage === 'admin-review' && (
        <>
          <div className="v4-admin-hero">
            <div>
              <p className="section-label">Không gian duyệt bài học</p>
              <h2>Kiểm duyệt bằng trạng thái, cảnh báo và citation trước khi publish</h2>
              <p className="muted">
                Admin không sửa trực tiếp nội dung; quyết định dựa trên evidence và
                feedback rõ cho giảng viên.
              </p>
            </div>
            <button
              className="primary-button"
              disabled={busyLessonId !== null}
              type="button"
              onClick={() => void loadReviewQueue()}
            >
              <RefreshCcw aria-hidden="true" size={17} />
              {busyLessonId !== null ? <Spinner label="Đang xử lý" /> : 'Tải lại hàng đợi'}
            </button>
          </div>

          <div className="v4-metric-grid v4-admin-metrics">
            <MetricCard
              detail={statusMessage}
              label="Tổng trong queue"
              value={String(adminSummary.totalLessons)}
            />
            <MetricCard
              detail="Chờ quyết định Admin"
              label="Chờ duyệt"
              tone="info"
              value={String(adminSummary.pendingLessons)}
            />
            <MetricCard
              detail="Lesson có cảnh báo block"
              label="Cảnh báo"
              tone="warning"
              value={String(adminSummary.lessonsWithWarnings)}
            />
            <MetricCard
              detail="Trung bình theo block có citation"
              label="Độ phủ citation"
              tone="success"
              value={`${adminSummary.averageCitationCoveragePercent}%`}
            />
          </div>

          <p className="state-panel compact-state">{statusMessage}</p>

          {reviewLessons.length > 0 ? (
            <div className="v4-admin-review-grid">
          <aside className="v4-admin-queue" aria-label="Hàng đợi review">
            <div className="v4-panel-title">
              <span>Hàng đợi duyệt</span>
              <strong>{adminSummary.totalLessons}</strong>
            </div>
            {adminSummary.queue.map((item) => (
              <button
                className={`v4-admin-queue-item ${
                  selectedReviewLesson?.id === item.lesson.id ? 'selected' : ''
                }`}
                key={item.lesson.id}
                type="button"
                onClick={() => {
                  setSelectedReviewLessonId(item.lesson.id)
                  setSelectedAdminBlockId(item.lesson.blocks[0]?.id ?? null)
                }}
              >
                <ClipboardCheck aria-hidden="true" size={18} />
                <span>
                  <strong>{item.lesson.title}</strong>
                  <small>{lessonStatusLabel(item.lesson.status)}</small>
                </span>
                <em>{item.metrics.citationCoveragePercent}% citation</em>
                <small>
                  {item.metrics.warningCount} cảnh báo - {item.metrics.blockCount}{' '}
                  block
                </small>
              </button>
            ))}
          </aside>

          <section className="v4-admin-review-detail" aria-label="Review detail">
            {selectedReviewLesson && selectedReviewMetrics ? (
              <>
                <div className="v4-admin-detail-header">
                  <div>
                    <p className="section-label">Lesson đang duyệt</p>
                    <h2>{selectedReviewLesson.title}</h2>
                    <span>{lessonStatusLabel(selectedReviewLesson.status)}</span>
                  </div>
                  <div className="review-stats">
                    <span>{selectedReviewMetrics.blockCount} block</span>
                    <span>{selectedReviewMetrics.citationCount} citation</span>
                    <span>{selectedReviewMetrics.warningCount} cảnh báo</span>
                    <span>
                      {selectedReviewMetrics.reviewedBlockCount}/
                      {selectedReviewMetrics.blockCount} reviewed
                    </span>
                  </div>
                </div>

                {selectedReviewLesson.admin_feedback && (
                  <div className="v4-warning-box">
                    <AlertTriangle aria-hidden="true" size={17} />
                    <span>{selectedReviewLesson.admin_feedback}</span>
                  </div>
                )}

                {selectedReviewMetrics.warningCount > 0 && (
                  <div className="v4-warning-box">
                    <AlertTriangle aria-hidden="true" size={17} />
                    <span>
                      {selectedReviewMetrics.warningCount} block cần kiểm tra
                      grounding/citation trước khi publish.
                    </span>
                  </div>
                )}

                <div className="v4-admin-block-review">
                  <nav className="v4-admin-block-rail" aria-label="Admin block rail">
                    {selectedReviewLesson.blocks.map((block, index) => (
                      <button
                        className={selectedAdminBlock?.id === block.id ? 'selected' : ''}
                        key={block.id}
                        type="button"
                        onClick={() => setSelectedAdminBlockId(block.id)}
                      >
                        <span>{index + 1}</span>
                        <strong>{block.title}</strong>
                        <small>{blockStatusLabel(block.status)}</small>
                        {block.warning && <em>Có cảnh báo</em>}
                      </button>
                    ))}
                  </nav>

                  {selectedAdminBlock && (
                    <article className="v4-admin-block-card">
                      <div className="lesson-block-header">
                        <span>{blockTypeLabel(selectedAdminBlock.type)}</span>
                        <strong>{blockStatusLabel(selectedAdminBlock.status)}</strong>
                      </div>
                      <h3>{selectedAdminBlock.title}</h3>
                      <p>{selectedAdminBlock.content}</p>
                      {selectedAdminBlock.warning && (
                        <div className="v4-warning-box">
                          <AlertTriangle aria-hidden="true" size={17} />
                          <span>{selectedAdminBlock.warning}</span>
                        </div>
                      )}
                    </article>
                  )}

                  <aside className="v4-citation-panel v4-admin-citation-panel">
                    <div className="v4-panel-title">
                      <span>Bằng chứng</span>
                      <strong>{selectedAdminBlock?.citations.length ?? 0}</strong>
                    </div>
                    {selectedAdminBlock?.citations.length ? (
                      <div className="v4-citation-list">
                        {selectedAdminBlock.citations.map((citation) => (
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

                <div className="v4-admin-action-panel">
                  <label className="field">
                    <span>Phản hồi cho giảng viên</span>
                    <textarea
                      disabled={!selectedReviewMetrics.canModerate || isSelectedReviewBusy}
                      value={feedbackDrafts[selectedReviewLesson.id] ?? ''}
                      onChange={(event) =>
                        setFeedbackDrafts((current) => ({
                          ...current,
                          [selectedReviewLesson.id]: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <div className="block-actions">
                    <button
                      className="primary-button"
                      disabled={!canModerateSelected}
                      type="button"
                      onClick={() => void handlePublish(selectedReviewLesson)}
                    >
                      <CheckCircle2 aria-hidden="true" size={17} />
                      Duyệt và xuất bản
                    </button>
                    <button
                      className="ghost-button"
                      disabled={!canModerateSelected}
                      type="button"
                      onClick={() => void handleRequestChanges(selectedReviewLesson)}
                    >
                      <Send aria-hidden="true" size={17} />
                      Yêu cầu chỉnh sửa
                    </button>
                    <button
                      className="ghost-button"
                      disabled={!canModerateSelected}
                      type="button"
                      onClick={() => void handleRejectLesson(selectedReviewLesson)}
                    >
                      <XCircle aria-hidden="true" size={17} />
                      Từ chối lesson
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="v4-empty-inline">Chọn lesson để duyệt.</div>
            )}
          </section>
            </div>
          ) : (
            <div className="v4-empty-inline">{statusMessage}</div>
          )}
        </>
      )}

      {activePage === 'admin-knowledge' && (
        <section
          className="knowledge-panel admin-knowledge-panel admin-management-surface"
          id={WORKSPACE_SECTION_IDS.adminKnowledge}
          tabIndex={-1}
        >
          <div className="management-header">
            <div>
              <p className="section-label">Admin library</p>
              <h3>Quản lý tài liệu AI</h3>
              <p className="muted">
                Kho tri thức dài hạn được AI dùng làm nguồn tham khảo cho tổ chức.
              </p>
            </div>
            <div className="management-actions">
              <button
                aria-label="Thêm PDF"
                className="ghost-button icon-button management-icon-button"
                title="Thêm PDF"
                type="button"
                onClick={() => focusKnowledgeUpload('pdf')}
              >
                <UploadCloud aria-hidden="true" size={16} />
              </button>
              <button
                aria-label="Thêm URL"
                className="primary-button icon-button management-icon-button"
                title="Thêm URL"
                type="button"
                onClick={() => focusKnowledgeUpload('url')}
              >
                <Link2 aria-hidden="true" size={16} />
              </button>
            </div>
          </div>

          <p className="state-panel compact-state">{knowledgeStatusMessage}</p>

          <DataTable
            columns={[
              {
                header: 'Tên tài liệu',
                key: 'title',
                render: (document) => {
                  const isEditing = editingDocumentId === document.id
                  return (
                    <span className="admin-document-title-cell">
                      {isEditing ? (
                        <input
                          aria-label={`Tên tài liệu ${document.title}`}
                          className="table-inline-input"
                          disabled={savingDocumentTitleId === document.id}
                          value={documentTitleDrafts[document.id] ?? document.title}
                          onChange={(event) =>
                            handleAdminDocumentTitleChange(
                              document,
                              event.target.value,
                            )
                          }
                        />
                      ) : (
                        <strong>{document.title}</strong>
                      )}
                      <small>{document.file_name}</small>
                    </span>
                  )
                },
              },
              {
                header: 'Loại',
                key: 'type',
                render: (document) => sourceTypeLabel(document),
              },
              {
                header: 'Nguồn',
                key: 'source',
                render: (document) =>
                  documentGovernanceLabels(document).join(' · ') || 'Library',
              },
              {
                header: 'Trạng thái',
                key: 'status',
                render: (document) => (
                  <span
                    className={`status-pill ${
                      document.is_active ? '' : 'neutral-pill'
                    }`}
                  >
                    {document.is_active ? documentStatusLabel(document) : 'Inactive'}
                  </span>
                ),
              },
              {
                header: 'Cập nhật',
                key: 'updated',
                render: (document) => formatDateTime(document.updated_at),
              },
              {
                header: 'Hành động',
                key: 'actions',
                render: (document) => {
                  const isEditing = editingDocumentId === document.id
                  const isSaving = savingDocumentTitleId === document.id
                  const isArchiving = archivingDocumentId === document.id
                  const isReindexing = reindexingDocumentId === document.id
                  return (
                    <span className="table-action-group">
                      {isEditing ? (
                        <>
                          <button
                            className="ghost-button table-action-button"
                            disabled={isSaving || archivingDocumentId !== null}
                            type="button"
                            onClick={() => void handleAdminSaveDocumentTitle(document)}
                          >
                            {isSaving ? (
                              <Spinner label="Đang lưu" />
                            ) : (
                              <>
                                <Save aria-hidden="true" size={16} />
                                Lưu
                              </>
                            )}
                          </button>
                          <button
                            className="ghost-button table-action-button"
                            disabled={isSaving}
                            type="button"
                            onClick={() => cancelDocumentEdit(document)}
                          >
                            <X aria-hidden="true" size={16} />
                            Hủy
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            aria-label={`Sửa ${document.title}`}
                            className="ghost-button table-action-button icon-table-action"
                            disabled={!document.is_active || savingDocumentTitleId !== null}
                            title="Sửa"
                            type="button"
                            onClick={() => startDocumentEdit(document)}
                          >
                            <Edit3 aria-hidden="true" size={16} />
                          </button>
                          <button
                            className="ghost-button table-action-button"
                            disabled={!isSourceDocumentUsable(document) || isReindexing}
                            type="button"
                            onClick={() => void handleAdminReindexDocument(document)}
                          >
                            {isReindexing ? (
                              <Spinner label="Đang chạy" />
                            ) : (
                              <>
                                <RefreshCcw aria-hidden="true" size={16} />
                                Re-index
                              </>
                            )}
                          </button>
                          <button
                            aria-label={`Xóa khỏi active ${document.title}`}
                            className="ghost-button table-action-button icon-table-action danger-action"
                            disabled={!document.is_active || isArchiving}
                            title="Xóa khỏi active"
                            type="button"
                            onClick={() => void handleAdminArchiveDocument(document)}
                          >
                            {isArchiving ? (
                              <Spinner label="Đang xóa" />
                            ) : (
                              <Trash2 aria-hidden="true" size={16} />
                            )}
                          </button>
                        </>
                      )}
                    </span>
                  )
                },
              },
            ]}
            emptyState={<p className="muted">Chưa có tài liệu AI nào.</p>}
            getRowKey={(document) => document.id}
            rows={paginatedDocuments.items}
          />
          <PaginationControls
            state={paginatedDocuments}
            onPageChange={setDocumentPage}
          />

          <section className="admin-add-panel" id="admin-knowledge-add">
            <div className="panel-heading">
              <div>
                <p className="section-label">Thêm tài liệu</p>
                <h3>Thêm PDF hoặc URL vào kho tri thức</h3>
              </div>
              <span className="status-pill neutral-pill">Soft governance</span>
            </div>
            <KnowledgeUploadPanel
              idleMessage="Chưa chọn PDF cho library dài hạn."
              pdfLabel="PDF library"
              submitLabel="Upload vào library"
              token={token}
              urlLabel="URL library"
              urlSubmitLabel="Ingest vào library"
              onUploaded={handleAdminDocumentUploaded}
            />
          </section>
        </section>
      )}

      {activePage === 'admin-users' && (
        <>
          <section className="knowledge-panel admin-user-management-panel">
            <div className="management-header">
              <div>
                <p className="section-label">Teacher & Student</p>
                <h3>Quản lý người dùng trong organization</h3>
                <p className="muted">
                  Thêm, sửa hoặc xóa khỏi active mà không mất lịch sử học tập.
                </p>
              </div>
              <div className="management-actions">
                <button
                  aria-label="Thêm Teacher"
                  className="ghost-button icon-button management-icon-button"
                  title="Thêm Teacher"
                  type="button"
                  onClick={() => startInvite('teacher')}
                >
                  <UsersRound aria-hidden="true" size={16} />
                </button>
                <button
                  aria-label="Thêm Student"
                  className="primary-button icon-button management-icon-button"
                  title="Thêm Student"
                  type="button"
                  onClick={() => startInvite('student')}
                >
                  <UserCheck aria-hidden="true" size={16} />
                </button>
                <button
                  className="ghost-button"
                  disabled={busyManagedUserId !== null}
                  type="button"
                  onClick={() => void loadManagedUsers()}
                >
                  <RefreshCcw aria-hidden="true" size={16} />
                  Tải lại
                </button>
              </div>
            </div>

            <div className="v4-metric-grid admin-user-summary-grid">
              <MetricCard
                detail="Teacher và Student"
                label="Tổng user"
                value={String(managedUserSummary.total)}
              />
              <MetricCard
                detail="Có thể đăng nhập và dùng app"
                label="Đang hoạt động"
                tone="success"
                value={String(managedUserSummary.active)}
              />
              <MetricCard
                detail="Bị chặn ở request tiếp theo"
                label="Đã tạm khóa"
                tone={managedUserSummary.disabled ? 'warning' : 'default'}
                value={String(managedUserSummary.disabled)}
              />
              <MetricCard
                detail={`${managedUserSummary.teachers} Teacher / ${managedUserSummary.students} Student`}
                label="Phân bổ role"
                tone="info"
                value={`${managedUserSummary.teachers}/${managedUserSummary.students}`}
              />
            </div>

            <div className="admin-user-toolbar">
              <label className="field">
                <span>Tìm kiếm</span>
                <span className="input-with-icon">
                  <Search aria-hidden="true" size={16} />
                  <input
                    placeholder="Tên hoặc email"
                    value={managedUserFilters.query}
                    onChange={(event) =>
                      setManagedUserFilters((current) => ({
                        ...current,
                        query: event.target.value,
                      }))
                    }
                  />
                </span>
              </label>
              <label className="field">
                <span>Vai trò</span>
                <select
                  value={managedUserFilters.role}
                  onChange={(event) =>
                    setManagedUserFilters((current) => ({
                      ...current,
                      role: event.target.value as ManagedUserRole | 'all',
                    }))
                  }
                >
                  <option value="all">Tất cả</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </label>
              <label className="field">
                <span>Trạng thái</span>
                <select
                  value={managedUserFilters.status}
                  onChange={(event) =>
                    setManagedUserFilters((current) => ({
                      ...current,
                      status: event.target.value as ManagedUserStatus | 'all',
                    }))
                  }
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="disabled">Đã tạm khóa</option>
                </select>
              </label>
            </div>

            <p className="state-panel compact-state">{managedUserStatusMessage}</p>

            <DataTable
              columns={[
                {
                  header: 'Người dùng',
                  key: 'user',
                  render: (user) => {
                    const isEditing = editingManagedUserId === user.id
                    return (
                      <span className="admin-user-cell editable-user-cell">
                        {isEditing ? (
                          <>
                            <input
                              aria-label={`Tên ${user.name}`}
                              className="table-inline-input"
                              disabled={busyManagedUserId === user.id}
                              value={managedUserDrafts[user.id]?.name ?? user.name}
                              onChange={(event) =>
                                handleManagedUserDraftChange(
                                  user,
                                  'name',
                                  event.target.value,
                                )
                              }
                            />
                            <input
                              aria-label={`Email ${user.email}`}
                              className="table-inline-input"
                              disabled={busyManagedUserId === user.id}
                              type="email"
                              value={managedUserDrafts[user.id]?.email ?? user.email}
                              onChange={(event) =>
                                handleManagedUserDraftChange(
                                  user,
                                  'email',
                                  event.target.value,
                                )
                              }
                            />
                          </>
                        ) : (
                          <>
                            <strong>{user.name}</strong>
                            <small>{user.email}</small>
                          </>
                        )}
                      </span>
                    )
                  },
                },
                {
                  header: 'Vai trò',
                  key: 'role',
                  render: (user) => roleLabel(user.role),
                },
                {
                  header: 'Trạng thái',
                  key: 'status',
                  render: (user) => (
                    <span
                      className={`status-pill ${
                        user.status === 'active' ? '' : 'neutral-pill'
                      }`}
                    >
                      {managedUserStatusLabel(user.status)}
                    </span>
                  ),
                },
                {
                  header: 'Cập nhật',
                  key: 'updated',
                  render: (user) => formatDateTime(user.updated_at),
                },
                {
                  header: 'Hành động',
                  key: 'action',
                  render: (user) => {
                    const nextStatus =
                      user.status === 'active' ? 'disabled' : 'active'
                    const isBusy = busyManagedUserId === user.id
                    const isEditing = editingManagedUserId === user.id
                    return (
                      <span className="table-action-group">
                        {isEditing ? (
                          <>
                            <button
                              className="ghost-button table-action-button"
                              disabled={busyManagedUserId !== null}
                              type="button"
                              onClick={() => void handleManagedUserSave(user)}
                            >
                              {isBusy ? (
                                <Spinner label="Đang lưu" />
                              ) : (
                                <>
                                  <Save aria-hidden="true" size={16} />
                                  Lưu
                                </>
                              )}
                            </button>
                            <button
                              className="ghost-button table-action-button"
                              disabled={isBusy}
                              type="button"
                              onClick={() => cancelManagedUserEdit(user)}
                            >
                              <X aria-hidden="true" size={16} />
                              Hủy
                            </button>
                          </>
                        ) : (
                          <button
                            aria-label={`Sửa ${user.name}`}
                            className="ghost-button table-action-button icon-table-action"
                            disabled={busyManagedUserId !== null}
                            title="Sửa"
                            type="button"
                            onClick={() => startManagedUserEdit(user)}
                          >
                            <Edit3 aria-hidden="true" size={16} />
                          </button>
                        )}
                        <button
                          aria-label={
                            nextStatus === 'disabled'
                              ? `Xóa khỏi active ${user.name}`
                              : `Mở lại ${user.name}`
                          }
                          className={`ghost-button table-action-button${
                            nextStatus === 'disabled'
                              ? ' icon-table-action danger-action'
                              : ''
                          }`}
                          disabled={busyManagedUserId !== null}
                          title={
                            nextStatus === 'disabled' ? 'Xóa khỏi active' : 'Mở lại'
                          }
                          type="button"
                          onClick={() =>
                            void handleManagedUserStatusChange(user, nextStatus)
                          }
                        >
                          {isBusy ? (
                            <Spinner label="Đang lưu" />
                          ) : nextStatus === 'disabled' ? (
                            <UserX aria-hidden="true" size={16} />
                          ) : (
                            <>
                              <UserCheck aria-hidden="true" size={16} />
                              Mở lại
                            </>
                          )}
                        </button>
                      </span>
                    )
                  },
                },
              ]}
              emptyState={
                <p className="muted">
                  Không có Teacher/Student khớp bộ lọc hiện tại.
                </p>
              }
              getRowKey={(user) => user.id}
              rows={paginatedManagedUsers.items}
            />
            <PaginationControls
              state={paginatedManagedUsers}
              onPageChange={setManagedUserPage}
            />
          </section>

          <section
            className="knowledge-panel admin-invite-panel admin-add-panel"
            id="admin-invite-panel"
          >
        <div className="panel-heading">
          <div>
            <p className="section-label">Thêm người dùng</p>
            <h3>Tạo invite cho Teacher hoặc Student</h3>
          </div>
          <span className="status-pill neutral-pill">Tạo tài khoản</span>
        </div>
        <form className="upload-panel invite-form" onSubmit={handleInviteSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              disabled={isInviteBusy}
              placeholder="teacher@example.edu"
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Vai trò</span>
            <select
              disabled={isInviteBusy}
              value={inviteRole}
              onChange={(event) =>
                setInviteRole(event.target.value as OrganizationInviteRole)
              }
            >
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </label>
          <button className="primary-button" disabled={isInviteBusy} type="submit">
            <UsersRound aria-hidden="true" size={17} />
            {isInviteBusy ? <Spinner label="Đang tạo invite" /> : 'Tạo invite'}
          </button>
          <p className="state-panel compact-state">{inviteStatusMessage}</p>
        </form>
        {invites.length > 0 ? (
          <>
            <DataTable
              columns={[
                {
                  header: 'Email',
                  key: 'email',
                  render: (invite) => <strong>{invite.email}</strong>,
                },
                {
                  header: 'Vai trò',
                  key: 'role',
                  render: (invite) => roleLabel(invite.role),
                },
                {
                  header: 'Mã mời',
                  key: 'code',
                  render: (invite) => <code className="invite-code">{invite.invite_code}</code>,
                },
                {
                  header: 'Trạng thái',
                  key: 'status',
                  render: (invite) => (
                    <span className="status-pill neutral-pill">{invite.status}</span>
                  ),
                },
                {
                  header: 'Ngày tạo',
                  key: 'created',
                  render: (invite) =>
                    new Date(invite.created_at).toLocaleString('vi-VN'),
                },
              ]}
              emptyState={<p className="muted">{inviteStatusMessage}</p>}
              getRowKey={(invite) => invite.id}
              rows={paginatedInvites.items}
            />
            <PaginationControls
              state={paginatedInvites}
              onPageChange={setInvitePage}
            />
          </>
        ) : (
          <p className="muted">{inviteStatusMessage}</p>
        )}
          </section>
        </>
      )}
    </section>
  )
}
