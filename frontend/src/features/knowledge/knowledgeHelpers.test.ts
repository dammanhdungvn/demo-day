import { describe, expect, it } from 'vitest'

import type { SourceDocument } from '../../api/learning'
import { documentGovernanceLabels } from './knowledgeHelpers'

function sourceDocument(overrides: Partial<SourceDocument> = {}): SourceDocument {
  return {
    id: 'doc-1',
    title: 'Context document',
    file_name: 'context.pdf',
    file_hash: 'hash-1',
    source_type: 'pdf',
    status: 'completed',
    organization_id: 'org-demo',
    knowledge_scope: 'contextual',
    owner_user_id: 'demo-teacher',
    chunk_count: 2,
    last_ingested_at: '2026-06-29T00:00:00+00:00',
    error_message: null,
    is_active: true,
    created_at: '2026-06-29T00:00:00+00:00',
    updated_at: '2026-06-29T00:00:00+00:00',
    ...overrides,
  }
}

describe('documentGovernanceLabels', () => {
  it('describes contextual retention, quota, storage and provenance', () => {
    const labels = documentGovernanceLabels(
      sourceDocument({
        file_size_bytes: 2048,
        storage_status: 'stored',
        quota_used_bytes: 2048,
        quota_limit_bytes: 1024 * 1024,
        retention_expires_at: '2026-07-29T00:00:00+00:00',
        provenance: {
          uploaded_by_role: 'teacher',
        },
      }),
    )

    expect(labels).toContain('Raw lưu bền vững')
    expect(labels).toContain('2 KB')
    expect(labels).toContain('Quota 2 KB/1 MB')
    expect(labels).toContain('Nguồn teacher')
    expect(labels.some((label) => label.startsWith('Giữ đến'))).toBe(true)
  })

  it('marks admin library documents as retained by admin policy', () => {
    expect(
      documentGovernanceLabels(
        sourceDocument({
          knowledge_scope: 'library',
          owner_user_id: null,
          storage_status: 'metadata_only',
        }),
      ),
    ).toContain('Library do Admin giữ')
  })
})
