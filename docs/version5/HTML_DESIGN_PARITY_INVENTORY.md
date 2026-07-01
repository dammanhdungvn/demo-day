# HTML Design Parity Inventory

Ngay cap nhat: 2026-07-01.

Muc dich: file nay la danh sach bat buoc cho viec chuyen design HTML trong `images/` sang React TSX. Muc tieu hien tai cua user uu tien toan bo `.html` trong `images/`, vi vay inventory nay thay the cach hieu cu chi map mot tap con design.

Quy uoc status:

- `done`: da co React runtime page/section va API/data that tu backend hien co.
- `in-progress`: dang code trong V4-052.
- `gap`: chua co page React hoac backend/API contract can bo sung.
- `audit`: can xac minh lai bang rendered QA va API test.

## Design Normalization Rules

HTML trong `images/` la source-of-truth ve page/function/content, nhung prototype hien co chua dong bo ve kich thuoc, icon, ngon ngu va spacing. Khi chuyen sang React TSX, ap dung cac rule sau:

- Ngon ngu UI runtime dung tieng Viet thong nhat. Cac label tieng Anh trong HTML nhu `Overview`, `Content Library`, `Users`, `Tasks`, `Reports`, `Settings`, `Support` duoc normalize thanh `Tong quan`, `Kho bai giang`, `Nguoi dung`, `Tac vu`, `Bao cao`, `Cai dat`, `Ho tro` neu khong phai thuat ngu product bat buoc.
- Icon runtime dung lucide/react icon system hien co; khong copy inline SVG/emoji/icon prototype neu lam lech visual system.
- Target chinh la desktop webapp: shell phai fit tot o 1440px, content khong overflow ngang, table/card co kich thuoc on dinh, section khong bi cat do HTML prototype thieu viewport.
- Responsive van bat buoc: khi width nho hon desktop, layout stack co trat tu ro, text khong overlap/clip.
- Khong copy fake/sample business data tu HTML. Neu database/API chua co du lieu, hien empty state va ghi API gap.
- Khong phuc hoi demo login. Login design chi giu visual/content phu hop voi real-account auth.
- Cac file co hau to `part1`, `part2` la cac phan view/section cua cung mot feature page, khong phai duplicate. Khi map sang React, moi part phai duoc ghi ro la section nao cua page runtime; neu chua lam du chuc nang cua part do thi ghi gap/business-rule lock, khong duoc bo qua.

## Login

| HTML design | Role/page React | Status | API/data |
| --- | --- | --- | --- |
| `images/frontend-login-design.html` | Login real-account-only | done | `/auth/login`, `/auth/invite/accept`, `/health`; khong khoi phuc demo role login. |

## System Admin

| HTML design | Role/page React | Status | API/data |
| --- | --- | --- | --- |
| `images/admin/html/system-admin-organization-management-design-v2.png.html` | `system-organizations` | done | `/system/organizations`. |
| `images/admin/html/system-admin-organization-admin-invite-design-v2.html` | `system-admin-invites` | done | `/system/organizations/{id}/admin-invites`. |

## Admin

| HTML design | Role/page React | Status | API/data |
| --- | --- | --- | --- |
| `images/admin/html/overview.html` | `admin-overview` | done | Tong hop tu review queue, documents, users/jobs va `/admin/reports`; rendered QA pass bang account Admin that. |
| `images/admin/html/admin-lesson-review-queue-design-v2.html` | `admin-review` | done | `/admin/review-queue`, publish/request changes/reject APIs. |
| `images/admin/html/lession-part1.html` | `admin-lesson-library` | done | Section card gallery/kho giao an mau. Runtime dung `/admin/lesson-library` org-scoped, khong dung sample data. |
| `images/admin/html/admin-report-part1.html` | `admin-lesson-library` | done | Multi-part source cho cung kho bai giang mau/card gallery, khong phai duplicate; map vao section gallery/action cua `admin-lesson-library`. |
| `images/admin/html/admin-ai-knowledge-library-design-v2.html` | `admin-lesson-library` + `admin-knowledge` | done | Source tong hop cho library IA: card gallery cho lesson library va document governance cho knowledge. |
| `images/admin/html/admin-ai-knowledge-library-design-v2-part1.html` | `admin-lesson-library` | done | Part 1: kho bai giang mau/card gallery/filter category/create lesson CTA; runtime doc lesson list tu `/admin/lesson-library`. |
| `images/admin/html/admin-ai-knowledge-library-design-v2-part2.html` | `admin-knowledge` | done | Part 2: bang tai lieu, upload PDF/URL, status/reindex/archive va detail/health metadata; runtime doc tu `/documents`. |
| `images/admin/html/admin-teacher-student-management-design-part1.html` | `admin-users` | done | Part 1: bang user, detail/thong tin user va action edit/lock/delete-soft; runtime dung `/admin/users`, invites, user status/update. |
| `images/admin/html/admin-teacher-student-management-design-part2.html` | `admin-users` | done | Part 2: filters + bulk selection/action. Runtime da co search/role/status filter, bulk select, bulk Supabase password reset email cho active Supabase users, bulk lock/unlock va `Xoa khoi active` bang soft-disable de giu lich su hoc tap. |
| `images/admin/html/admin-ai-job-monitoring-design-v2.html` | `admin-jobs` | done | `/generation-jobs`, retry/cancel. |
| `images/admin/html/report-part1.html` | `admin-reports` | done | Part 1: report analytics, quality metrics, insights, export history. Runtime baseline co `/admin/reports` org-scoped metrics/status breakdown; export history/time-series la gap feature rieng neu can. |
| `images/admin/html/report-part2.html` | `admin-activity-log` | done | Part 2: activity/audit log table. Runtime co `/admin/activity` org-scoped lesson/document/job/audit/user/invite feed. |
| `images/admin/html/setting.html` | `admin-settings` | done | `GET/PATCH /admin/settings` luu metadata/policy an toan; khong expose secrets. |

## Teacher

| HTML design | Role/page React | Status | API/data |
| --- | --- | --- | --- |
| `images/teacher/html/teacher-dashboard-overview-design-v2.html` | `teacher-overview` | done | Courses/classes/documents/outlines/lessons/jobs APIs. |
| `images/teacher/html/teacher-course-class-management-design-v2.html` | `teacher-setup` | done | Course/class/membership APIs. |
| `images/teacher/html/teacher-lesson-source-documents-design-v2.html` | `teacher-documents` | done | Documents upload/URL/reindex/archive. |
| `images/teacher/html/teacher-lesson-outline-builder-design-v2.html` | `teacher-outline` | done | Outline generate/update/list. |
| `images/teacher/html/teacher-lesson-studio-editor-design-v2.html` | `teacher-studio` | done | Lesson generate/update/block status/submit. |
| `images/teacher/html/teacher-processing-job-center-design-v2.html` | `teacher-jobs` | done | `/generation-jobs`, retry/cancel. |

## Student

| HTML design | Role/page React | Status | API/data |
| --- | --- | --- | --- |
| `images/student/html/student-my-classes-dashboard-design-v2.html` | `student-classes` | done | `/student/classes`, `/student/lessons`, progress summary. |
| `images/student/html/student-lesson-presentation-viewer-design-v2.html` | `student-lessons` reader/tutor | done | `/student/lessons`, progress/study/tutor. |
| `images/student/html/student-lesson-presentation-viewer-design-v2-part1.html` | `student-lessons` presentation section | done | Part 1: Vietnamese presentation viewer with slide nav, citations, notes, export. Runtime uses `LessonPresentation` + progress/export APIs. |
| `images/student/html/student-lesson-presentation-viewer-design-v2-part2.html` | `student-lessons` presentation section | done | Part 2: presentation controls, fullscreen/bookmark/instructor notes/AI suggestions. Runtime covers controls/citations/progress/tutor/notes across `LessonPresentation` and Student reader. |
| `images/student/html/student-practice-quiz-self-check-design-v2.html` | `student-practice` | done | Practice item/attempt APIs. |
| `images/student/html/student-personal-documents-design-v2.html` | `student-documents` | done | Contextual document upload/export/delete APIs. |

## API Gap Notes

- Admin lesson library/reports/activity/settings baseline da co API that trong V4-052: `GET /admin/lesson-library`, `GET /admin/reports`, `GET /admin/activity`, `GET/PATCH /admin/settings`.
- Settings API chi tra metadata/policy khong nhay cam; frontend khong doc/render OpenAI/NVIDIA/Supabase secret.
- Frontend/backend API gap guard da duoc tu dong hoa trong `backend/tests/test_frontend_backend_contract.py`: test doc cac `buildApiUrl(...)` path trong `frontend/src/api/*` va doi chieu voi backend OpenAPI, normalize query string/path param.
- Real-account QA bootstrap da co script server-side `backend/scripts/bootstrap_real_accounts.py`: dry-run mac dinh, chi ghi Supabase Auth/Postgres khi operator chay `--apply`; dung `SECRET_API_KEY_SUPABASE` server-side va upsert `profiles.auth_provider=supabase`.
- Neu HTML report sau nay yeu cau export analytics lich su, dashboard time-series hoac scheduled report delivery, tach thanh feature moi thay vi hardcode vao slice parity hien tai.
- Admin users part2 baseline da co API/UI that: `PATCH /auth/users/bulk-status` cho bulk lock/unlock/soft-delete khoi active va `POST /auth/users/bulk-password-reset` gui email reset qua Supabase Auth cho active Supabase users. Hard-delete account that khong tu dong thuc hien trong slice nay; neu can xoa vinh vien phai di qua feature export-delete/revoke-session rieng de tranh mat du lieu va token cu.
- Final V4-052 QA da chay bang account Admin Supabase/Postgres that sau khi bootstrap `--apply`: Admin overview, review queue, lesson library, knowledge, users, jobs, reports, activity log va settings deu pass rendered QA 1440px; screenshots nam o `/tmp/teachflow-admin-real-qa`.
