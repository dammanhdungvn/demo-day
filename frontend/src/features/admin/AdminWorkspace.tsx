import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Edit3,
  FileText,
  KeyRound,
  Link2,
  RefreshCcw,
  Save,
  Send,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UploadCloud,
  UserCheck,
  UserX,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react'
import {
  bulkResetManagedUserPasswords,
  bulkUpdateManagedUserStatus,
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
  fetchAdminActivity,
  fetchAdminLessonLibrary,
  fetchAdminReports,
  fetchAdminReviewQueue,
  fetchAdminSettings,
  fetchDocuments,
  publishLesson,
  reindexDocument,
  rejectLesson,
  requestLessonChanges,
  updateAdminSettings,
  updateDocumentMetadata,
  type AdminActivityFeed,
  type AdminLessonLibrary,
  type AdminReports,
  type AdminSettings,
  type AdminSettingsUpdatePayload,
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
import { JobCenter } from '../jobs/JobCenter'

type AdminDesignStat = {
  detail: string
  label: string
  tone?: 'default' | 'success' | 'warning' | 'info'
  value: string
}

type AdminActivityItem = {
  createdAt: string | null
  detail: string
  id: string
  title: string
  type: string
}

function managedUserStatusLabel(status: ManagedUserStatus): string {
  return status === 'active' ? 'Đang hoạt động' : 'Đã tạm khóa'
}

function formatDateTime(value?: string | null): string {
  return value ? new Date(value).toLocaleString('vi-VN') : 'Chưa có'
}

function formatStatusCountLabel(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function parseNonNegativeNumber(value: string, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function sourceTypeLabel(document: SourceDocument): string {
  if (document.source_type === 'url' || document.source_type === 'web_url') {
    return 'URL'
  }

  return 'PDF'
}

function adminDesignStats({
  adminSummary,
  documents,
  invites,
  managedUserSummary,
}: {
  adminSummary: ReturnType<typeof buildAdminReviewSummary>
  documents: SourceDocument[]
  invites: OrganizationInvite[]
  managedUserSummary: ReturnType<typeof buildManagedUserSummary>
}): AdminDesignStat[] {
  const usableDocuments = documents.filter(isSourceDocumentUsable).length
  const pendingInvites = invites.filter((invite) => invite.status === 'pending').length

  return [
    {
      detail: 'Lesson cần Admin quyết định',
      label: 'Chờ duyệt',
      tone: adminSummary.pendingLessons ? 'warning' : 'success',
      value: String(adminSummary.pendingLessons),
    },
    {
      detail: `${usableDocuments}/${documents.length} tài liệu sẵn sàng cho AI`,
      label: 'Nguồn tri thức',
      tone: usableDocuments ? 'success' : 'default',
      value: String(documents.length),
    },
    {
      detail: `${managedUserSummary.teachers} Teacher / ${managedUserSummary.students} Student`,
      label: 'Người dùng',
      tone: managedUserSummary.disabled ? 'warning' : 'info',
      value: String(managedUserSummary.total),
    },
    {
      detail: 'Invite chưa được kích hoạt',
      label: 'Mã mời đang chờ',
      tone: pendingInvites ? 'warning' : 'success',
      value: String(pendingInvites),
    },
  ]
}

function buildRecentAdminActivity({
  documents,
  invites,
  managedUsers,
  reviewLessons,
}: {
  documents: SourceDocument[]
  invites: OrganizationInvite[]
  managedUsers: ManagedUser[]
  reviewLessons: LessonSession[]
}): AdminActivityItem[] {
  const documentItems: AdminActivityItem[] = documents.map((document) => ({
    createdAt: document.updated_at ?? document.created_at,
    detail: `${sourceTypeLabel(document)} - ${documentStatusLabel(document)}`,
    id: `document-${document.id}`,
    title: document.title,
    type: 'Tài liệu',
  }))
  const inviteItems: AdminActivityItem[] = invites.map((invite) => ({
    createdAt: invite.accepted_at ?? invite.created_at,
    detail: `${roleLabel(invite.role)} - ${invite.status}`,
    id: `invite-${invite.id}`,
    title: invite.email,
    type: 'Mã mời',
  }))
  const userItems: AdminActivityItem[] = managedUsers.map((user) => ({
    createdAt: user.updated_at ?? user.created_at ?? null,
    detail: `${roleLabel(user.role)} - ${managedUserStatusLabel(user.status)}`,
    id: `user-${user.id}`,
    title: user.name,
    type: 'Người dùng',
  }))
  const lessonItems: AdminActivityItem[] = reviewLessons.map((lesson) => ({
    createdAt: lesson.updated_at ?? lesson.created_at,
    detail: `${lesson.blocks.length} block - ${lessonStatusLabel(lesson.status)}`,
    id: `lesson-${lesson.id}`,
    title: lesson.title,
    type: 'Lesson',
  }))

  return [
    ...lessonItems,
    ...documentItems,
    ...userItems,
    ...inviteItems,
  ]
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })
    .slice(0, 12)
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
  const [selectedManagedUserIds, setSelectedManagedUserIds] = useState<string[]>(
    [],
  )
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
  const [isBulkManagedUserBusy, setIsBulkManagedUserBusy] = useState(false)
  const [adminLessonLibrary, setAdminLessonLibrary] =
    useState<AdminLessonLibrary | null>(null)
  const [adminReports, setAdminReports] = useState<AdminReports | null>(null)
  const [adminActivity, setAdminActivity] = useState<AdminActivityFeed | null>(null)
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null)
  const [settingsDraft, setSettingsDraft] = useState<AdminSettingsUpdatePayload>({})
  const [adminSurfaceStatusMessage, setAdminSurfaceStatusMessage] = useState(
    'Đang tải dữ liệu Admin fullstack...',
  )
  const [isSavingSettings, setIsSavingSettings] = useState(false)
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
  const selectedManagedUsers = useMemo(
    () =>
      managedUsers.filter((user) => selectedManagedUserIds.includes(user.id)),
    [managedUsers, selectedManagedUserIds],
  )
  const paginatedManagedUserIds = useMemo(
    () => paginatedManagedUsers.items.map((user) => user.id),
    [paginatedManagedUsers.items],
  )
  const areAllManagedUsersOnPageSelected =
    paginatedManagedUserIds.length > 0 &&
    paginatedManagedUserIds.every((id) => selectedManagedUserIds.includes(id))
  const isManagedUserActionBusy =
    busyManagedUserId !== null || isBulkManagedUserBusy
  const adminStats = useMemo(
    () => {
      if (adminReports?.metrics.length) {
        return adminReports.metrics.map((metric) => ({
          detail: metric.detail,
          label: metric.label,
          tone: metric.tone,
          value: String(metric.value),
        }))
      }

      return adminDesignStats({
        adminSummary,
        documents,
        invites,
        managedUserSummary,
      })
    },
    [adminReports, adminSummary, documents, invites, managedUserSummary],
  )
  const lessonLibraryItems = useMemo(
    () =>
      (adminLessonLibrary?.lessons ?? reviewLessons)
        .slice()
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        ),
    [adminLessonLibrary, reviewLessons],
  )
  const recentAdminActivity = useMemo(
    () => {
      if (adminActivity) {
        return adminActivity.items.map((item) => ({
          createdAt: item.created_at,
          detail: item.detail,
          id: item.id,
          title: item.title,
          type: item.type,
        }))
      }

      return buildRecentAdminActivity({
        documents,
        invites,
        managedUsers,
        reviewLessons,
      })
    },
    [adminActivity, documents, invites, managedUsers, reviewLessons],
  )
  const lessonLibraryTotal = adminLessonLibrary?.total ?? lessonLibraryItems.length
  const lessonLibraryPublished =
    adminLessonLibrary?.published ??
    lessonLibraryItems.filter((lesson) => lesson.status === 'published').length
  const lessonLibraryPendingReview =
    adminLessonLibrary?.pending_review ?? adminSummary.pendingLessons
  const lessonLibraryWarnings =
    adminLessonLibrary?.warnings ?? adminSummary.lessonsWithWarnings
  const lessonStatusCounts = Object.entries(adminReports?.lesson_status_counts ?? {})
  const documentStatusCounts = Object.entries(
    adminReports?.document_status_counts ?? {},
  )
  const jobStatusCounts = Object.entries(adminReports?.job_status_counts ?? {})
  const reportsGeneratedAt = adminReports?.generated_at
    ? formatDateTime(adminReports.generated_at)
    : 'Chưa tải'

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

  const loadAdminSurfaces = useCallback(async () => {
    setAdminSurfaceStatusMessage('Đang tải dữ liệu Admin fullstack...')
    try {
      const [lessonLibrary, reports, activity, settings] = await Promise.all([
        fetchAdminLessonLibrary(token),
        fetchAdminReports(token),
        fetchAdminActivity(token),
        fetchAdminSettings(token),
      ])
      setAdminLessonLibrary(lessonLibrary)
      setAdminReports(reports)
      setAdminActivity(activity)
      setAdminSettings(settings)
      setSettingsDraft({
        ai_model: settings.ai_model,
        monthly_ai_limit: settings.monthly_ai_limit,
        email_alerts_enabled: settings.email_alerts_enabled,
        in_app_alerts_enabled: settings.in_app_alerts_enabled,
        password_min_length: settings.password_min_length,
        require_password_rotation: settings.require_password_rotation,
      })
      setAdminSurfaceStatusMessage('Đã tải dữ liệu Admin từ backend.')
    } catch (error: unknown) {
      setAdminSurfaceStatusMessage(
        getErrorMessage(error, 'Không tải được dữ liệu Admin fullstack'),
      )
    }
  }, [token])

  useEffect(() => {
    void loadReviewQueue()
    void loadKnowledgeDocuments()
    void loadInvites()
    void loadManagedUsers()
    void loadAdminSurfaces()
  }, [
    loadAdminSurfaces,
    loadInvites,
    loadKnowledgeDocuments,
    loadManagedUsers,
    loadReviewQueue,
  ])

  useEffect(() => {
    setManagedUserPage(1)
  }, [managedUserFilters])

  useEffect(() => {
    setSelectedManagedUserIds((current) =>
      current.filter((id) => managedUsers.some((user) => user.id === id)),
    )
  }, [managedUsers])

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

  function toggleManagedUserSelection(userId: string) {
    setSelectedManagedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    )
  }

  function toggleManagedUserPageSelection() {
    setSelectedManagedUserIds((current) => {
      const currentSet = new Set(current)
      const pageSet = new Set(paginatedManagedUserIds)
      if (
        paginatedManagedUserIds.length > 0 &&
        paginatedManagedUserIds.every((id) => currentSet.has(id))
      ) {
        return current.filter((id) => !pageSet.has(id))
      }

      paginatedManagedUserIds.forEach((id) => currentSet.add(id))
      return [...currentSet]
    })
  }

  function replaceManagedUsers(updatedUsers: ManagedUser[]) {
    const updatedById = new Map(updatedUsers.map((user) => [user.id, user]))
    setManagedUsers((current) =>
      current.map((user) => updatedById.get(user.id) ?? user),
    )
  }

  async function handleBulkManagedUserStatus(
    nextStatus: ManagedUserStatus,
    actionLabel: string,
  ) {
    if (!selectedManagedUserIds.length) {
      setManagedUserStatusMessage('Chọn ít nhất một Teacher/Student trước.')
      return
    }

    setIsBulkManagedUserBusy(true)
    setManagedUserStatusMessage(`Đang ${actionLabel.toLowerCase()}...`)
    try {
      const response = await bulkUpdateManagedUserStatus(
        {
          user_ids: selectedManagedUserIds,
          status: nextStatus,
        },
        token,
      )
      replaceManagedUsers(response.users)
      setSelectedManagedUserIds([])
      setManagedUserStatusMessage(
        `${actionLabel}: đã cập nhật ${response.updated_count} user.`,
      )
    } catch (error: unknown) {
      setManagedUserStatusMessage(
        getErrorMessage(error, `Không ${actionLabel.toLowerCase()} được user`),
      )
    } finally {
      setIsBulkManagedUserBusy(false)
    }
  }

  async function handleBulkManagedUserPasswordReset() {
    if (!selectedManagedUserIds.length) {
      setManagedUserStatusMessage('Chọn ít nhất một Teacher/Student trước.')
      return
    }

    setIsBulkManagedUserBusy(true)
    setManagedUserStatusMessage('Đang gửi email đặt lại mật khẩu...')
    try {
      const response = await bulkResetManagedUserPasswords(
        { user_ids: selectedManagedUserIds },
        token,
      )
      setManagedUserStatusMessage(
        `Đã gửi ${response.sent_count}/${response.requested_count} email đặt lại mật khẩu; bỏ qua ${response.skipped_count} account demo/disabled.`,
      )
    } catch (error: unknown) {
      setManagedUserStatusMessage(
        getErrorMessage(error, 'Không gửi được email đặt lại mật khẩu'),
      )
    } finally {
      setIsBulkManagedUserBusy(false)
    }
  }

  const isSelectedReviewBusy = selectedReviewLesson
    ? busyLessonId === selectedReviewLesson.id
    : false
  const canModerateSelected =
    Boolean(selectedReviewMetrics?.canModerate) && !isSelectedReviewBusy

  async function handleRefreshAdminData() {
    await Promise.all([
      loadReviewQueue(),
      loadKnowledgeDocuments(),
      loadInvites(),
      loadManagedUsers(),
      loadAdminSurfaces(),
    ])
  }

  async function handleAdminSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSavingSettings(true)
    setAdminSurfaceStatusMessage('Đang lưu cài đặt Admin...')
    try {
      const updated = await updateAdminSettings(settingsDraft, token)
      setAdminSettings(updated)
      setSettingsDraft({
        ai_model: updated.ai_model,
        monthly_ai_limit: updated.monthly_ai_limit,
        email_alerts_enabled: updated.email_alerts_enabled,
        in_app_alerts_enabled: updated.in_app_alerts_enabled,
        password_min_length: updated.password_min_length,
        require_password_rotation: updated.require_password_rotation,
      })
      setAdminSurfaceStatusMessage('Đã lưu cài đặt Admin.')
    } catch (error: unknown) {
      setAdminSurfaceStatusMessage(
        getErrorMessage(error, 'Không lưu được cài đặt Admin'),
      )
    } finally {
      setIsSavingSettings(false)
    }
  }

  return (
    <section
      className="panel learning-panel admin-review-panel v4-admin-workspace"
      id={WORKSPACE_SECTION_IDS.adminReview}
      tabIndex={-1}
    >
      {activePage === 'admin-overview' && (
        <section className="admin-design-page admin-design-overview">
          <div className="v4-admin-hero">
            <div>
              <p className="section-label">Tổng quan</p>
              <h2>Trung tâm vận hành Admin</h2>
              <p className="muted">
                Chuẩn hóa từ HTML overview: theo dõi hàng đợi, nguồn tri thức,
                người dùng và rủi ro trước khi publish.
              </p>
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={() => void handleRefreshAdminData()}
            >
              <RefreshCcw aria-hidden="true" size={17} />
              Tải lại dữ liệu
            </button>
          </div>

          <div className="v4-metric-grid v4-admin-metrics">
            {adminStats.map((metric) => (
              <MetricCard
                detail={metric.detail}
                key={metric.label}
                label={metric.label}
                tone={metric.tone}
                value={metric.value}
              />
            ))}
          </div>

          <p className="state-panel compact-state">{adminSurfaceStatusMessage}</p>

          <div className="v4-admin-review-grid">
            <section className="v4-admin-review-detail">
              <div className="v4-panel-title">
                <span>Ưu tiên hôm nay</span>
                <strong>{adminSummary.pendingLessons}</strong>
              </div>
              <div className="v4-citation-list">
                <article>
                  <Activity aria-hidden="true" size={18} />
                  <div>
                    <strong>Hàng đợi duyệt</strong>
                    <p>{statusMessage}</p>
                  </div>
                </article>
                <article>
                  <Database aria-hidden="true" size={18} />
                  <div>
                    <strong>Kho tri thức</strong>
                    <p>{knowledgeStatusMessage}</p>
                  </div>
                </article>
                <article>
                  <ShieldCheck aria-hidden="true" size={18} />
                  <div>
                    <strong>Người dùng</strong>
                    <p>{managedUserStatusMessage}</p>
                  </div>
                </article>
              </div>
            </section>

            <aside className="v4-admin-queue" aria-label="Hoạt động gần đây">
              <div className="v4-panel-title">
                <span>Hoạt động gần đây</span>
                <strong>{recentAdminActivity.length}</strong>
              </div>
              {recentAdminActivity.length ? (
                recentAdminActivity.slice(0, 5).map((item) => (
                  <div className="v4-admin-queue-item" key={item.id}>
                    <FileText aria-hidden="true" size={18} />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.type}</small>
                    </span>
                    <small>{item.detail}</small>
                  </div>
                ))
              ) : (
                <div className="v4-empty-inline">
                  <Activity aria-hidden="true" size={16} />
                  Chưa có hoạt động từ dữ liệu backend.
                </div>
              )}
            </aside>
          </div>
        </section>
      )}

      {activePage === 'admin-review' && (
        <>
          <div className="v4-admin-hero">
            <div>
              <p className="section-label">Hàng đợi duyệt</p>
              <h2>Duyệt bài học</h2>
              <p className="muted">Kiểm tra nguồn trước khi publish.</p>
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

      {activePage === 'admin-lesson-library' && (
        <section className="knowledge-panel admin-design-page admin-design-lesson-library admin-design-lesson-library-part1 admin-management-surface">
          <div className="management-header">
            <div>
              <p className="section-label">Bài giảng mẫu</p>
              <h3>Kho bài giảng organization</h3>
              <p className="muted">
                Chuẩn hóa từ HTML lesson library và dùng dữ liệu thật từ
                endpoint Admin, không dùng số liệu mẫu trong prototype.
              </p>
            </div>
            <button
              className="ghost-button"
              type="button"
              onClick={() => void loadAdminSurfaces()}
            >
              <RefreshCcw aria-hidden="true" size={16} />
              Tải lại
            </button>
          </div>

          <p className="state-panel compact-state">{adminSurfaceStatusMessage}</p>

          <div className="v4-metric-grid admin-user-summary-grid">
            <MetricCard
              detail="Lesson thuộc organization"
              label="Tổng bài giảng"
              value={String(lessonLibraryTotal)}
            />
            <MetricCard
              detail="Đã được publish cho Student"
              label="Đã publish"
              tone={lessonLibraryPublished ? 'success' : 'default'}
              value={String(lessonLibraryPublished)}
            />
            <MetricCard
              detail="Cần Admin quyết định"
              label="Chờ duyệt"
              tone={lessonLibraryPendingReview ? 'warning' : 'success'}
              value={String(lessonLibraryPendingReview)}
            />
            <MetricCard
              detail="Lesson có block cần xem lại"
              label="Cảnh báo"
              tone={lessonLibraryWarnings ? 'warning' : 'success'}
              value={String(lessonLibraryWarnings)}
            />
          </div>

          <DataTable
            columns={[
              {
                header: 'Bài giảng',
                key: 'lesson',
                render: (lesson) => (
                  <span className="admin-document-title-cell">
                    <strong>{lesson.title}</strong>
                    <small>
                      Session {lesson.outline_session_index} - {lesson.blocks.length}{' '}
                      block
                    </small>
                  </span>
                ),
              },
              {
                header: 'Trạng thái',
                key: 'status',
                render: (lesson) => (
                  <span className="status-pill">
                    {lessonStatusLabel(lesson.status)}
                  </span>
                ),
              },
              {
                header: 'Citation',
                key: 'citations',
                render: (lesson) =>
                  String(
                    lesson.blocks.reduce(
                      (total, block) => total + block.citations.length,
                      0,
                    ),
                  ),
              },
              {
                header: 'Cập nhật',
                key: 'updated',
                render: (lesson) => formatDateTime(lesson.updated_at),
              },
            ]}
            emptyState={
              <p className="muted">
                Organization chưa có bài giảng trong lesson library backend.
              </p>
            }
            getRowKey={(lesson) => lesson.id}
            rows={lessonLibraryItems}
          />
        </section>
      )}

      {activePage === 'admin-knowledge' && (
        <section
          className="knowledge-panel admin-knowledge-panel admin-design-knowledge-part2 admin-management-surface"
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
          <section className="knowledge-panel admin-user-management-panel admin-design-users admin-design-users-part1 admin-design-users-part2">
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
                  disabled={isManagedUserActionBusy}
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

            <div className="admin-user-bulk-bar">
              <label className="settings-checkbox admin-user-page-select">
                <input
                  aria-label="Chọn tất cả user trên trang hiện tại"
                  checked={areAllManagedUsersOnPageSelected}
                  disabled={
                    isManagedUserActionBusy || paginatedManagedUserIds.length === 0
                  }
                  type="checkbox"
                  onChange={toggleManagedUserPageSelection}
                />
                <span>
                  Đã chọn {selectedManagedUsers.length} user
                  {selectedManagedUsers.length > 0
                    ? ` (${selectedManagedUsers
                        .map((user) => user.name)
                        .slice(0, 2)
                        .join(', ')}${
                        selectedManagedUsers.length > 2 ? ', ...' : ''
                      })`
                    : ''}
                </span>
              </label>
              <div className="admin-user-bulk-actions">
                <button
                  className="ghost-button table-action-button"
                  disabled={
                    isManagedUserActionBusy || selectedManagedUserIds.length === 0
                  }
                  type="button"
                  onClick={() => void handleBulkManagedUserPasswordReset()}
                >
                  {isBulkManagedUserBusy ? (
                    <Spinner label="Đang xử lý" />
                  ) : (
                    <>
                      <KeyRound aria-hidden="true" size={16} />
                      Đổi mật khẩu
                    </>
                  )}
                </button>
                <button
                  className="ghost-button table-action-button"
                  disabled={
                    isManagedUserActionBusy || selectedManagedUserIds.length === 0
                  }
                  type="button"
                  onClick={() =>
                    void handleBulkManagedUserStatus('disabled', 'Khóa tài khoản')
                  }
                >
                  <UserX aria-hidden="true" size={16} />
                  Khóa tài khoản
                </button>
                <button
                  className="ghost-button table-action-button"
                  disabled={
                    isManagedUserActionBusy || selectedManagedUserIds.length === 0
                  }
                  type="button"
                  onClick={() =>
                    void handleBulkManagedUserStatus('active', 'Mở lại tài khoản')
                  }
                >
                  <UserCheck aria-hidden="true" size={16} />
                  Mở lại
                </button>
                <button
                  className="ghost-button table-action-button danger-action"
                  disabled={
                    isManagedUserActionBusy || selectedManagedUserIds.length === 0
                  }
                  type="button"
                  onClick={() =>
                    void handleBulkManagedUserStatus('disabled', 'Xóa khỏi active')
                  }
                >
                  <Trash2 aria-hidden="true" size={16} />
                  Xóa khỏi active
                </button>
              </div>
            </div>

            <p className="state-panel compact-state">{managedUserStatusMessage}</p>

            <DataTable
              columns={[
                {
                  header: 'Chọn',
                  key: 'select',
                  render: (user) => (
                    <span className="admin-user-select-cell">
                      <input
                        aria-label={`Chọn ${user.name}`}
                        checked={selectedManagedUserIds.includes(user.id)}
                        disabled={isManagedUserActionBusy}
                        type="checkbox"
                        onChange={() => toggleManagedUserSelection(user.id)}
                      />
                    </span>
                  ),
                },
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
                              disabled={isManagedUserActionBusy}
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
                            disabled={isManagedUserActionBusy}
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
                          disabled={isManagedUserActionBusy}
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

      {activePage === 'admin-jobs' && (
        <JobCenter audience="admin" token={token} />
      )}

      {activePage === 'admin-reports' && (
        <section className="knowledge-panel admin-design-page admin-design-reports admin-design-reports-part1 admin-management-surface">
          <div className="management-header">
            <div>
              <p className="section-label">Báo cáo</p>
              <h3>Báo cáo vận hành</h3>
              <p className="muted">
                Chuẩn hóa từ HTML report và lấy số liệu tổng hợp từ backend
                theo organization hiện tại.
              </p>
            </div>
            <BarChart3 aria-hidden="true" size={26} />
          </div>

          <p className="state-panel compact-state">
            {adminSurfaceStatusMessage} Cập nhật báo cáo: {reportsGeneratedAt}.
          </p>

          <div className="v4-metric-grid admin-user-summary-grid">
            {adminStats.map((metric) => (
              <MetricCard
                detail={metric.detail}
                key={metric.label}
                label={metric.label}
                tone={metric.tone}
                value={metric.value}
              />
            ))}
          </div>

          <div className="admin-report-breakdown">
            <section>
              <h4>Lesson status</h4>
              {lessonStatusCounts.length ? (
                lessonStatusCounts.map(([status, count]) => (
                  <span key={status}>
                    <strong>{formatStatusCountLabel(status)}</strong>
                    <small>{count}</small>
                  </span>
                ))
              ) : (
                <p className="muted">Chưa có lesson.</p>
              )}
            </section>
            <section>
              <h4>Document status</h4>
              {documentStatusCounts.length ? (
                documentStatusCounts.map(([status, count]) => (
                  <span key={status}>
                    <strong>{formatStatusCountLabel(status)}</strong>
                    <small>{count}</small>
                  </span>
                ))
              ) : (
                <p className="muted">Chưa có tài liệu.</p>
              )}
            </section>
            <section>
              <h4>Job status</h4>
              {jobStatusCounts.length ? (
                jobStatusCounts.map(([status, count]) => (
                  <span key={status}>
                    <strong>{formatStatusCountLabel(status)}</strong>
                    <small>{count}</small>
                  </span>
                ))
              ) : (
                <p className="muted">Chưa có job.</p>
              )}
            </section>
          </div>

          <DataTable
            columns={[
              {
                header: 'Chỉ số',
                key: 'metric',
                render: (metric) => <strong>{metric.label}</strong>,
              },
              {
                header: 'Giá trị',
                key: 'value',
                render: (metric) => metric.value,
              },
              {
                header: 'Diễn giải',
                key: 'detail',
                render: (metric) => metric.detail,
              },
            ]}
            emptyState={<p className="muted">Chưa có số liệu báo cáo.</p>}
            getRowKey={(metric) => metric.label}
            rows={adminStats}
          />
        </section>
      )}

      {activePage === 'admin-activity-log' && (
        <section className="knowledge-panel admin-design-page admin-design-activity-log admin-design-activity-log-part2 admin-management-surface">
          <div className="management-header">
            <div>
              <p className="section-label">Nhật ký</p>
              <h3>Hoạt động gần đây</h3>
              <p className="muted">
                Chuẩn hóa từ HTML activity log và đọc audit feed thật theo
                organization từ backend.
              </p>
            </div>
            <Activity aria-hidden="true" size={26} />
          </div>

          <p className="state-panel compact-state">{adminSurfaceStatusMessage}</p>

          <DataTable
            columns={[
              {
                header: 'Loại',
                key: 'type',
                render: (item) => item.type,
              },
              {
                header: 'Sự kiện',
                key: 'title',
                render: (item) => <strong>{item.title}</strong>,
              },
              {
                header: 'Chi tiết',
                key: 'detail',
                render: (item) => item.detail,
              },
              {
                header: 'Thời gian',
                key: 'time',
                render: (item) => formatDateTime(item.createdAt),
              },
            ]}
            emptyState={
              <p className="muted">
                Backend chưa có hoạt động organization để hiển thị.
              </p>
            }
            getRowKey={(item) => item.id}
            rows={recentAdminActivity}
          />
        </section>
      )}

      {activePage === 'admin-settings' && (
        <section className="knowledge-panel admin-design-page admin-design-settings admin-management-surface">
          <div className="management-header">
            <div>
              <p className="section-label">Cài đặt</p>
              <h3>Cấu hình vận hành</h3>
              <p className="muted">
                Chuẩn hóa từ HTML settings theo hướng production-safe: lưu
                policy vận hành trong backend, không lộ API key hoặc provider
                secret ở frontend.
              </p>
            </div>
            <Settings aria-hidden="true" size={26} />
          </div>

          <p className="state-panel compact-state">
            {adminSurfaceStatusMessage}
            {adminSettings?.updated_at
              ? ` Cập nhật lần cuối: ${formatDateTime(adminSettings.updated_at)}.`
              : ''}
          </p>

          <form className="admin-settings-form" onSubmit={handleAdminSettingsSubmit}>
            <section className="v4-admin-block-card">
              <div className="lesson-block-header">
                <span>AI</span>
                <strong>Metadata</strong>
              </div>
              <label className="field">
                <span>Model AI mặc định</span>
                <input
                  disabled={isSavingSettings || !adminSettings}
                  placeholder="gpt-4o-mini"
                  value={settingsDraft.ai_model ?? ''}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      ai_model: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Quota AI tháng</span>
                <input
                  disabled={isSavingSettings || !adminSettings}
                  min={0}
                  type="number"
                  value={settingsDraft.monthly_ai_limit ?? 0}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      monthly_ai_limit: parseNonNegativeNumber(
                        event.target.value,
                        current.monthly_ai_limit ?? 0,
                      ),
                    }))
                  }
                />
              </label>
            </section>

            <section className="v4-admin-block-card">
              <div className="lesson-block-header">
                <span>Alerts</span>
                <strong>Notification</strong>
              </div>
              <label className="settings-checkbox">
                <input
                  checked={settingsDraft.email_alerts_enabled ?? false}
                  disabled={isSavingSettings || !adminSettings}
                  type="checkbox"
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      email_alerts_enabled: event.target.checked,
                    }))
                  }
                />
                <span>Email alert cho Admin</span>
              </label>
              <label className="settings-checkbox">
                <input
                  checked={settingsDraft.in_app_alerts_enabled ?? false}
                  disabled={isSavingSettings || !adminSettings}
                  type="checkbox"
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      in_app_alerts_enabled: event.target.checked,
                    }))
                  }
                />
                <span>In-app alert trong dashboard</span>
              </label>
            </section>

            <section className="v4-admin-block-card">
              <div className="lesson-block-header">
                <span>Security</span>
                <strong>Policy</strong>
              </div>
              <label className="field">
                <span>Độ dài mật khẩu tối thiểu</span>
                <input
                  disabled={isSavingSettings || !adminSettings}
                  min={8}
                  type="number"
                  value={settingsDraft.password_min_length ?? 8}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      password_min_length: Math.max(
                        8,
                        parseNonNegativeNumber(
                          event.target.value,
                          current.password_min_length ?? 8,
                        ),
                      ),
                    }))
                  }
                />
              </label>
              <label className="settings-checkbox">
                <input
                  checked={settingsDraft.require_password_rotation ?? false}
                  disabled={isSavingSettings || !adminSettings}
                  type="checkbox"
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      require_password_rotation: event.target.checked,
                    }))
                  }
                />
                <span>Bắt buộc đổi mật khẩu định kỳ</span>
              </label>
            </section>

            <section className="v4-admin-block-card admin-settings-save-card">
              <div className="lesson-block-header">
                <span>Secrets</span>
                <strong>Không hiển thị</strong>
              </div>
              <h3>API keys và provider keys</h3>
              <p>
                Frontend không đọc hoặc render OpenAI/NVIDIA/Supabase secret.
                Backend chỉ trả cấu hình vận hành không nhạy cảm.
              </p>
              <button
                className="primary-button"
                disabled={isSavingSettings || !adminSettings}
                type="submit"
              >
                <Save aria-hidden="true" size={17} />
                {isSavingSettings ? <Spinner label="Đang lưu" /> : 'Lưu cài đặt'}
              </button>
            </section>
          </form>
        </section>
      )}
    </section>
  )
}
