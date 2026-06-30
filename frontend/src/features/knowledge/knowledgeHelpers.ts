import type { SourceDocument } from '../../api/learning'

export function documentStatusLabel(document: SourceDocument): string {
  if (!document.is_active) {
    return 'Đã archive'
  }

  if (document.status === 'completed') {
    return `${document.chunk_count} chunk`
  }

  return document.error_message ?? document.status
}

export function isSourceDocumentUsable(document: SourceDocument): boolean {
  return document.is_active && document.status === 'completed'
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${Math.round(bytes / (1024 * 1024))} MB`
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }
  return `${bytes} B`
}

function formatShortDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function documentGovernanceLabels(document: SourceDocument): string[] {
  const labels: string[] = []

  if (document.storage_status === 'stored') {
    labels.push('Raw lưu bền vững')
  } else if (document.storage_status === 'metadata_only') {
    labels.push('Raw metadata-only')
  } else if (document.storage_status === 'not_applicable') {
    labels.push('Nguồn web')
  }

  if (document.file_size_bytes) {
    labels.push(formatBytes(document.file_size_bytes))
  }

  if (document.quota_limit_bytes && document.quota_used_bytes !== undefined) {
    labels.push(
      `Quota ${formatBytes(document.quota_used_bytes ?? 0)}/${formatBytes(
        document.quota_limit_bytes,
      )}`,
    )
  }

  if (document.retention_expires_at) {
    labels.push(`Giữ đến ${formatShortDate(document.retention_expires_at)}`)
  } else if (document.knowledge_scope === 'library') {
    labels.push('Library do Admin giữ')
  }

  const uploadedByRole = document.provenance?.uploaded_by_role
  if (typeof uploadedByRole === 'string') {
    labels.push(`Nguồn ${uploadedByRole}`)
  }

  return labels
}
