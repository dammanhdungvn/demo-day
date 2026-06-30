import type { UserRole } from './api/auth'
import type {
  LessonBlock,
  LessonBlockType,
  LessonSession,
  SourceDocument,
} from './api/learning'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Quản trị viên',
  teacher: 'Giảng viên',
  student: 'Sinh viên',
}

const STUDENT_LEVEL_LABELS: Record<string, string> = {
  weak: 'Cần hỗ trợ',
  average: 'Trung bình',
  strong: 'Khá giỏi',
}

const LESSON_STATUS_LABELS: Record<LessonSession['status'], string> = {
  teacher_reviewing: 'Giảng viên đang rà soát',
  submitted_for_admin_review: 'Chờ Admin duyệt',
  changes_requested: 'Admin yêu cầu chỉnh sửa',
  admin_rejected: 'Admin từ chối',
  published: 'Đã xuất bản',
}

const BLOCK_STATUS_LABELS: Record<LessonBlock['status'], string> = {
  needs_review: 'Cần rà soát',
  approved: 'Đã duyệt',
  approved_with_warning: 'Duyệt kèm cảnh báo',
  rejected: 'Cần sửa',
}

const BLOCK_TYPE_LABELS: Record<LessonBlockType, string> = {
  learning_objectives: 'Mục tiêu học tập',
  concept_explanation: 'Giải thích khái niệm',
  analogy_or_example: 'Ví dụ minh họa',
  code_example: 'Ví dụ code',
  teaching_activity: 'Hoạt động giảng dạy',
  quiz: 'Câu hỏi kiểm tra',
  assignment: 'Bài tập',
  common_misconception: 'Hiểu lầm thường gặp',
  visual_diagram: 'Sơ đồ trực quan',
  slide: 'Slide trình bày',
}

function fallbackLabel(value: string): string {
  return value.replaceAll('_', ' ')
}

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role]
}

export function displayName(name: string): string {
  const demoNames: Record<string, string> = {
    'Admin Demo': 'Quản trị viên Demo',
    'Teacher Demo': 'Giảng viên Demo',
    'Student Demo': 'Sinh viên Demo',
  }

  return demoNames[name] ?? name
}

export function studentLevelLabel(level: string): string {
  return STUDENT_LEVEL_LABELS[level] ?? fallbackLabel(level)
}

export function lessonStatusLabel(status: LessonSession['status']): string {
  return LESSON_STATUS_LABELS[status]
}

export function blockStatusLabel(status: LessonBlock['status']): string {
  return BLOCK_STATUS_LABELS[status]
}

export function blockTypeLabel(type: LessonBlockType): string {
  return BLOCK_TYPE_LABELS[type]
}

export function documentStatusLabel(document: SourceDocument): string {
  if (!document.is_active) {
    return 'Đã archive'
  }
  if (document.status === 'completed') {
    return `${document.chunk_count} chunks`
  }
  if (document.status === 'failed') {
    return 'Lỗi ingest'
  }
  return 'Đang xử lý'
}
