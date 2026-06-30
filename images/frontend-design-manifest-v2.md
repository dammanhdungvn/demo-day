# TeachFlow AI - Frontend Design PNG V2

Mục tiêu: mỗi page frontend có đúng một ảnh design PNG riêng. Các page được chọn theo chức năng đang tồn tại trong `frontend/src/workspacePages.ts` và `frontend/src/App.tsx`.

## Page chung

- `login-page-web-design-v2.png`: Login page trong `App.tsx`.

## Admin

- `admin/system-organizations-page-web-design-v2.png`: `system-organizations`.
- `admin/system-admin-invites-page-web-design-v2.png`: `system-admin-invites`.
- `admin/review-page-web-design-v2.png`: `admin-review`.
- `admin/knowledge-page-web-design-v2.png`: `admin-knowledge`.
- `admin/users-page-web-design-v2.png`: `admin-users`.
- `admin/jobs-page-web-design-v2.png`: `admin-jobs`.

## Teacher

- `teacher/overview-page-web-design-v2.png`: `teacher-overview`.
- `teacher/setup-page-web-design-v2.png`: `teacher-setup`.
- `teacher/documents-page-web-design-v2.png`: `teacher-documents`.
- `teacher/outline-page-web-design-v2.png`: `teacher-outline`.
- `teacher/studio-page-web-design-v2.png`: `teacher-studio`.
- `teacher/jobs-page-web-design-v2.png`: `teacher-jobs`.

## Student

- `student/classes-page-web-design-v2.png`: `student-classes`.
- `student/lessons-page-web-design-v2.png`: `student-lessons`.
- `student/practice-page-web-design-v2.png`: `student-practice`.
- `student/documents-page-web-design-v2.png`: `student-documents`.
- `student/lesson-presentation-page-web-design-v2.png`: `LessonPresentation`.

## Import assets được phép dùng

- `assets/login-education-hero-asset-v2.png`: chỉ dùng cho login hero.
- `assets/photosynthesis-lesson-diagram-asset-v2.png`: dùng cho Lesson, Studio hoặc Presentation khi cần minh họa bài học.

Không tạo thêm import image cho table, toolbar, action button, status, pagination, toast, skeleton hoặc empty state. Các phần đó nên triển khai bằng component, icon và CSS.

## Icon system

- Dùng cùng một hệ icon trên toàn bộ app, ưu tiên lucide-style.
- Sidebar icon phải đồng bộ giữa role:
  - Home/Tổng quan: home.
  - Course/Class/User group: graduation/users.
  - Document/Knowledge: file/book/library.
  - Review/Practice/Approval: clipboard-check.
  - Jobs/Processing: monitor/play hoặc checklist.
  - Settings/System: shield/settings.
- Action icon phải thống nhất:
  - Add: plus.
  - Edit: pencil.
  - Delete: trash.
  - Lock/disable: lock.
  - Retry/reindex: rotate.
  - Cancel: x-circle.
  - View/detail: eye.
  - Upload: upload.
  - Publish/send: send.
- Tránh dùng emoji thay thế icon nếu icon đã rõ nghĩa. Emoji chỉ dùng cho trạng thái học tập nhẹ, không dùng lẫn lộn giữa các role cho cùng một ý nghĩa.

## UI copy

- Giữ text ngắn, không dùng đoạn mô tả dài trong page chính.
- Các button thêm/sửa/xóa/xem/lặp lại/hủy nên là icon-only có tooltip hoặc aria-label khi code.
- Bảng quản trị dùng table-first; không đổi thành card grid nếu không có lý do sản phẩm rõ.

## Ghi chú

Text nhỏ trong ảnh do Image Gen tạo có thể sai ký tự. Khi code frontend, lấy label thật từ source React/TypeScript, còn ảnh PNG dùng làm visual direction.
