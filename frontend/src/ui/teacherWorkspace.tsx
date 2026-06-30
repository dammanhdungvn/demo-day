import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  Loader2,
} from 'lucide-react'
import type {
  GenerationJob,
  LessonBlock,
  LessonSession,
  SourceDocument,
} from '../api/learning'
import { blockStatusLabel, documentStatusLabel } from '../labels'
import type {
  TeacherWorkflowStep,
  TeacherWorkspaceMetrics,
} from '../features/teacherWorkspace'

type MetricCardProps = {
  label: string
  value: string
  detail: string
  tone?: 'default' | 'success' | 'warning' | 'info'
}

export function MetricCard({
  label,
  value,
  detail,
  tone = 'default',
}: MetricCardProps) {
  return (
    <article className={`v4-metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

export function WorkflowTimeline({
  steps,
  onSelectStep,
}: {
  steps: TeacherWorkflowStep[]
  onSelectStep: (step: TeacherWorkflowStep) => void
}) {
  return (
    <nav className="v4-workflow" aria-label="Teacher workflow">
      {steps.map((step, index) => (
        <button
          className={`v4-workflow-step ${step.status}`}
          key={step.id}
          type="button"
          onClick={() => onSelectStep(step)}
        >
          <span className="v4-step-index">{index + 1}</span>
          <span>
            <strong>{step.label}</strong>
            <small>{step.detail}</small>
          </span>
        </button>
      ))}
    </nav>
  )
}

export function SourceStrip({
  documents,
  selectedDocumentIds,
  onToggle,
}: {
  documents: SourceDocument[]
  selectedDocumentIds: string[]
  onToggle: (document: SourceDocument) => void
}) {
  if (!documents.length) {
    return (
      <div className="v4-empty-inline">
        <FileText aria-hidden="true" size={18} />
        Chua co tai lieu nguon trong kho tri thuc.
      </div>
    )
  }

  return (
    <div className="v4-source-strip" aria-label="Nguon tri thuc">
      {documents.slice(0, 8).map((document) => {
        const selected = selectedDocumentIds.includes(document.id)
        const completed = document.status === 'completed' && document.is_active
        return (
          <button
            className={`v4-source-card ${selected ? 'selected' : ''}`}
            disabled={!completed}
            key={document.id}
            type="button"
            onClick={() => onToggle(document)}
          >
            <FileText aria-hidden="true" size={18} />
            <span>
              <strong>{document.title}</strong>
              <small>{document.file_name}</small>
            </span>
            <em>{documentStatusLabel(document)}</em>
          </button>
        )
      })}
    </div>
  )
}

export function JobQueue({
  jobs,
  isRetrieving,
  isGeneratingOutline,
  isGeneratingLesson,
  isReviewingLesson,
}: {
  jobs: GenerationJob[]
  isRetrieving: boolean
  isGeneratingOutline: boolean
  isGeneratingLesson: boolean
  isReviewingLesson: boolean
}) {
  const localRunningJobs = [
    { label: 'Kiểm tra nguồn', active: isRetrieving },
    { label: 'Tạo dàn ý', active: isGeneratingOutline },
    { label: 'Tạo nội dung bài giảng', active: isGeneratingLesson },
    { label: 'Lưu chỉnh sửa bài', active: isReviewingLesson },
  ].filter((job) => job.active)

  if (!jobs.length && !localRunningJobs.length) {
    return (
      <div className="v4-empty-inline">
        <Clock3 aria-hidden="true" size={16} />
        Chưa có tác vụ xử lý gần đây.
      </div>
    )
  }

  return (
    <div className="v4-job-queue">
      {localRunningJobs.map((job) => (
        <div className="running" key={`local-${job.label}`}>
          <Loader2 aria-hidden="true" size={16} />
          <span>{job.label}</span>
          <small>Đang chạy</small>
        </div>
      ))}
      {jobs.slice(0, 5).map((job) => {
        const running = ['queued', 'processing', 'retrying'].includes(job.status)
        return (
          <div className={running ? 'running' : ''} key={job.id}>
            {running ? (
              <Loader2 aria-hidden="true" size={16} />
            ) : (
              <CheckCircle2 aria-hidden="true" size={16} />
            )}
            <span>{generationJobTypeLabel(job.job_type)}</span>
            <small>{generationJobStatusLabel(job.status)}</small>
          </div>
        )
      })}
    </div>
  )
}

function generationJobTypeLabel(jobType: string): string {
  const labels: Record<string, string> = {
    outline_generation: 'Tạo dàn ý',
    lesson_generation: 'Tạo nội dung bài giảng',
    block_regeneration: 'Tạo lại nội dung',
    retrieval: 'Kiểm tra nguồn',
    document_upload: 'Upload tài liệu',
    embedding_reindex: 'Làm mới tài liệu',
  }
  return labels[jobType] ?? jobType
}

function generationJobStatusLabel(status: GenerationJob['status']): string {
  const labels: Record<GenerationJob['status'], string> = {
    queued: 'Đang chờ',
    processing: 'Đang chạy',
    completed: 'Hoàn tất',
    failed: 'Lỗi',
    cancelled: 'Đã hủy',
    retrying: 'Đang thử lại',
    skipped: 'Đã bỏ qua',
  }
  return labels[status]
}

export function CitationInspector({
  lesson,
  selectedBlock,
  metrics,
}: {
  lesson: LessonSession | null
  selectedBlock: LessonBlock | null
  metrics: TeacherWorkspaceMetrics
}) {
  const block = selectedBlock ?? lesson?.blocks[0] ?? null

  return (
    <aside className="v4-citation-panel" aria-label="Nguồn dẫn">
      <div className="v4-panel-title">
        <span>Độ tin cậy nguồn</span>
        <strong>{metrics.citationCoveragePercent}%</strong>
      </div>
      {!block ? (
        <p className="muted">Chưa có nội dung để kiểm tra nguồn dẫn.</p>
      ) : (
        <>
          <div
            className={`v4-grounding-summary ${
              metrics.warningCount ? 'warning' : 'success'
            }`}
          >
            {metrics.warningCount ? (
              <AlertTriangle aria-hidden="true" size={17} />
            ) : (
              <CheckCircle2 aria-hidden="true" size={17} />
            )}
            <span>
              {metrics.warningCount
                ? `${metrics.warningCount} khối cần kiểm tra nguồn`
                : 'Tất cả khối nội dung hiện không có cảnh báo nguồn'}
            </span>
          </div>
          <div className="v4-citation-focus">
            <small>Khối đang xem</small>
            <strong>{block.title}</strong>
            <span>{blockStatusLabel(block.status)}</span>
          </div>
          {block.warning && (
            <div className="v4-warning-box">
              <AlertTriangle aria-hidden="true" size={17} />
              <span>{block.warning}</span>
            </div>
          )}
          {block.citations.length ? (
            <div className="v4-citation-list">
              {block.citations.map((citation) => (
                <article key={citation.chunk_id}>
                  <div>
                    <strong>{citation.document_title}</strong>
                    <small>
                      Trang {citation.page_number ?? 'n/a'} - đoạn{' '}
                      {citation.chunk_index} - {citation.score.toFixed(2)}
                    </small>
                  </div>
                  <p>{citation.excerpt}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="v4-empty-inline">
              <Circle aria-hidden="true" size={16} />
              Khối nội dung này chưa có nguồn dẫn.
            </div>
          )}
        </>
      )}
      <div className="v4-citation-footer">
        <Clock3 aria-hidden="true" size={16} />
        <span>
          {lesson
            ? `Cập nhật ${new Date(lesson.updated_at).toLocaleString('vi-VN')}`
            : 'Chờ bài giảng'}
        </span>
      </div>
    </aside>
  )
}
