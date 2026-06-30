import { type FormEvent, useState } from 'react'
import {
  ArchiveX,
  FileText,
  Library,
  RefreshCcw,
  Save,
  UploadCloud,
} from 'lucide-react'
import {
  ingestUrlDocument,
  uploadDocument,
  type DocumentUploadResponse,
  type SourceDocument,
} from '../../api/learning'
import { getErrorMessage } from '../../errors'
import { documentUploadStatusMessage } from '../../uploadStatus'
import {
  documentGovernanceLabels,
  documentStatusLabel,
  isSourceDocumentUsable,
} from './knowledgeHelpers'

export function DocumentStatusList({
  documents,
  onArchive,
  onTitleChange,
  onReindex,
  onSaveTitle,
  busyDocumentId,
  busyTitleDocumentId,
  busyReindexDocumentId,
  titleDrafts,
}: {
  documents: SourceDocument[]
  onArchive?: (document: SourceDocument) => void
  onTitleChange?: (document: SourceDocument, title: string) => void
  onReindex?: (document: SourceDocument) => void
  onSaveTitle?: (document: SourceDocument) => void
  busyDocumentId?: string | null
  busyTitleDocumentId?: string | null
  busyReindexDocumentId?: string | null
  titleDrafts?: Record<string, string>
}) {
  return (
    <div className="document-list">
      {documents.map((document) => {
        const governanceLabels = documentGovernanceLabels(document)
        return (
          <article
            className={`document-row document-row-readonly document-row-with-actions${
              document.is_active ? '' : ' disabled'
            }`}
            key={document.id}
          >
            <FileText aria-hidden="true" size={18} />
            <span>
              {onTitleChange && onSaveTitle ? (
                <input
                  aria-label={`Tên tài liệu ${document.title}`}
                  className="document-title-input"
                  disabled={!document.is_active || busyTitleDocumentId === document.id}
                  value={titleDrafts?.[document.id] ?? document.title}
                  onChange={(event) => onTitleChange(document, event.target.value)}
                />
              ) : (
                <strong>{document.title}</strong>
              )}
              <small>{document.file_name}</small>
              {governanceLabels.length ? (
                <small className="document-governance">
                  {governanceLabels.join(' · ')}
                </small>
              ) : null}
            </span>
            <em>{documentStatusLabel(document)}</em>
            {onSaveTitle ? (
              <button
                aria-label={`Lưu tên ${document.title}`}
                className="document-action-button"
                disabled={!document.is_active || busyTitleDocumentId === document.id}
                title="Lưu tên tài liệu"
                type="button"
                onClick={() => onSaveTitle(document)}
              >
                <Save aria-hidden="true" size={16} />
              </button>
            ) : null}
            {onReindex ? (
              <button
                aria-label={`Re-index ${document.title}`}
                className="document-action-button"
                disabled={
                  !isSourceDocumentUsable(document) ||
                  busyReindexDocumentId === document.id
                }
                title="Re-index document"
                type="button"
                onClick={() => onReindex(document)}
              >
                <RefreshCcw aria-hidden="true" size={16} />
              </button>
            ) : null}
            {onArchive ? (
              <button
                aria-label={`Archive ${document.title}`}
                className="document-action-button"
                disabled={!document.is_active || busyDocumentId === document.id}
                title="Archive document"
                type="button"
                onClick={() => onArchive(document)}
              >
                <ArchiveX aria-hidden="true" size={16} />
              </button>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

export function KnowledgeUploadPanel({
  token,
  onUploaded,
  idleMessage = 'Chưa chọn file PDF.',
  pdfLabel = 'Upload PDF',
  submitLabel = 'Upload tài liệu',
  uploadingLabel = 'Đang upload...',
  urlLabel = 'Ingest URL',
  urlSubmitLabel = 'Ingest URL',
  ingestingUrlLabel = 'Đang ingest...',
}: {
  token: string
  onUploaded: (response: DocumentUploadResponse) => void | Promise<void>
  idleMessage?: string
  pdfLabel?: string
  submitLabel?: string
  uploadingLabel?: string
  urlLabel?: string
  urlSubmitLabel?: string
  ingestingUrlLabel?: string
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [statusMessage, setStatusMessage] = useState(idleMessage)
  const [isUploading, setIsUploading] = useState(false)
  const [isIngestingUrl, setIsIngestingUrl] = useState(false)

  async function handleUploadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget

    if (!selectedFile) {
      setStatusMessage('Chọn file PDF trước khi upload.')
      return
    }

    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setStatusMessage('Chỉ hỗ trợ upload file PDF.')
      return
    }

    setIsUploading(true)
    setStatusMessage('Đang upload và xếp hàng ingest tài liệu...')

    try {
      const response = await uploadDocument(selectedFile, token)
      await onUploaded(response)
      setStatusMessage(documentUploadStatusMessage(response))
      setSelectedFile(null)
      form.reset()
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error, 'Không upload được tài liệu'))
    } finally {
      setIsUploading(false)
    }
  }

  async function handleUrlSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const url = sourceUrl.trim()
    if (!url) {
      setStatusMessage('Nhập URL trước khi ingest.')
      return
    }

    setIsIngestingUrl(true)
    setStatusMessage('Đang ingest URL...')
    try {
      const response = await ingestUrlDocument({ url }, token)
      await onUploaded(response)
      setStatusMessage(documentUploadStatusMessage(response))
      setSourceUrl('')
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error, 'Không ingest được URL'))
    } finally {
      setIsIngestingUrl(false)
    }
  }

  return (
    <div className="knowledge-ingest-stack">
      <form className="upload-panel" onSubmit={handleUploadSubmit}>
        <label className="field">
          <span>{pdfLabel}</span>
          <input
            accept="application/pdf,.pdf"
            disabled={isUploading || isIngestingUrl}
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              setSelectedFile(file)
              setStatusMessage(file ? file.name : idleMessage)
            }}
          />
        </label>
        <button
          className="primary-button"
          disabled={isUploading || isIngestingUrl || !selectedFile}
          type="submit"
        >
          <UploadCloud aria-hidden="true" size={17} />
          {isUploading ? uploadingLabel : submitLabel}
        </button>
      </form>
      <form className="upload-panel url-ingest-panel" onSubmit={handleUrlSubmit}>
        <label className="field">
          <span>{urlLabel}</span>
          <input
            disabled={isUploading || isIngestingUrl}
            placeholder="https://docs.example.edu/lesson"
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
          />
        </label>
        <button
          className="primary-button"
          disabled={isUploading || isIngestingUrl || !sourceUrl.trim()}
          type="submit"
        >
          <Library aria-hidden="true" size={17} />
          {isIngestingUrl ? ingestingUrlLabel : urlSubmitLabel}
        </button>
      </form>
      <p className="form-hint">
        Tài liệu upload hoặc URL ingest sẽ xuất hiện trong danh sách nguồn bên dưới
        sau khi xử lý xong.
      </p>
      <p className="state-panel compact-state">{statusMessage}</p>
    </div>
  )
}
