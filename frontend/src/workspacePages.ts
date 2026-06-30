import type { UserRole } from './api/auth'

export type WorkspacePageId =
  | 'system-organizations'
  | 'system-admin-invites'
  | 'teacher-overview'
  | 'teacher-setup'
  | 'teacher-documents'
  | 'teacher-outline'
  | 'teacher-studio'
  | 'teacher-jobs'
  | 'admin-review'
  | 'admin-knowledge'
  | 'admin-users'
  | 'student-classes'
  | 'student-lessons'
  | 'student-practice'
  | 'student-documents'

export type WorkspacePage = {
  id: WorkspacePageId
  label: string
  description: string
}

const WORKSPACE_PAGES: Record<UserRole, WorkspacePage[]> = {
  system_admin: [
    {
      id: 'system-organizations',
      label: 'Tổ chức',
      description: 'Tạo và theo dõi organization trên platform.',
    },
    {
      id: 'system-admin-invites',
      label: 'Mời Admin',
      description: 'Mời Admin đầu tiên cho từng organization.',
    },
  ],
  admin: [
    {
      id: 'admin-review',
      label: 'Hàng đợi duyệt',
      description: 'Duyệt, trả chỉnh sửa hoặc xuất bản lesson.',
    },
    {
      id: 'admin-knowledge',
      label: 'Kho tri thức',
      description: 'Quản lý library dài hạn hidden cho AI.',
    },
    {
      id: 'admin-users',
      label: 'Người dùng',
      description: 'Mời, lọc và tạm khóa Teacher/Student trong organization.',
    },
  ],
  teacher: [
    {
      id: 'teacher-overview',
      label: 'Tổng quan',
      description: 'Trạng thái workflow và bước tiếp theo.',
    },
    {
      id: 'teacher-setup',
      label: 'Khóa học & lớp',
      description: 'Tạo course, class và thêm Student.',
    },
    {
      id: 'teacher-documents',
      label: 'Tài liệu',
      description: 'Upload/chọn tài liệu dùng để soạn bài.',
    },
    {
      id: 'teacher-outline',
      label: 'Dàn ý',
      description: 'Tạo và chỉnh dàn ý bài giảng bằng AI.',
    },
    {
      id: 'teacher-studio',
      label: 'Lesson Studio',
      description: 'Review, chỉnh sửa, approve và submit lesson.',
    },
    {
      id: 'teacher-jobs',
      label: 'Hàng đợi xử lý',
      description: 'Theo dõi xử lý tài liệu và generation jobs.',
    },
  ],
  student: [
    {
      id: 'student-classes',
      label: 'Lớp của tôi',
      description: 'Xem lớp, tiếp tục học và ôn tập cá nhân.',
    },
    {
      id: 'student-lessons',
      label: 'Lesson',
      description: 'Đọc lesson đã publish và hỏi AI Tutor có citation.',
    },
    {
      id: 'student-practice',
      label: 'Luyện tập',
      description: 'Làm quiz, assignment và self-check.',
    },
    {
      id: 'student-documents',
      label: 'Tài liệu cá nhân',
      description: 'Upload tài liệu ngữ cảnh ngắn hạn của riêng bạn.',
    },
  ],
}

const ACTION_PAGE_TARGETS: Record<UserRole, Record<string, WorkspacePageId>> = {
  system_admin: {
    'Tạo tổ chức': 'system-organizations',
    'Mời Admin tổ chức': 'system-admin-invites',
    'Theo dõi tenant': 'system-organizations',
  },
  admin: {
    'Hàng đợi duyệt': 'admin-review',
    'Cảnh báo citation': 'admin-review',
    'Duyệt và xuất bản': 'admin-review',
    'Yêu cầu chỉnh sửa': 'admin-review',
    'Nguồn dẫn': 'admin-knowledge',
    'Xuất bản': 'admin-review',
    'Tạo tài khoản': 'admin-users',
    'Người dùng': 'admin-users',
  },
  teacher: {
    'Tổng quan': 'teacher-overview',
    'Tạo course': 'teacher-setup',
    'Tạo khóa học': 'teacher-setup',
    'Tạo lớp': 'teacher-setup',
    'Thêm sinh viên': 'teacher-setup',
    'Thiết lập course/lớp': 'teacher-setup',
    'Thiết lập khóa học/lớp': 'teacher-setup',
    'Tài liệu/RAG': 'teacher-documents',
    'Tài liệu soạn bài': 'teacher-documents',
    'Tài liệu ngữ cảnh': 'teacher-documents',
    'Thêm hoặc chọn tài liệu': 'teacher-documents',
    'Tạo dàn ý': 'teacher-outline',
    'Dàn ý bài giảng': 'teacher-outline',
    'Tạo lesson từ dàn ý': 'teacher-outline',
    'Tạo nội dung bài giảng': 'teacher-outline',
    'Mở Lesson Studio': 'teacher-studio',
    'Lesson Studio': 'teacher-studio',
    'Gửi duyệt': 'teacher-studio',
    'Xem trạng thái duyệt': 'teacher-studio',
    'Xem tiến độ học': 'teacher-overview',
    'Hàng đợi xử lý': 'teacher-jobs',
  },
  student: {
    'Lớp của tôi': 'student-classes',
    'Tài liệu ngữ cảnh': 'student-documents',
    'Lesson đã xuất bản': 'student-lessons',
    'Luyện tập': 'student-practice',
    'Chế độ đọc': 'student-lessons',
    'Trình chiếu/PDF': 'student-lessons',
  },
}

export function getWorkspacePages(role: UserRole): WorkspacePage[] {
  return WORKSPACE_PAGES[role]
}

export function getDefaultWorkspacePage(role: UserRole): WorkspacePageId {
  return WORKSPACE_PAGES[role][0].id
}

export function isWorkspacePageForRole(
  role: UserRole,
  pageId: string,
): pageId is WorkspacePageId {
  return WORKSPACE_PAGES[role].some((page) => page.id === pageId)
}

export function getWorkspacePage(
  role: UserRole,
  pageId: string,
): WorkspacePage {
  return (
    WORKSPACE_PAGES[role].find((page) => page.id === pageId) ??
    WORKSPACE_PAGES[role][0]
  )
}

export function getWorkspacePageForAction(
  role: UserRole,
  label: string,
): WorkspacePageId {
  return ACTION_PAGE_TARGETS[role][label] ?? getDefaultWorkspacePage(role)
}
