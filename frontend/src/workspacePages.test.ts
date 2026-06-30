import { describe, expect, it } from 'vitest'

import type { UserRole } from './api/auth'
import {
  getDefaultWorkspacePage,
  getWorkspacePageForAction,
  getWorkspacePages,
} from './workspacePages'

describe('workspace page navigation', () => {
  it.each([
    ['teacher', ['Tổng quan', 'Khóa học & lớp', 'Tài liệu', 'Dàn ý', 'Lesson Studio', 'Hàng đợi xử lý']],
    ['admin', ['Hàng đợi duyệt', 'Kho tri thức', 'Người dùng']],
    ['student', ['Lớp của tôi', 'Lesson', 'Luyện tập', 'Tài liệu cá nhân']],
    ['system_admin', ['Tổ chức', 'Mời Admin']],
  ] satisfies Array<[UserRole, string[]]>)(
    'defines first-class pages for %s',
    (role, labels) => {
      expect(getWorkspacePages(role).map((page) => page.label)).toEqual(labels)
    },
  )

  it('maps workspace actions to page ids instead of scroll-only sections', () => {
    expect(getWorkspacePageForAction('teacher', 'Tài liệu soạn bài')).toBe(
      'teacher-documents',
    )
    expect(getWorkspacePageForAction('teacher', 'Lesson Studio')).toBe(
      'teacher-studio',
    )
    expect(getWorkspacePageForAction('admin', 'Nguồn dẫn')).toBe(
      'admin-knowledge',
    )
    expect(getWorkspacePageForAction('student', 'Luyện tập')).toBe(
      'student-practice',
    )
  })

  it('keeps a stable default page for each role', () => {
    expect(getDefaultWorkspacePage('teacher')).toBe('teacher-overview')
    expect(getDefaultWorkspacePage('admin')).toBe('admin-review')
    expect(getDefaultWorkspacePage('student')).toBe('student-classes')
    expect(getDefaultWorkspacePage('system_admin')).toBe('system-organizations')
  })
})
