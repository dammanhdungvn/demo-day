import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  RefreshCcw,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-react'

import {
  cancelGenerationJob,
  fetchGenerationJobs,
  retryGenerationJob,
  type GenerationJob,
  type GenerationJobStatus,
} from '../../api/learning'
import { getErrorMessage } from '../../errors'
import {
  Alert,
  DataTable,
  PaginationControls,
} from '../../ui/application'
import { buildPaginationState } from '../../ui/pagination'

type JobCenterAudience = 'admin' | 'teacher'
type JobFilter = 'all' | 'active' | GenerationJobStatus
type JobAction = 'cancel' | 'retry'

const JOB_PAGE_SIZE = 8
const JOB_POLL_INTERVAL_MS = 8000
const ACTIVE_STATUSES: GenerationJobStatus[] = ['queued', 'processing', 'retrying']
const STATUS_FILTERS: Array<{ label: string; value: JobFilter }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đang chạy', value: 'active' },
  { label: 'Lỗi', value: 'failed' },
  { label: 'Xong', value: 'completed' },
  { label: 'Đã hủy', value: 'cancelled' },
]

function jobStatusLabel(status: GenerationJobStatus): string {
  const labels: Record<GenerationJobStatus, string> = {
    cancelled: 'Đã hủy',
    completed: 'Xong',
    failed: 'Lỗi',
    processing: 'Đang chạy',
    queued: 'Đang chờ',
    retrying: 'Thử lại',
    skipped: 'Bỏ qua',
  }
  return labels[status]
}

function jobTypeLabel(jobType: string): string {
  const labels: Record<string, string> = {
    block_regeneration: 'Tạo lại khối',
    document_upload: 'Upload tài liệu',
    embedding_reindex: 'Làm mới nguồn',
    lesson_generation: 'Tạo bài giảng',
    outline_generation: 'Tạo dàn ý',
    retrieval: 'Kiểm tra nguồn',
    student_tutor_answer: 'AI Tutor',
  }
  return labels[jobType] ?? jobType.replaceAll('_', ' ')
}

function formatJobTime(value?: string | null): string {
  if (!value) {
    return 'Chưa có'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Chưa có'
  }
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  })
}

function compactText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function firstInputText(
  input: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = compactText(input[key])
    if (value) {
      return value
    }
  }
  return null
}

function sanitizeVisibleError(message: string | null): string | null {
  if (!message) {
    return null
  }
  return message
    .replace(/https?:\/\/\S+/g, '[URL]')
    .replace(/\b(sk|pk|rk)-[A-Za-z0-9_-]{8,}\b/g, '[secret]')
}

function jobContextLabel(job: GenerationJob): string {
  const title = firstInputText(job.input, [
    'title',
    'topic',
    'file_name',
    'document_title',
    'lesson_title',
  ])
  if (title) {
    return title
  }
  const selectedDocuments = job.input.selected_document_ids
  if (Array.isArray(selectedDocuments) && selectedDocuments.length > 0) {
    return `${selectedDocuments.length} tài liệu`
  }
  const documentId = compactText(job.input.document_id)
  if (documentId) {
    return `Doc ${documentId.slice(0, 8)}`
  }
  return job.id.slice(0, 8)
}

function jobErrorMessage(job: GenerationJob): string | null {
  return sanitizeVisibleError(
    job.error_message ?? compactText(job.input.error_message),
  )
}

function isJobActive(job: GenerationJob): boolean {
  return ACTIVE_STATUSES.includes(job.status)
}

function isStatusActive(status: GenerationJobStatus): boolean {
  return ACTIVE_STATUSES.includes(status)
}

function canRetry(job: GenerationJob): boolean {
  return job.status === 'failed'
}

function canCancel(job: GenerationJob): boolean {
  return isJobActive(job)
}

function statusTone(status: GenerationJobStatus): string {
  if (status === 'completed') {
    return 'success'
  }
  if (status === 'failed') {
    return 'danger'
  }
  if (status === 'cancelled' || status === 'skipped') {
    return 'neutral'
  }
  return 'info'
}

function JobStatusChip({ status }: { status: GenerationJobStatus }) {
  return (
    <span className={`job-status-chip ${statusTone(status)}`}>
      {jobStatusLabel(status)}
    </span>
  )
}

function JobStatusIcon({ status }: { status: GenerationJobStatus }) {
  if (status === 'failed') {
    return <XCircle aria-hidden="true" size={17} />
  }
  if (status === 'completed') {
    return <CheckCircle2 aria-hidden="true" size={17} />
  }
  if (isStatusActive(status)) {
    return <Loader2 aria-hidden="true" className="job-spin" size={17} />
  }
  return <Clock3 aria-hidden="true" size={17} />
}

function buildSearchText(job: GenerationJob): string {
  return [
    job.id,
    job.job_type,
    jobTypeLabel(job.job_type),
    job.status,
    jobStatusLabel(job.status),
    jobContextLabel(job),
    job.actor_role ?? '',
    jobErrorMessage(job) ?? '',
  ]
    .join(' ')
    .toLowerCase()
}

function countJobs(jobs: GenerationJob[]) {
  return jobs.reduce(
    (counts, job) => {
      counts.total += 1
      counts[job.status] += 1
      if (isJobActive(job)) {
        counts.active += 1
      }
      return counts
    },
    {
      active: 0,
      cancelled: 0,
      completed: 0,
      failed: 0,
      processing: 0,
      queued: 0,
      retrying: 0,
      skipped: 0,
      total: 0,
    } satisfies Record<GenerationJobStatus | 'active' | 'total', number>,
  )
}

export function JobCenter({
  audience,
  token,
}: {
  audience: JobCenterAudience
  token: string
}) {
  const [jobs, setJobs] = useState<GenerationJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('Đang tải tác vụ...')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobFilter>('all')
  const [page, setPage] = useState(1)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [busyJob, setBusyJob] = useState<{ id: string; action: JobAction } | null>(
    null,
  )

  const loadJobs = useCallback(
    async (mode: 'loud' | 'silent' = 'loud') => {
      if (mode === 'loud') {
        setIsLoading(true)
        setMessage('Đang tải tác vụ...')
      }
      try {
        const nextJobs = await fetchGenerationJobs(token)
        setJobs(nextJobs)
        setMessage(
          nextJobs.length ? `Đã tải ${nextJobs.length} tác vụ.` : 'Chưa có tác vụ.',
        )
      } catch (error: unknown) {
        setMessage(getErrorMessage(error, 'Không tải được tác vụ'))
      } finally {
        if (mode === 'loud') {
          setIsLoading(false)
        }
      }
    },
    [token],
  )

  useEffect(() => {
    void loadJobs()
    const intervalId = window.setInterval(() => {
      void loadJobs('silent')
    }, JOB_POLL_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [loadJobs])

  const counts = useMemo(() => countJobs(jobs), [jobs])
  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return jobs.filter((job) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isJobActive(job)) ||
        job.status === statusFilter
      const matchesQuery =
        !normalizedQuery || buildSearchText(job).includes(normalizedQuery)
      return matchesStatus && matchesQuery
    })
  }, [jobs, query, statusFilter])
  const paginationState = useMemo(
    () =>
      buildPaginationState(filteredJobs, {
        page,
        pageSize: JOB_PAGE_SIZE,
      }),
    [filteredJobs, page],
  )
  const selectedJob = useMemo(
    () =>
      jobs.find((job) => job.id === selectedJobId) ??
      filteredJobs[0] ??
      null,
    [filteredJobs, jobs, selectedJobId],
  )
  const selectedError = selectedJob ? jobErrorMessage(selectedJob) : null

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter])

  useEffect(() => {
    if (!filteredJobs.length) {
      setSelectedJobId(null)
      return
    }
    if (!filteredJobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(filteredJobs[0].id)
    }
  }, [filteredJobs, selectedJobId])

  const replaceJob = useCallback((updatedJob: GenerationJob) => {
    setJobs((current) => {
      if (!current.some((job) => job.id === updatedJob.id)) {
        return [updatedJob, ...current]
      }
      return current.map((job) => (job.id === updatedJob.id ? updatedJob : job))
    })
    setSelectedJobId(updatedJob.id)
  }, [])

  const handleRetry = useCallback(
    async (job: GenerationJob) => {
      setBusyJob({ id: job.id, action: 'retry' })
      try {
        const response = await retryGenerationJob(job.id, token)
        replaceJob(response.generation_job)
        setMessage(response.message)
      } catch (error: unknown) {
        setMessage(getErrorMessage(error, 'Không thể thử lại tác vụ'))
      } finally {
        setBusyJob(null)
      }
    },
    [replaceJob, token],
  )

  const handleCancel = useCallback(
    async (job: GenerationJob) => {
      setBusyJob({ id: job.id, action: 'cancel' })
      try {
        const response = await cancelGenerationJob(job.id, token)
        replaceJob(response.generation_job)
        setMessage(response.message)
      } catch (error: unknown) {
        setMessage(getErrorMessage(error, 'Không thể hủy tác vụ'))
      } finally {
        setBusyJob(null)
      }
    },
    [replaceJob, token],
  )

  const columns = useMemo(
    () => [
      {
        header: 'Tác vụ',
        key: 'job',
        render: (job: GenerationJob) => (
          <button
            className={`job-row-title ${
              selectedJob?.id === job.id ? 'selected' : ''
            }`}
            type="button"
            onClick={() => setSelectedJobId(job.id)}
          >
            <span className={`job-row-icon ${statusTone(job.status)}`}>
              <JobStatusIcon status={job.status} />
            </span>
            <span>
              <strong>{jobTypeLabel(job.job_type)}</strong>
              <small>{jobContextLabel(job)}</small>
            </span>
          </button>
        ),
      },
      {
        header: 'Trạng thái',
        key: 'status',
        render: (job: GenerationJob) => <JobStatusChip status={job.status} />,
      },
      {
        header: 'Cập nhật',
        key: 'updated',
        render: (job: GenerationJob) => formatJobTime(job.updated_at),
      },
      {
        header: 'Hành động',
        key: 'actions',
        render: (job: GenerationJob) => {
          const isRetryBusy = busyJob?.id === job.id && busyJob.action === 'retry'
          const isCancelBusy =
            busyJob?.id === job.id && busyJob.action === 'cancel'
          return (
            <span className="job-action-group">
              <button
                aria-label={`Thử lại ${jobTypeLabel(job.job_type)}`}
                className="ghost-button icon-table-action job-action-button"
                disabled={!canRetry(job) || busyJob !== null}
                title="Thử lại"
                type="button"
                onClick={() => void handleRetry(job)}
              >
                {isRetryBusy ? (
                  <Loader2 aria-hidden="true" className="job-spin" size={16} />
                ) : (
                  <RotateCcw aria-hidden="true" size={16} />
                )}
              </button>
              <button
                aria-label={`Hủy ${jobTypeLabel(job.job_type)}`}
                className="ghost-button icon-table-action danger-action job-action-button"
                disabled={!canCancel(job) || busyJob !== null}
                title="Hủy"
                type="button"
                onClick={() => void handleCancel(job)}
              >
                {isCancelBusy ? (
                  <Loader2 aria-hidden="true" className="job-spin" size={16} />
                ) : (
                  <Ban aria-hidden="true" size={16} />
                )}
              </button>
            </span>
          )
        },
      },
    ],
    [busyJob, handleCancel, handleRetry, selectedJob?.id],
  )

  return (
    <section className="job-center-shell" aria-label="Tác vụ">
      <div className="job-center-header">
        <div>
          <p className="section-label">
            {audience === 'admin' ? 'Theo dõi tổ chức' : 'Không gian xử lý'}
          </p>
          <h3>Tác vụ</h3>
          <p className="muted">AI, tài liệu, xuất bản.</p>
        </div>
        <button
          aria-label="Tải lại tác vụ"
          className="ghost-button icon-button management-icon-button"
          disabled={isLoading}
          title="Tải lại"
          type="button"
          onClick={() => void loadJobs()}
        >
          <RefreshCcw aria-hidden="true" size={17} />
        </button>
      </div>

      <div className="job-summary-strip" aria-label="Tóm tắt tác vụ">
        <button
          className={statusFilter === 'queued' ? 'selected' : ''}
          type="button"
          onClick={() => setStatusFilter('queued')}
        >
          <Clock3 aria-hidden="true" size={16} />
          <span>Chờ</span>
          <strong>{counts.queued}</strong>
        </button>
        <button
          className={statusFilter === 'active' ? 'selected' : ''}
          type="button"
          onClick={() => setStatusFilter('active')}
        >
          <Loader2 aria-hidden="true" className="job-spin" size={16} />
          <span>Chạy</span>
          <strong>{counts.active}</strong>
        </button>
        <button
          className={statusFilter === 'failed' ? 'selected' : ''}
          type="button"
          onClick={() => setStatusFilter('failed')}
        >
          <AlertTriangle aria-hidden="true" size={16} />
          <span>Lỗi</span>
          <strong>{counts.failed}</strong>
        </button>
        <button
          className={statusFilter === 'completed' ? 'selected' : ''}
          type="button"
          onClick={() => setStatusFilter('completed')}
        >
          <CheckCircle2 aria-hidden="true" size={16} />
          <span>Xong</span>
          <strong>{counts.completed}</strong>
        </button>
      </div>

      <div className="job-center-toolbar">
        <label className="job-search-field">
          <Search aria-hidden="true" size={17} />
          <input
            aria-label="Tìm tác vụ"
            placeholder="Tìm..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="job-filter-field">
          <span>Trạng thái</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as JobFilter)}
          >
            {STATUS_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="state-panel compact-state">{message}</p>

      <div className="job-center-grid">
        <div className="job-table-panel">
          <DataTable
            columns={columns}
            emptyState={<p className="muted">Chưa có tác vụ phù hợp.</p>}
            getRowKey={(job) => job.id}
            isLoading={isLoading}
            rows={paginationState.items}
          />
          <PaginationControls state={paginationState} onPageChange={setPage} />
        </div>

        <aside className="job-detail-panel" aria-label="Chi tiết tác vụ">
          {selectedJob ? (
            <>
              <div className="job-detail-title">
                <span className={`job-row-icon ${statusTone(selectedJob.status)}`}>
                  <JobStatusIcon status={selectedJob.status} />
                </span>
                <div>
                  <strong>{jobTypeLabel(selectedJob.job_type)}</strong>
                  <small>{selectedJob.id.slice(0, 12)}</small>
                </div>
                <JobStatusChip status={selectedJob.status} />
              </div>

              {selectedError ? (
                <Alert title="Cần xử lý" tone="danger">
                  {selectedError}
                </Alert>
              ) : (
                <Alert title="Ổn định" tone="success">
                  Không có lỗi mới.
                </Alert>
              )}

              <dl className="job-detail-list">
                <div>
                  <dt>Nguồn</dt>
                  <dd>{jobContextLabel(selectedJob)}</dd>
                </div>
                <div>
                  <dt>Cập nhật</dt>
                  <dd>{formatJobTime(selectedJob.updated_at)}</dd>
                </div>
                <div>
                  <dt>Vai trò</dt>
                  <dd>{selectedJob.actor_role ?? 'N/A'}</dd>
                </div>
                <div>
                  <dt>Ngữ cảnh</dt>
                  <dd>{selectedJob.retrieved_context.length} đoạn</dd>
                </div>
              </dl>

              <div className="job-detail-actions">
                <button
                  aria-label={`Thử lại ${jobTypeLabel(selectedJob.job_type)}`}
                  className="primary-button job-detail-action-button"
                  disabled={!canRetry(selectedJob) || busyJob !== null}
                  title="Thử lại"
                  type="button"
                  onClick={() => void handleRetry(selectedJob)}
                >
                  {busyJob?.id === selectedJob.id && busyJob.action === 'retry' ? (
                    <Loader2 aria-hidden="true" className="job-spin" size={16} />
                  ) : (
                    <RotateCcw aria-hidden="true" size={16} />
                  )}
                </button>
                <button
                  aria-label={`Hủy ${jobTypeLabel(selectedJob.job_type)}`}
                  className="ghost-button danger-action job-detail-action-button"
                  disabled={!canCancel(selectedJob) || busyJob !== null}
                  title="Hủy"
                  type="button"
                  onClick={() => void handleCancel(selectedJob)}
                >
                  {busyJob?.id === selectedJob.id && busyJob.action === 'cancel' ? (
                    <Loader2 aria-hidden="true" className="job-spin" size={16} />
                  ) : (
                    <Ban aria-hidden="true" size={16} />
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="job-detail-empty">
              <FileText aria-hidden="true" size={24} />
              <strong>Chưa có tác vụ</strong>
              <span>Tác vụ mới sẽ xuất hiện tại đây.</span>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
