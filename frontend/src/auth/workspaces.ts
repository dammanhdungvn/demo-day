import type { UserRole } from '../api/auth'

export type WorkspaceConfig = {
  role: UserRole
  title: string
  eyebrow: string
  focus: string
  primaryActions: string[]
}

const WORKSPACE_CONFIG: Record<UserRole, WorkspaceConfig> = {
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
    focus: 'Tạo course, lớp học và rà soát Lesson Studio theo từng block.',
    primaryActions: [
      'Tạo course',
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
      'Lesson đã xuất bản',
      'Chế độ đọc',
      'Trình chiếu/PDF',
    ],
  },
}

export function getWorkspaceConfig(role: UserRole): WorkspaceConfig {
  return WORKSPACE_CONFIG[role]
}
