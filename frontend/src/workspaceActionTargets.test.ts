import { describe, expect, it } from 'vitest'
import { getWorkspaceConfig } from './auth/workspaces'
import {
  getWorkspaceActionTarget,
  WORKSPACE_SECTION_IDS,
} from './workspaceActionTargets'

describe('workspace action targets', () => {
  it('maps every teacher primary action to a concrete section', () => {
    const targets = getWorkspaceConfig('teacher').primaryActions.map((action) =>
      getWorkspaceActionTarget('teacher', action),
    )

    expect(targets).toEqual([
      WORKSPACE_SECTION_IDS.teacherSetup,
      WORKSPACE_SECTION_IDS.teacherSetup,
      WORKSPACE_SECTION_IDS.teacherSetup,
      WORKSPACE_SECTION_IDS.teacherOutline,
    ])
  })

  it('maps admin review actions to moderation sections', () => {
    expect(getWorkspaceActionTarget('admin', 'Hàng đợi duyệt')).toBe(
      WORKSPACE_SECTION_IDS.adminReview,
    )
    expect(getWorkspaceActionTarget('admin', 'Nguồn dẫn')).toBe(
      WORKSPACE_SECTION_IDS.adminKnowledge,
    )
  })

  it('maps student shortcuts to readable lesson sections', () => {
    expect(getWorkspaceActionTarget('student', 'Lớp của tôi')).toBe(
      WORKSPACE_SECTION_IDS.studentClasses,
    )
    expect(getWorkspaceActionTarget('student', 'Tài liệu ngữ cảnh')).toBe(
      WORKSPACE_SECTION_IDS.studentKnowledge,
    )
    expect(getWorkspaceActionTarget('student', 'Luyện tập')).toBe(
      WORKSPACE_SECTION_IDS.studentPractice,
    )
    expect(getWorkspaceActionTarget('student', 'Trình chiếu/PDF')).toBe(
      WORKSPACE_SECTION_IDS.studentLessons,
    )
  })

  it('maps teacher contextual document shortcuts to the source section', () => {
    expect(getWorkspaceActionTarget('teacher', 'Tài liệu soạn bài')).toBe(
      WORKSPACE_SECTION_IDS.teacherKnowledge,
    )
    expect(getWorkspaceActionTarget('teacher', 'Tạo khóa học')).toBe(
      WORKSPACE_SECTION_IDS.teacherSetup,
    )
    expect(getWorkspaceActionTarget('teacher', 'Thiết lập khóa học/lớp')).toBe(
      WORKSPACE_SECTION_IDS.teacherSetup,
    )
    expect(getWorkspaceActionTarget('teacher', 'Tạo nội dung bài giảng')).toBe(
      WORKSPACE_SECTION_IDS.teacherOutline,
    )
  })

  it('keeps legacy teacher source labels routable', () => {
    expect(getWorkspaceActionTarget('teacher', 'Tài liệu/RAG')).toBe(
      WORKSPACE_SECTION_IDS.teacherKnowledge,
    )
    expect(getWorkspaceActionTarget('teacher', 'Tài liệu ngữ cảnh')).toBe(
      WORKSPACE_SECTION_IDS.teacherKnowledge,
    )
  })
})
