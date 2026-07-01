# Exec Plan - V4-046 CRUD management expansion

## Muc Tieu

- Feature: V4-046 CRUD management expansion for knowledge, users, classes and lessons.
- User stories:
  - Admin sua/luu tru document trong kho tri thuc dai han cua AI.
  - Admin sua thong tin Teacher/Student va disable/reactivate user trong organization.
  - Teacher sua/luu tru lop hoc va bai giang minh so huu.
- Ket qua user can validate: cac danh sach quan ly khong chi co create/list; user co the sua ten/thong tin va xoa khoi danh sach active bang archive/disable an toan.
- Vertical slice: backend API + frontend action UI + tests + docs.

## Scope P0

- Lam:
  - PATCH document metadata voi scope guard.
  - PATCH auth managed user name/email/status voi organization guard.
  - PATCH/DELETE class profile cho Teacher owner; DELETE la archive `is_active=false`.
  - PATCH/DELETE lesson session cho Teacher owner; DELETE la archive `is_active=false`.
  - UI action/edit/loading/error states cho Admin Knowledge, Admin Users, Teacher Setup va Teacher Lesson Studio.
- Khong lam:
  - Hard delete `auth.users`, documents, classes, lessons.
  - Doi role Teacher/Student tu Admin UI.
  - Full gradebook/LMS feature, bulk import, realtime collaboration.
  - Migration sang full shadcn/Tailwind CLI trong slice nay.
- Dependencies da xong: V4-028, V4-029, V4-044, V4-045.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - `tests/test_auth.py`: Admin update managed user name/email/status; reject cross-org/wrong-role/admin target.
  - `tests/test_learning.py`: Teacher update/archive class; inactive class hidden from teacher/student lists; reject other teacher/org.
  - `tests/test_lesson_blocks.py`: Teacher update/archive lesson; archived lesson hidden from Teacher/Admin/Student active flows.
  - `tests/test_knowledge_rag.py`: user can update metadata only for visible document scope; reject hidden admin library for Teacher/Student.
- Frontend:
  - `frontend/src/api/auth.test.ts`: PATCH managed user sends name/email/status.
  - `frontend/src/api/learning.test.ts`: PATCH document/class/lesson and DELETE class/lesson endpoints.
  - Targeted workspace tests if helper functions are added.
- Integration/e2e:
  - Playwright rendered QA for Admin users/knowledge and Teacher class/lesson actions if time allows.
- Security/access:
  - Role, organization, owner scope, non-destructive delete semantics.

### Manual validation

Prerequisite:
- Backend/frontend dev servers running with `.env`.

Steps:
1. Login Admin, open `Kho tri thuc`, rename one document, archive one document.
2. Login Admin, open `Nguoi dung`, edit Teacher/Student name/email, disable and reactivate.
3. Login Teacher, open `Khoa hoc & lop`, create class, edit class, archive class.
4. Login Teacher, open `Lesson Studio`, rename lesson, archive lesson.

Expected:
- Lists refresh immediately, status messages show success/failure, archived/disabled items are not usable in active workflows.

Negative check:
- Teacher/Student cannot manage Admin library docs or organization users.
- Teacher cannot edit/archive class/lesson from another Teacher or organization.
- Published/archived lesson is not visible to Student after archive.

## Implementation Plan Theo Vertical Slice

Backend:
- Extend schemas/contracts and repository methods.
- Add routes and services for scoped update/archive operations.
- Add `is_active` lifecycle to classes and lesson sessions with default true.

Frontend:
- Add API client functions/types.
- Add row edit state/actions for Admin users and documents.
- Add Teacher class list edit/archive and lesson title/archive actions.

Tests:
- Write fail-first targeted backend/frontend tests.
- Run targeted tests, then full `./init.sh`.

Docs / Env:
- Update feature evidence, progress, session handoff, V4 docs.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` baseline pass truoc code: frontend 18 files/89 tests + build; backend 209 tests.
- Fail-first targeted tests reproduced missing backend/frontend contracts before implementation.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_auth.py tests/test_learning.py tests/test_lesson_blocks.py tests/test_knowledge_rag.py -q` pass 115.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest -q` pass 215.
- `pnpm --dir frontend exec vitest run src/api/auth.test.ts src/api/learning.test.ts` pass 41.
- `pnpm --dir frontend typecheck`, `pnpm --dir frontend lint`, `pnpm --dir frontend test -- --run`, `pnpm --dir frontend build` pass; frontend full 18 files/93 tests.
- Rendered QA pass cho Admin Users CRUD va Teacher class/lesson CRUD; screenshots `/tmp/v4-046-admin-users-crud.png`, `/tmp/v4-046-teacher-class-crud.png`.
- Final `./init.sh` pass: frontend 18 files/93 tests + build; backend 215 tests.

Ket qua:
- Hoan thanh backend + frontend CRUD management expansion:
  - Admin sua Teacher/Student name/email/status trong organization.
  - Admin rename/archive knowledge document theo scope policy.
  - Teacher sua/archive class minh so huu.
  - Teacher rename/archive lesson minh so huu.
  - Class/lesson/document delete trong UI dung soft archive/deactivate, khong hard delete audit/history.

Manual validation da huong dan user:
- Login Admin -> `Nguoi dung`: sua name/email Teacher/Student, disable/reactivate.
- Login Admin -> `Kho tri thuc`: rename document, archive document.
- Login Teacher -> `Khoa hoc & lop`: sua class dang chon, archive class.
- Login Teacher -> `Lesson Studio`: rename lesson, archive lesson.

## Files Changed

- `backend/app/auth/schemas.py`
- `backend/app/auth/services.py`
- `backend/app/auth/routes.py`
- `backend/app/auth/__init__.py`
- `backend/app/learning/schemas.py`
- `backend/app/learning/ports.py`
- `backend/app/learning/repositories.py`
- `backend/app/learning/services.py`
- `backend/app/learning/routes.py`
- `backend/app/learning/__init__.py`
- `backend/app/knowledge/schemas.py`
- `backend/app/main.py`
- `frontend/src/api/auth.ts`
- `frontend/src/api/auth.test.ts`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/features/admin/AdminWorkspace.tsx`
- `frontend/src/features/knowledge/KnowledgeControls.tsx`
- `frontend/src/features/teacher/TeacherWorkspace.tsx`
- `frontend/src/App.css`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/version4/README.md`
- `docs/version4/PRODUCTION_GAP_ANALYSIS.md`
- `docs/version4/API_CONTRACT_INVENTORY.md`

## Blockers / Next Step

- Khong co blocker.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md` hoac khong co debt moi.
