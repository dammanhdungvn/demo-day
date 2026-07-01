import type { ReactNode } from 'react'

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react'

import type { PaginationState } from './pagination'

export type Tone = 'info' | 'success' | 'warning' | 'danger'

export function Spinner({ label = 'Đang xử lý' }: { label?: string }) {
  return (
    <span className="ui-spinner" role="status">
      <Loader2 aria-hidden="true" size={16} />
      <span>{label}</span>
    </span>
  )
}

export function Alert({
  children,
  title,
  tone = 'info',
}: {
  children?: ReactNode
  title: string
  tone?: Tone
}) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle

  return (
    <div className={`ui-alert tone-${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" size={18} />
      <div>
        <strong>{title}</strong>
        {children && <p>{children}</p>}
      </div>
    </div>
  )
}

export function SkeletonRows({
  columns = 4,
  rows = 3,
}: {
  columns?: number
  rows?: number
}) {
  return (
    <div className="ui-skeleton-stack" aria-label="Đang tải dữ liệu">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div className="ui-skeleton-row" key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <span
              className="ui-skeleton-cell"
              key={columnIndex}
              style={{ width: `${Math.max(28, 88 - columnIndex * 13)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SwitchControl({
  checked,
  description,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean
  description?: string
  disabled?: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className={`ui-switch-control${disabled ? ' disabled' : ''}`}>
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <button
        aria-checked={checked}
        className="ui-switch"
        disabled={disabled}
        role="switch"
        type="button"
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </label>
  )
}

export type DataTableColumn<T> = {
  header: string
  key: string
  render: (item: T) => ReactNode
}

export function DataTable<T>({
  columns,
  emptyState,
  getRowKey,
  isLoading = false,
  rows,
}: {
  columns: Array<DataTableColumn<T>>
  emptyState: ReactNode
  getRowKey: (item: T) => string
  isLoading?: boolean
  rows: T[]
}) {
  return (
    <div className="ui-table-wrap">
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {isLoading && (
        <div className="ui-table-loading">
          <SkeletonRows columns={columns.length} rows={3} />
        </div>
      )}
      {!isLoading && rows.length === 0 && (
        <div className="ui-table-empty">{emptyState}</div>
      )}
    </div>
  )
}

export function PaginationControls<T>({
  onPageChange,
  state,
}: {
  onPageChange: (page: number) => void
  state: PaginationState<T>
}) {
  return (
    <div className="ui-pagination" aria-label="Phân trang">
      <span>{state.rangeLabel}</span>
      <div>
        <button
          aria-label="Trang trước"
          disabled={!state.hasPrevious}
          type="button"
          onClick={() => onPageChange(state.currentPage - 1)}
        >
          <ChevronLeft aria-hidden="true" size={16} />
        </button>
        <strong>
          {state.currentPage}/{state.totalPages}
        </strong>
        <button
          aria-label="Trang sau"
          disabled={!state.hasNext}
          type="button"
          onClick={() => onPageChange(state.currentPage + 1)}
        >
          <ChevronRight aria-hidden="true" size={16} />
        </button>
      </div>
    </div>
  )
}

export type ToastItem = {
  id: string
  message: string
  title: string
  tone?: Tone
}

export function ToastViewport({
  onDismiss,
  toasts,
}: {
  onDismiss: (id: string) => void
  toasts: ToastItem[]
}) {
  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="ui-toast-viewport" aria-live="polite">
      {toasts.map((toast) => (
        <div className={`ui-toast tone-${toast.tone ?? 'info'}`} key={toast.id}>
          <CheckCircle2 aria-hidden="true" size={18} />
          <div>
            <strong>{toast.title}</strong>
            <p>{toast.message}</p>
          </div>
          <button
            aria-label="Đóng thông báo"
            type="button"
            onClick={() => onDismiss(toast.id)}
          >
            <X aria-hidden="true" size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}
