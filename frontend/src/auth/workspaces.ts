import type { UserRole } from '../api/auth'

export type WorkspaceConfig = {
  role: UserRole
  title: string
  eyebrow: string
  focus: string
  primaryActions: string[]
}

const WORKSPACE_CONFIG: Record<UserRole, WorkspaceConfig> = {
  system_admin: {
    role: 'system_admin',
    title: 'Không gian Owner',
    eyebrow: 'Thiết lập hệ thống',
    focus: 'Tạo tổ chức mới và mời Admin đầu tiên cho từng tổ chức.',
    primaryActions: [
      'Tạo tổ chức',
      'Mời Admin tổ chức',
      'Theo dõi tenant',
    ],
  },
  admin: {
    role: 'admin',
    title: 'Không gian Admin',
    eyebrow: 'Kiểm duyệt',
    focus: 'Duyệt lesson trước khi xuất bản cho sinh viên.',
    primaryActions: [
      'Hàng đợi duyệt',
      'Cảnh báo citation',
      'Duyệt và xuất bản',
      'Yêu cầu chỉnh sửa',
    ],
  },
  teacher: {
    role: 'teacher',
    title: 'Không gian Giảng viên',
    eyebrow: 'Thiết kế bài giảng',
    focus: 'Tạo khóa học, lớp học và rà soát Lesson Studio theo từng khối nội dung.',
    primaryActions: [
      'Tạo khóa học',
      'Tạo lớp',
      'Thêm sinh viên',
      'Mở Lesson Studio',
    ],
  },
  student: {
    role: 'student',
    title: 'Không gian Sinh viên',
    eyebrow: 'Lesson đã xuất bản',
    focus: 'Xem lesson đã xuất bản trong lớp mình được thêm vào.',
    primaryActions: [
      'Lớp của tôi',
      'Tài liệu ngữ cảnh',
      'Lesson đã xuất bản',
      'Chế độ đọc',
      'Trình chiếu/PDF',
    ],
  },
}

export function getWorkspaceConfig(role: UserRole): WorkspaceConfig {
  return WORKSPACE_CONFIG[role]
}
