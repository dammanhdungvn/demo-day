# Production Readiness Audit - V4-050

Ngay audit: 2026-07-01

## Ket Luan

TeachFlow AI da du evidence de ket luan goal user ve design `images`, fullstack integration, API gap audit va production readiness check da hoan thanh cho pham vi webapp desktop-first hien tai.

Khong phat hien backend/API gap P0 moi sau khi doi chieu frontend runtime voi FastAPI routes va repository/database paths. Cac thieu sot con lai duoc phan loai la future enhancement/accepted debt, khong chan demo production hoac pilot cho small training center/department neu `.env`, Supabase/Postgres va AI provider duoc cau hinh dung.

Update V4-052: real-account gate da pass sau khi bootstrap account Supabase Auth/Postgres that va chay rendered QA Admin bang account Admin that. Khong con blocker P0 cho 4 yeu cau user goal hien tai.

## Pham Vi Design

Source-of-truth design mapping la `images/frontend-design-manifest-v2.md`, trong do moi page frontend hien co co mot PNG design rieng theo `frontend/src/workspacePages.ts` va `frontend/src/App.tsx`.

Da cover:

- Login: `images/frontend-login-design.html`, `teachflow-login-role-selection-design-v2.png`, asset runtime `frontend/src/assets/teachflow-login-education-hero-asset-v2.png`.
- System Admin: organization management va organization admin invite surfaces.
- Admin: review queue, knowledge library, Teacher/Student management, AI job monitoring.
- Teacher: overview, course/class setup, source documents, outline builder, lesson studio, processing job center.
- Student: my classes, lesson reader + AI tutor, practice/self-check, personal documents.
- Presentation: `LessonPresentation` cho web presentation/PDF flow.

HTML/PNG prototype khong duoc import runtime; UI da chuyen thanh React/CSS code-native va lucide icons. Static check khong tim thay frontend runtime dung CDN/prototype image:

- `rg -n "tailwindcss.com|unpkg.com|cdn.jsdelivr|images/.+\\.png|teacher-dashboard-overview-design-v2|student-my-classes-dashboard-design-v2|admin-ai-job-monitoring-design-v2|teachflow-login-role-selection-design-v2" frontend/src`
- Ket qua chi con negative assertions trong tests, khong co runtime import.

Runtime marker evidence:

- `login-layout` trong `frontend/src/App.tsx`.
- `teacher-design-*` trong `frontend/src/features/teacher/TeacherWorkspace.tsx`.
- `student-design-*` trong `frontend/src/features/student/StudentWorkspace.tsx`.
- `job-center-shell` trong `frontend/src/features/jobs/JobCenter.tsx`.
- `LessonPresentation` trong `frontend/src/presentation/LessonPresentation.tsx`.

Rendered QA da co evidence trong feature truoc:

- V4-048: login/Admin desktop screenshots va `./init.sh` pass.
- V4-049: Teacher/Student desktop 1440x1000 screenshots, `horizontalOverflow false`, markers present.
- V2-014: Teacher/Admin Job Center desktop screenshots va retry/cancel action QA.
- V4-052: Admin real-account rendered QA 1440px pass cho overview, review queue, lesson library, knowledge, users, jobs, reports, activity log va settings; screenshots o `/tmp/teachflow-admin-real-qa`.

## Fullstack/API Coverage

Frontend dung API client that qua `frontend/src/api/auth.ts`, `frontend/src/api/learning.ts`, `frontend/src/api/health.ts`, goi `buildApiUrl(...)` va doc backend URL tu config/env abstraction. Static check khong thay hardcode backend URL hoac frontend secret:

- `rg -n "localhost:3000/api/v1|OPENAI_API_KEY|NVIDIA_OPENAI_API_KEY|SECRET_API_KEY_SUPABASE" frontend/src`
- Ket qua: no match.

Backend route inventory xac nhan cac workflow chinh da co `/api/v1`:

- Auth/session/invite/user management/system owner: `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/invites`, `/auth/invites/accept`, `/auth/users`, `/system/organizations`, `/system/organizations/{organization_id}/admin-invites`, `/me`. Demo endpoints ton tai de regression opt-in nhung khong la login path production khi `ENABLE_DEMO_LOGIN=false`.
- Teacher learning: `/courses`, `/courses/{course_id}/classes`, `/classes/{class_id}`, `/classes/{class_id}/students`, `/students`, `/teacher/lessons`, `/teacher/classes/{class_id}/progress`.
- Knowledge/RAG/documents: `/documents`, `/documents/upload`, `/documents/ingest-url`, `/documents/{document_id}`, `/documents/{document_id}/archive`, `/documents/{document_id}/reindex`, `/rag/retrieve`.
- AI lesson flow: `/outlines`, `/outlines/generate`, `/outlines/{outline_id}/sessions/{session_index}`, `/lessons/generate`, `/lesson-blocks/{block_id}`, `/lesson-blocks/{block_id}/status`, `/lesson-blocks/{block_id}/regenerate`, `/lessons/{lesson_id}`, `/lessons/{lesson_id}/submit`.
- Admin moderation: `/admin/review-queue`, `/admin/lessons/{lesson_id}/publish`, `/admin/lessons/{lesson_id}/request-changes`, `/admin/lessons/{lesson_id}/reject`, `/admin/dashboard`.
- Student learning: `/student/classes`, `/student/lessons`, `/student/lessons/{lesson_id}`, `/student/lessons/{lesson_id}/progress`, `/student/lessons/{lesson_id}/study-state`, `/student/lessons/{lesson_id}/practice-attempts/{block_id}`, `/student/lessons/{lesson_id}/tutor`, `/student/study-review`, `/student/practice-items`, `/student/dashboard`.
- Exports/audit/jobs: `/lessons/{lesson_id}/audit-events`, `/lessons/{lesson_id}/exports`, `/generation-jobs`, `/generation-jobs/{job_id}/retry`, `/generation-jobs/{job_id}/cancel`.

Ket luan API gap: khong can them backend endpoint trong V4-050. V4-049 da audit Teacher/Student action, V2-014 da dong gap Job Center retry/cancel.

## Database/Persistence Coverage

Project co memory fallback cho local test va Postgres/Supabase repository path cho production:

- Auth/tenant/user/invite: `PostgresAuthRepository`, schema `organizations`, `profiles`, `organization_invites`.
- Learning: `PostgresLearningRepository`, schema `courses`, `classes`, `class_students`.
- Content: `PostgresContentRepository`, schema `course_outlines`, `outline_sessions`, `lesson_sessions`, `lesson_blocks`.
- Knowledge: `SupabaseKnowledgeRepository`, schema documents/chunks/jobs path va storage governance.
- Jobs: `PostgresGenerationJobRepository`, schema `generation_jobs`.
- Audit: `PostgresAuditEventRepository`, schema `audit_events`.
- Progress: `PostgresProgressRepository`, schema `lesson_progress`.
- Study/practice: `PostgresStudyRepository`, schema `lesson_study_state`, `lesson_practice_attempts`.
- Exports: `PostgresLessonExportRepository`, schema `lesson_export_records`.

Schema helpers enable RLS va revoke grants tu `anon/authenticated` cho cac table app-owned; backend service/repository layer enforce role, organization, ownership va class membership.

## Verification Evidence

Da chay trong V4-050:

- Baseline `./init.sh`: pass frontend typecheck/lint, 21 files/104 tests, build; backend 221 tests.
- `python3 -m json.tool feature_list.json`: pass.
- `git diff --check`: pass.
- Secret/backend URL static check frontend: no match.
- Prototype/CDN runtime static check frontend: no runtime match, chi co negative assertions trong tests.
- Runtime marker static check: login, teacher, student, job center va presentation markers present.
- Backend route inventory va frontend API inventory: cac endpoint/action chinh co mapping.
- Repository/schema inventory: Postgres/Supabase paths co cho auth, learning, content, knowledge, jobs, audit, progress, study, exports.

Da chay bo sung trong V4-052:

- `backend/scripts/bootstrap_real_accounts.py --apply`: tao/bao dam account Supabase Auth + Postgres profiles that cho `system_admin`, `admin`, `teacher`, `student`; khong in password/secret.
- `pnpm --dir frontend run qa:admin-real` tren backend `127.0.0.1:3001` va frontend `127.0.0.1:5174`: pass, login Admin that qua `/auth/login`, click 9 Admin pages, khong co API 4xx/5xx, console error, overflow ngang hoac secret text.
- Final `./init.sh`: pass frontend typecheck/lint, 21 files/109 tests, build; backend 239 tests.

## Production Gap Classification

Blocking P0: none found in V4-050.

Accepted debt/future enhancement da co tracker hoac production-gap doc:

- Durable external worker queue thay cho FastAPI in-process background tasks.
- Durable raw PDF/blob retry path cho failed `document_upload` thay vi yeu cau user upload lai.
- Organization-wide token/cost budget va provider usage accounting that.
- Password reset, MFA, email verification UX, revoke-all sessions va session inventory.
- Scheduled cleanup worker cho contextual docs het han.
- OpenTelemetry exporter/collector, metrics dashboard va frontend request_id surface.
- Server-side PDF renderer neu can output consistency tuyet doi thay cho browser print.
- Deployment smoke voi Supabase project production, bucket/policy migration va backup/restore drill tu dong.

Nhung item nay khong chan pham vi goal hien tai vi san pham da co endpoint, UI, repository path, test evidence va manual validation path cho workflow Teacher -> RAG -> Lesson Studio -> Admin Publish -> Student View -> Web Presentation/PDF.

## Manual Validation Cho User

1. Chay `./init.sh`.
2. Chay backend port 3000 va frontend dev server theo runbook.
3. Mo login, xac nhan backend status `San sang`, khong co role cards demo, form email/password va ma moi khong lo backend URL/password.
4. Login Teacher, kiem tra Tong quan, Khoa hoc, Tai lieu, Dan y, Studio, Tac vu; tao course/class, upload/ingest/retrieve, generate outline/lesson, submit review, xem Job Center.
5. Login Admin, kiem tra Hang doi, Kho tri thuc, Nguoi dung, Tac vu; publish/request changes/reject, manage users/docs, retry/cancel job hop le.
6. Login Student, kiem tra Lop cua toi, Lesson reader, AI Tutor citation, Practice/self-check, Tai lieu ca nhan, Presentation/PDF.
7. Mo `/api/v1/docs`, xac nhan BearerAuth, tags va examples hien trong Swagger.
