# Exec Plan - V4-036 Lesson export records and history

## Muc Tieu

- Feature: V4-036 Lesson export records and history.
- User stories: US-407, US-411.
- Ket qua user can validate: Teacher/Student export Markdown/PPTX/PDF se tao record backend va co lich su export de audit/debug.
- Vertical slice: backend export record repository + route + frontend API + Teacher/Student UI wiring + tests + docs debt closure.

## Scope P0

- Lam:
  - Them schema/repository export records memory + Postgres theo style module da tach.
  - Them route protected `POST /api/v1/lessons/{lesson_id}/exports` va `GET /api/v1/lessons/{lesson_id}/exports`.
  - Enforce Teacher owner, Student published membership, Admin same organization.
  - Ghi lesson audit event va observability event khi export.
  - Frontend Teacher/Student export action goi backend record truoc khi download/print.
  - Teacher Lesson Studio hien export history gan lesson dang chon.
- Khong lam:
  - Khong them server-side PDF renderer trong slice nay.
  - Khong luu file binary export trong Supabase Storage.
  - Khong doi format Markdown/PPTX hien co.
- Dependencies da xong:
  - V4-030 OpenAPI/Swagger contract.
  - V4-031 structured logging/observability.
  - V4-035 UI/runtime flow repair.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `feature_list.json`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - `test_teacher_records_and_lists_lesson_exports`.
  - `test_student_records_export_only_for_published_membership_lesson`.
  - `test_admin_can_list_same_org_exports`.
  - Negative checks: Student draft/outside class, Teacher non-owner, wrong org admin.
- Frontend:
  - API client calls `POST /lessons/{lesson_id}/exports` va `GET /lessons/{lesson_id}/exports` voi bearer token/body dung.
  - Presentation helper callback allows PDF record before print.
- Integration/e2e:
  - Neu UI wiring phuc tap, dung targeted Playwright smoke Teacher export history.
- Security/access:
  - Backend service guard, khong chi an UI.
  - OpenAPI protected security scheme cho export endpoints.

### Manual validation

Prerequisite:
- Backend va frontend chay voi `.env` hien tai.
- Co Teacher lesson va Student published lesson trong demo flow.

Steps:
1. Login Teacher, tao/mo lesson, bam Export Markdown/PPTX va Xuat PDF trong presentation.
2. Quan sat export history trong Lesson Studio cap nhat format, actor va thoi gian.
3. Login Student, mo lesson da published va bam Tai PDF.

Expected:
- Moi export tao mot record backend.
- Teacher thay history lesson cua minh.
- Student export PDF khong lo Admin/Teacher draft data.

Negative check:
- Student khong thuoc class hoac lesson chua published khong tao duoc export record.
- Teacher khac owner va Admin khac organization khong list/export duoc lesson.

## Implementation Plan Theo Vertical Slice

Backend:
- Them `backend/app/exports/{schemas,ports,repositories}.py`.
- Them service functions trong `app.main` vi content repository/permission helper hien van nam o main.
- Them routes export sau lesson routes va cap nhat OpenAPI tag neu can.

Frontend:
- Them export record types/API functions trong `frontend/src/api/learning.ts`.
- Wire Teacher export handlers va `LessonPresentation` PDF callback.
- Wire Student PDF action va presentation callback.

Tests:
- Backend `tests/test_lesson_exports.py`.
- Frontend API test va presentation callback test.

Docs / Env:
- Cap nhat `docs/harness/exec-plans/tech-debt-tracker.md`.
- Cap nhat `progress.md`, `session-handoff.md`, `feature_list.json`.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` truoc khi code: pass frontend 15 files/63 tests va backend 167 tests.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_lesson_exports.py -q`: fail-first import `LessonExportRequest` truoc khi implement, sau do pass 3.
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts`: fail-first `recordLessonExport is not a function`, sau do pass 21.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_lesson_exports.py tests/test_openapi_contract.py -q`: pass 7.
- `pnpm --dir frontend typecheck`: pass.
- `pnpm --dir frontend lint`: pass.
- `pnpm --dir frontend test -- --run`: pass 15 files/64 tests.
- `pnpm --dir frontend build`: pass.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_lesson_exports.py tests/test_lesson_blocks.py tests/test_student_progress.py tests/test_openapi_contract.py tests/test_observability.py -q`: pass 43.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest -q`: pass 170.
- `python3 -m json.tool feature_list.json >/tmp/feature-list-v4-036.json`: pass.
- `git diff --check`: pass.
- `pnpm --dir frontend exec node /tmp/v4-036-rendered-qa.mjs`: Playwright fallback pass Teacher/Student screenshots va console issues empty.
- `./init.sh`: pass frontend 15 files/64 tests + build va backend 170 tests.

Ket qua:
- Backend co `lesson_export_records` memory/Postgres repository/schema, service permission guard va protected routes `POST/GET /api/v1/lessons/{lesson_id}/exports`.
- Teacher/Student export actions ghi backend record truoc khi download/print.
- Teacher Lesson Studio hien `Export history` voi format/delivery/file/block/citation metadata.
- TD-010 cap nhat `Resolved`.

Manual validation da huong dan user:
- Prerequisite: chay backend/frontend voi `.env` hien tai.
- Teacher: mo lesson, bam Export Markdown/PPTX va Xuat PDF trong presentation; expected export history tang record.
- Student: mo lesson published, bam Tai PDF; expected status ghi lich su export PDF va backend record.
- Negative: Student lesson draft/outside class, Teacher khac owner, Admin khac organization khong tao/list export record.

## Files Changed

- `backend/app/exports/__init__.py`
- `backend/app/exports/schemas.py`
- `backend/app/exports/ports.py`
- `backend/app/exports/repositories.py`
- `backend/app/main.py`
- `backend/app/openapi_contract.py`
- `backend/tests/test_lesson_exports.py`
- `backend/tests/test_openapi_contract.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/presentation/LessonPresentation.tsx`
- `frontend/src/features/teacher/TeacherWorkspace.tsx`
- `frontend/src/features/student/StudentWorkspace.tsx`
- `docs/version4/API_CONTRACT_INVENTORY.md`
- `docs/version4/README.md`
- `docs/version4/PRODUCTION_GAP_ANALYSIS.md`
- `docs/harness/exec-plans/tech-debt-tracker.md`
- `feature_list.json`

## Blockers / Next Step

- Con cac Accepted debt khac trong tracker (TD-004, TD-012, TD-013, TD-014, TD-015, TD-016, TD-018); can mo feature/exec plan moi theo thu tu uu tien neu tiep tuc dong debt.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
