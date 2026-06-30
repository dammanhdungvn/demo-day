import type { UserRole } from './api/auth'

export const WORKSPACE_SECTION_IDS = {
  overview: 'workspace-overview',
  systemOrganizations: 'system-organizations',
  teacherSetup: 'teacher-setup',
  teacherKnowledge: 'teacher-knowledge',
  teacherOutline: 'teacher-outline',
  teacherLessonStudio: 'teacher-lesson-studio',
  adminReview: 'admin-review',
  adminKnowledge: 'admin-knowledge',
  studentClasses: 'student-classes',
  studentLessons: 'student-lessons',
  studentPractice: 'student-practice',
  studentKnowledge: 'student-knowledge',
} as const

const ACTION_TARGETS: Record<UserRole, Record<string, string>> = {
  system_admin: {
    'Tạo tổ chức': WORKSPACE_SECTION_IDS.systemOrganizations,
    'Mời Admin tổ chức': WORKSPACE_SECTION_IDS.systemOrganizations,
    'Theo dõi tenant': WORKSPACE_SECTION_IDS.systemOrganizations,
  },
  admin: {
    'Hàng đợi duyệt': WORKSPACE_SECTION_IDS.adminReview,
    'Cảnh báo citation': WORKSPACE_SECTION_IDS.adminReview,
    'Duyệt và xuất bản': WORKSPACE_SECTION_IDS.adminReview,
    'Yêu cầu chỉnh sửa': WORKSPACE_SECTION_IDS.adminReview,
    'Nguồn dẫn': WORKSPACE_SECTION_IDS.adminKnowledge,
    'Xuất bản': WORKSPACE_SECTION_IDS.adminReview,
  },
  teacher: {
    'Tổng quan': WORKSPACE_SECTION_IDS.overview,
    'Tạo course': WORKSPACE_SECTION_IDS.teacherSetup,
    'Tạo khóa học': WORKSPACE_SECTION_IDS.teacherSetup,
    'Tạo lớp': WORKSPACE_SECTION_IDS.teacherSetup,
    'Thêm sinh viên': WORKSPACE_SECTION_IDS.teacherSetup,
    'Thiết lập course/lớp': WORKSPACE_SECTION_IDS.teacherSetup,
    'Thiết lập khóa học/lớp': WORKSPACE_SECTION_IDS.teacherSetup,
    'Tài liệu/RAG': WORKSPACE_SECTION_IDS.teacherKnowledge,
    'Tài liệu soạn bài': WORKSPACE_SECTION_IDS.teacherKnowledge,
    'Tài liệu ngữ cảnh': WORKSPACE_SECTION_IDS.teacherKnowledge,
    'Thêm hoặc chọn tài liệu': WORKSPACE_SECTION_IDS.teacherKnowledge,
    'Tạo dàn ý': WORKSPACE_SECTION_IDS.teacherOutline,
    'Dàn ý bài giảng': WORKSPACE_SECTION_IDS.teacherOutline,
    'Tạo lesson từ dàn ý': WORKSPACE_SECTION_IDS.teacherOutline,
    'Tạo nội dung bài giảng': WORKSPACE_SECTION_IDS.teacherOutline,
    'Mở Lesson Studio': WORKSPACE_SECTION_IDS.teacherOutline,
    'Lesson Studio': WORKSPACE_SECTION_IDS.teacherLessonStudio,
    'Gửi duyệt': WORKSPACE_SECTION_IDS.teacherLessonStudio,
    'Xem trạng thái duyệt': WORKSPACE_SECTION_IDS.teacherLessonStudio,
    'Xem tiến độ học': WORKSPACE_SECTION_IDS.teacherSetup,
  },
  student: {
    'Lớp của tôi': WORKSPACE_SECTION_IDS.studentClasses,
    'Tài liệu ngữ cảnh': WORKSPACE_SECTION_IDS.studentKnowledge,
    'Lesson đã xuất bản': WORKSPACE_SECTION_IDS.studentLessons,
    'Luyện tập': WORKSPACE_SECTION_IDS.studentPractice,
    'Chế độ đọc': WORKSPACE_SECTION_IDS.studentLessons,
    'Trình chiếu/PDF': WORKSPACE_SECTION_IDS.studentLessons,
  },
}

export function getWorkspaceActionTarget(role: UserRole, label: string): string {
  return ACTION_TARGETS[role][label] ?? WORKSPACE_SECTION_IDS.overview
}
