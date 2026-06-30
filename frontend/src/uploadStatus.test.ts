import { describe, expect, it } from 'vitest'

import { documentUploadStatusMessage } from './uploadStatus'
import type { DocumentUploadResponse } from './api/learning'

function uploadResponse(
  overrides: Partial<DocumentUploadResponse>,
): DocumentUploadResponse {
  return {
    generation_job_id: 'job-upload',
    job_status: 'completed',
    ingestion_action: 'ingested',
    document: {
      id: 'doc-upload',
      title: 'Uploaded Knowledge',
      file_name: 'uploaded-knowledge.pdf',
      file_hash: 'hash-upload',
      source_type: 'pdf',
      status: 'completed',
      chunk_count: 3,
      last_ingested_at: '2026-06-28T00:00:00+00:00',
      error_message: null,
      is_active: true,
      created_at: '2026-06-28T00:00:00+00:00',
      updated_at: '2026-06-28T00:00:00+00:00',
    },
    message: 'Upload processed.',
    ...overrides,
  }
}

describe('documentUploadStatusMessage', () => {
  it('describes new ingested documents', () => {
    expect(documentUploadStatusMessage(uploadResponse({}))).toContain('Đã ingest')
  })

  it('describes skipped unchanged documents', () => {
    expect(
      documentUploadStatusMessage(
        uploadResponse({
          job_status: 'skipped',
          ingestion_action: 'skipped',
          message: 'Document unchanged; skipped ingestion.',
        }),
      ),
    ).toContain('không đổi')
  })

  it('describes reingested changed documents', () => {
    expect(
      documentUploadStatusMessage(
        uploadResponse({
          ingestion_action: 'reingested',
          message: 'Document changed; re-ingested.',
        }),
      ),
    ).toContain('Đã re-ingest')
  })

  it('describes queued processing ingestion', () => {
    expect(
      documentUploadStatusMessage(
        uploadResponse({
          job_status: 'processing',
          document: {
            ...uploadResponse({}).document,
            status: 'processing',
            chunk_count: 0,
            last_ingested_at: null,
          },
          message: 'Document ingestion queued.',
        }),
      ),
    ).toContain('đang xử lý')
  })

  it('describes failed ingestion with re-upload retry guidance', () => {
    expect(
      documentUploadStatusMessage(
        uploadResponse({
          job_status: 'failed',
          ingestion_action: 'failed',
          document: {
            ...uploadResponse({}).document,
            status: 'failed',
            error_message: 'No extractable text found in PDF',
          },
          message: 'No extractable text found in PDF',
        }),
      ),
    ).toContain('upload lại file')
  })
})
