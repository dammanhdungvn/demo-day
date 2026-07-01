import { describe, expect, it } from 'vitest'

import jobCenterSource from './JobCenter.tsx?raw'

describe('job center surface', () => {
  it('keeps the approved table-first workflow with filtering and pagination', () => {
    expect(jobCenterSource).toContain('DataTable')
    expect(jobCenterSource).toContain('PaginationControls')
    expect(jobCenterSource).toContain('Tác vụ')
    expect(jobCenterSource).toContain('Đang chạy')
    expect(jobCenterSource).toContain('Lỗi')
    expect(jobCenterSource).toContain('Xong')
    expect(jobCenterSource).toContain('Tìm...')
  })

  it('keeps retry and cancel controls icon-only with accessible labels', () => {
    expect(jobCenterSource).toContain('aria-label={`Thử lại')
    expect(jobCenterSource).toContain('aria-label={`Hủy')
    expect(jobCenterSource).toContain('title="Thử lại"')
    expect(jobCenterSource).toContain('title="Hủy"')
    expect(jobCenterSource).toContain('job-action-button')
    expect(jobCenterSource).toContain('job-detail-action-button')
    expect(jobCenterSource).not.toContain('<Spinner label="Đang thử" />')
  })
})
