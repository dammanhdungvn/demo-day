# TeachFlow AI - Frontend Design PNG V2

Mục tiêu: mỗi page frontend có đúng một ảnh design PNG riêng. Các page được chọn theo chức năng đang tồn tại trong `frontend/src/workspacePages.ts` và `frontend/src/App.tsx`.

## Page chung

- `teachflow-login-role-selection-design-v2.png`: Login page trong `App.tsx`, gồm chọn role demo và form đăng nhập.

## Admin

- `admin/system-admin-organization-management-design-v2.png`: `system-organizations`, quản lý organization/tenant.
- `admin/system-admin-organization-admin-invite-design-v2.png`: `system-admin-invites`, mời Admin đầu tiên cho organization.
- `admin/admin-lesson-review-queue-design-v2.png`: `admin-review`, duyệt bài học trước khi publish.
- `admin/admin-ai-knowledge-library-design-v2.png`: `admin-knowledge`, quản lý kho tri thức dài hạn hidden cho AI.
- `admin/admin-teacher-student-management-design-v2.png`: `admin-users`, quản lý Teacher/Student bằng table.
- `admin/admin-ai-job-monitoring-design-v2.png`: `admin-jobs`, theo dõi tác vụ xử lý tài liệu/AI.

## Teacher

- `teacher/teacher-dashboard-overview-design-v2.png`: `teacher-overview`, tổng quan workflow và bước tiếp theo.
- `teacher/teacher-course-class-management-design-v2.png`: `teacher-setup`, quản lý khóa học, lớp và Student.
- `teacher/teacher-lesson-source-documents-design-v2.png`: `teacher-documents`, upload/chọn tài liệu nguồn cho bài giảng.
- `teacher/teacher-lesson-outline-builder-design-v2.png`: `teacher-outline`, tạo/chỉnh dàn ý bài giảng.
- `teacher/teacher-lesson-studio-editor-design-v2.png`: `teacher-studio`, review, chỉnh sửa, approve và submit lesson.
- `teacher/teacher-processing-job-center-design-v2.png`: `teacher-jobs`, theo dõi tác vụ upload/generation của Teacher.

## Student

- `student/student-my-classes-dashboard-design-v2.png`: `student-classes`, lớp của tôi và tiếp tục học.
- `student/student-lesson-reader-ai-tutor-design-v2.png`: `student-lessons`, đọc lesson và hỏi AI Tutor có citation.
- `student/student-practice-quiz-self-check-design-v2.png`: `student-practice`, luyện tập, self-check và xem giải thích.
- `student/student-personal-documents-design-v2.png`: `student-documents`, quản lý tài liệu cá nhân ngắn hạn.
- `student/student-lesson-presentation-viewer-design-v2.png`: `LessonPresentation`, trình chiếu lesson trên web.

## Import assets được phép dùng

- `assets/teachflow-login-education-hero-asset-v2.png`: chỉ dùng cho login hero.
- `assets/lesson-photosynthesis-diagram-asset-v2.png`: dùng cho Lesson, Studio hoặc Presentation khi cần minh họa bài học.

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
