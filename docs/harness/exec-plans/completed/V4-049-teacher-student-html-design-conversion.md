# Exec Plan - V4-049 Teacher/Student HTML design conversion va API gap audit

## Muc Tieu

- Feature: `V4-049 Convert teacher and student HTML designs with API gap audit`
- User stories:
  - Teacher thay cac page Tong quan, Khoa hoc, Tai lieu, Dan y, Studio, Tac vu khop visual direction trong `images/teacher/html/`.
  - Student thay cac page Lop cua toi, Lesson, Luyen tap, Tai lieu ca nhan va presentation direction khop `images/student/html/`.
  - Product owner co audit ro frontend action nao da co backend API, action nao con gap truoc production.
- Ket qua user can validate: Teacher/Student runtime React/CSS desktop-first responsive, van goi backend/database that qua API hien co va khong tao UI mock-only.
- Vertical slice: frontend design conversion tren Teacher/Student + API/backend gap audit; backend chi code them neu phat hien gap that.

## Scope P0

- Lam:
  - Chuyen Teacher workspace theo HTML design: overview, setup, documents, outline, studio, jobs.
  - Chuyen Student workspace theo HTML design: classes, lesson reader/tutor, practice/self-check, personal documents.
  - Chinh desktop 1440px la target chinh, responsive khong overlap/cat chu.
  - Audit frontend action -> API endpoint trong `frontend/src/api/learning.ts` va backend FastAPI routes.
  - Giu loading/empty/error state va permission behavior hien co.
- Khong lam:
  - Khong dung screenshot/PNG lam runtime UI.
  - Khong import CDN Tailwind/Google Fonts/remote prototype images tu HTML.
  - Khong them fake metric/list/action chi de khop anh.
  - Khong thay doi auth strategy, Supabase schema lon, AI provider/model hoac publish policy.
  - Khong resume `V2-014` ngoai viec giu Job Center UI/API hien co khi styling Teacher jobs.
- Dependencies da xong: `V4-048`, `V4-044`, `V5-001`, `V2-013`, `V4-046`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`, `docs/version5/README.md`, `docs/version5/PRODUCT_MARKET_REVIEW.md`, `images/frontend-design-manifest-v2.md`, `images/teacher/html/*`, `images/student/html/*`, `feature_list.json`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co. User da chi ro design source trong `images`, package manager `uv`/`pnpm`, va key trong `.env`.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - `./init.sh` full regression; backend pytest 219 tests hien pass baseline.
  - Neu them API gap moi: targeted backend tests cho role/ownership/membership/status guard.
- Frontend:
  - Them/cap nhat raw surface tests cho Teacher/Student design classes va khong lo secrets/backend URL.
  - `pnpm --dir frontend exec vitest run src/features/teacherWorkspace.test.ts src/features/adminStudentWorkspace.test.ts src/features/jobs/jobCenterSurface.test.ts`
  - `pnpm --dir frontend typecheck`
  - `pnpm --dir frontend lint`
  - `pnpm --dir frontend test -- --run`
  - `pnpm --dir frontend build`
- Integration/e2e:
  - Playwright desktop 1440x1000: Teacher overview/setup/documents/outline/studio/jobs.
  - Playwright desktop 1440x1000: Student classes/lessons/practice/documents.
  - Console/page/API bad response issues empty hoac ghi ro expected auth/data seed.
- Security/access:
  - `./init.sh` guard frontend khong hardcode `localhost:3000/api/v1` hoac secret key names.
  - Negative QA: Student khong thay Teacher/Admin action; Teacher khong thay Student-only private study state cua user khac.

### Manual validation

Prerequisite:
- Backend chay port `3000`.
- Frontend chay bang pnpm/Vite, `URL_BACKEND=/api/v1`.
- Demo auth bat neu dung quick role login.

Steps:
1. Login Teacher, mo `Tong quan`, `Khoa hoc & lop`, `Tai lieu`, `Dan y`, `Lesson Studio`, `Tac vu`.
2. Tao/chon course-class, upload/chon tai lieu, generate outline/lesson neu co API key, submit review neu flow san sang.
3. Login Student, mo `Lop cua toi`, `Lesson`, `Luyen tap`, `Tai lieu ca nhan`; hoi Tutor tren lesson published neu co.
4. Chuyen viewport desktop 1440px va width nho hon de kiem tra responsive.

Expected:
- Layout bam design trong `images`, desktop full view, khong overlap/cat chu.
- Du lieu den tu backend/API, khong co fake business data moi.
- Loading/empty/error state va action disabled state van ro.
- Khong hien backend URL, demo password, API key hoac secret key name.

Negative check:
- Student khong thay Teacher/Admin navigation/action.
- Teacher/Admin/Student sai role bi backend reject theo route hien co.
- Tat backend roi refresh login: khong vao duoc workspace va loi ket noi than thien.

## Implementation Plan Theo Vertical Slice

Backend:
- Lap bang API gap trong exec plan/progress sau khi inspect frontend actions.
- Neu khong co gap API P0, khong doi backend.
- Neu co gap P0, them endpoint/test trong module dung domain, giu `/api/v1` va permission guard.

Frontend:
- Ap CSS/design tokens cho Teacher/Student pages theo palette/shell trong HTML.
- Cap nhat Teacher page wrappers/layout: overview quick cards, setup table-detail, documents upload/source, outline builder, studio 3 cot, jobs detail.
- Cap nhat Student page wrappers/layout: classes dashboard, lesson reader/tutor, practice deck/self-check, documents table/upload.
- Dung lucide icons da co, icon-only action co `aria-label`/`title`.
- Khong dung remote images tu prototype; neu can minh hoa lesson, chi dung asset local duoc phep trong manifest.

Tests:
- Cap nhat tests raw/helper selectors theo class/copy moi.
- Chay targeted frontend, full frontend, backend qua `./init.sh`.
- Playwright screenshots desktop cho Teacher/Student.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`.
- Move exec plan sang completed khi pass DoD; neu co blocker, de active voi blocker ro.
- Tech debt tracker chi cap nhat neu co shortcut/debt moi.

## API Gap Audit

| Frontend surface | Runtime action | API hien co | Trang thai |
|---|---|---|---|
| Teacher setup | course/class create, update, archive, add student | `/courses`, `/courses/{id}/classes`, `/classes/{id}`, `/classes/{id}/students`, `/students` | Da co |
| Teacher documents | list/upload URL/PDF, update title, archive, reindex, retrieve | `/documents`, `/documents/upload`, `/documents/ingest-url`, `/documents/{id}`, `/documents/{id}/reindex`, `/rag/retrieve` | Da co |
| Teacher outline | generate/list/update outline, generate lesson | `/outlines/generate`, `/classes/{id}/outlines`, `/outlines/{id}/sessions/{idx}`, `/lessons/generate` | Da co |
| Teacher studio | update lesson/block, approve/reject/regenerate/submit, export records | `/lessons/{id}`, `/lessons/{id}/blocks/{block_id}`, `/lessons/{id}/submit`, `/lessons/{id}/exports` | Da co |
| Teacher jobs | list/retry/cancel generation jobs | `/generation-jobs`, `/generation-jobs/{id}/retry`, `/generation-jobs/{id}/cancel` | Da co; `V2-014` UI DoD paused nhung endpoint ton tai |
| Student classes | list classes/lessons/progress | `/student/classes`, `/student/lessons`, `/student/lessons/{id}/progress` | Da co |
| Student lesson | lesson read, progress, study state, tutor | `/student/lessons/{id}`, `/student/lessons/{id}/progress`, `/student/lessons/{id}/study-state`, `/student/lessons/{id}/tutor` | Da co |
| Student practice | practice items, attempt get/update | `/student/practice-items`, `/student/lessons/{id}/practice-attempts/{block_id}` | Da co |
| Student documents | contextual docs list/upload URL/PDF/archive | `/documents`, `/documents/upload`, `/documents/ingest-url`, `/documents/{id}` voi role Student contextual scope | Da co |

Ket luan truoc code: chua thay gap API P0 bat buoc; backend du kien khong doi tru khi QA phat hien action runtime chua co contract.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline truoc code: `./init.sh`
- Fail-first targeted: `source ~/.nvm/nvm.sh && pnpm --dir frontend exec vitest run src/features/teacherWorkspace.test.ts src/features/adminStudentWorkspace.test.ts`
- Targeted sau fix: `source ~/.nvm/nvm.sh && pnpm --dir frontend typecheck && pnpm --dir frontend lint && pnpm --dir frontend exec vitest run src/features/teacherWorkspace.test.ts src/features/adminStudentWorkspace.test.ts src/features/jobs/jobCenterSurface.test.ts`
- Rendered QA desktop 1440x1000 bang Playwright quick-login/sidebar click cho Teacher overview/setup/documents/outline/studio/jobs va Student classes/lessons/practice/documents.
- Final: `./init.sh`
- `python3 -m json.tool feature_list.json >/tmp/feature_list_v4_049.json && git diff --check`

Ket qua:
- Baseline pass: frontend typecheck/lint, 21 test files/102 tests, build; backend 219 tests pass.
- Fail-first pass theo ky vong: 2 raw surface tests moi fail truoc khi component co `teacher-design-*`/`student-design-*`.
- Targeted sau fix pass: frontend typecheck/lint pass; 3 test files/10 tests pass.
- Final `./init.sh` pass: frontend typecheck/lint, 21 test files/104 tests, build; backend 219 tests pass.
- Rendered QA pass: issues `[]`, horizontalOverflow `false`, markerPresent `true` cho 10 page; screenshots:
  - `/tmp/v4-049-teacher-overview.png`
  - `/tmp/v4-049-teacher-setup.png`
  - `/tmp/v4-049-teacher-documents.png`
  - `/tmp/v4-049-teacher-outline.png`
  - `/tmp/v4-049-teacher-studio.png`
  - `/tmp/v4-049-teacher-jobs.png`
  - `/tmp/v4-049-student-classes.png`
  - `/tmp/v4-049-student-lessons.png`
  - `/tmp/v4-049-student-practice.png`
  - `/tmp/v4-049-student-documents.png`
- API gap audit: khong phat hien gap P0 bat buoc; backend khong doi.

Manual validation da huong dan user:
- Prerequisite: backend port `3000`, frontend port `5173`, demo auth bat.
- Steps: login Teacher -> mo Tong quan/Khoa hoc & lop/Tai lieu/Dan y/Lesson Studio/Tac vu; login Student -> mo Lop cua toi/Lesson/Luyen tap/Tai lieu ca nhan.
- Expected: desktop full view khong overlap/cat chu, data den tu API, loading/empty/error state ro, khong hien backend URL/secret/demo password.
- Negative check: Student khong thay Teacher/Admin navigation/action; sai role tiep tuc bi backend reject theo route hien co.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V4-049-teacher-student-html-design-conversion.md`
- `frontend/src/App.css`
- `frontend/src/features/teacher/TeacherWorkspace.tsx`
- `frontend/src/features/student/StudentWorkspace.tsx`
- `frontend/src/features/teacherWorkspace.test.ts`
- `frontend/src/features/adminStudentWorkspace.test.ts`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Khong co blocker hien tai.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Khong co shortcut/debt moi can ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
