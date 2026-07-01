import { describe, expect, it } from 'vitest'

import adminWorkspaceSource from './AdminWorkspace.tsx?raw'

describe('admin CRUD surface', () => {
  it('keeps document management as an explicit table workflow', () => {
    expect(adminWorkspaceSource).toContain('Quản lý tài liệu AI')
    expect(adminWorkspaceSource).toContain('Thêm PDF')
    expect(adminWorkspaceSource).toContain('Thêm URL')
    expect(adminWorkspaceSource).toContain('Tên tài liệu')
    expect(adminWorkspaceSource).toContain('Xóa khỏi active')
    expect(adminWorkspaceSource).toContain('Re-index')
  })

  it('keeps Teacher and Student management actions visible', () => {
    expect(adminWorkspaceSource).toContain('Thêm Teacher')
    expect(adminWorkspaceSource).toContain('Thêm Student')
    expect(adminWorkspaceSource).toContain('Sửa')
    expect(adminWorkspaceSource).toContain('Lưu')
    expect(adminWorkspaceSource).toContain('Hủy')
    expect(adminWorkspaceSource).toContain('Mở lại')
  })
})
