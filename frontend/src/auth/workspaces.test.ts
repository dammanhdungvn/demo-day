import { describe, expect, it } from 'vitest'

import type { UserRole } from '../api/auth'
import { getWorkspaceConfig } from './workspaces'

describe('role workspace config', () => {
  it.each([
    ['system_admin', 'Không gian Owner'],
    ['admin', 'Không gian Admin'],
    ['teacher', 'Không gian Giảng viên'],
    ['student', 'Không gian Sinh viên'],
  ] satisfies Array<[UserRole, string]>)(
    'routes %s role to the expected dashboard copy',
    (role, title) => {
      expect(getWorkspaceConfig(role).title).toBe(title)
    },
  )

  it('keeps admin moderation controls out of the student workspace', () => {
    const studentActions = getWorkspaceConfig('student').primaryActions

    expect(studentActions).not.toContain('Duyệt và xuất bản')
    expect(studentActions).not.toContain('Yêu cầu chỉnh sửa')
  })
})
