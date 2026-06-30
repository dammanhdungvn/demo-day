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
  FileText,
  RefreshCcw,
  Send,
  UsersRound,
  XCircle,
} from 'lucide-react'
import {
  createInvite,
  fetchInvites,
  type OrganizationInvite,
  type UserRole,
} from '../../api/auth'
import {
  archiveDocument,
  fetchAdminReviewQueue,
  fetchDocuments,
  publishLesson,
  reindexDocument,
  rejectLesson,
  requestLessonChanges,
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
import { documentUploadStatusMessage } from '../../uploadStatus'
import { WORKSPACE_SECTION_IDS } from '../../workspaceActionTargets'
import { buildAdminReviewSummary } from '../adminStudentWorkspace'
import {
  DocumentStatusList,
  KnowledgeUploadPanel,
} from '../knowledge/KnowledgeControls'

export function AdminWorkspace({ token }: { token: string }) {
  const [reviewLessons, setReviewLessons] = useState<LessonSession[]>([])
  const [documents, setDocuments] = useState<SourceDocument[]>([])
  const [invites, setInvites] = useState<OrganizationInvite[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('teacher')
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
  const [busyLessonId, setBusyLessonId] = useState<string | null>(null)
  const [archivingDocumentId, setArchivingDocumentId] = useState<string | null>(null)
  const [reindexingDocumentId, setReindexingDocumentId] = useState<string | null>(null)
  const [isInviteBusy, setIsInviteBusy] = useState(false)
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

  useEffect(() => {
    void loadReviewQueue()
    void loadKnowledgeDocuments()
    void loadInvites()
  }, [loadInvites, loadKnowledgeDocuments, loadReviewQueue])

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
          Tải lại hàng đợi
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

      <section
        className="knowledge-panel admin-knowledge-panel"
        id={WORKSPACE_SECTION_IDS.adminKnowledge}
        tabIndex={-1}
      >
        <div className="panel-heading">
          <p className="section-label">Kho tri thức dài hạn của AI</p>
          <span className="status-pill neutral-pill">Admin library</span>
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
        <p className="state-panel compact-state">{knowledgeStatusMessage}</p>
        {documents.length > 0 ? (
          <DocumentStatusList
            busyDocumentId={archivingDocumentId}
            busyReindexDocumentId={reindexingDocumentId}
            documents={documents}
            onArchive={(document) => void handleAdminArchiveDocument(document)}
            onReindex={(document) => void handleAdminReindexDocument(document)}
          />
        ) : (
          <p className="muted">{knowledgeStatusMessage}</p>
        )}
      </section>

      <section className="knowledge-panel admin-invite-panel">
        <div className="panel-heading">
          <p className="section-label">Tạo tài khoản bằng invite</p>
          <span className="status-pill neutral-pill">Lưu database</span>
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
              onChange={(event) => setInviteRole(event.target.value as UserRole)}
            >
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </label>
          <button className="primary-button" disabled={isInviteBusy} type="submit">
            <UsersRound aria-hidden="true" size={17} />
            Tạo invite
          </button>
          <p className="state-panel compact-state">{inviteStatusMessage}</p>
        </form>
        {invites.length > 0 ? (
          <div className="document-list invite-list">
            {invites.map((invite) => (
              <article className="document-row invite-row" key={invite.id}>
                <UsersRound aria-hidden="true" size={18} />
                <div>
                  <strong>{invite.email}</strong>
                  <span className="citation-meta">
                    {roleLabel(invite.role)} - {invite.status} -{' '}
                    {new Date(invite.created_at).toLocaleString('vi-VN')}
                  </span>
                  <code className="invite-code">{invite.invite_code}</code>
                </div>
                <span className="status-pill neutral-pill">{invite.status}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">{inviteStatusMessage}</p>
        )}
      </section>
    </section>
  )
}
