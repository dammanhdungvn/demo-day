# Exec Plan - P0-003 Course, class profile, student membership

## Muc Tieu

- Feature: `P0-003 - Course, class profile, student membership`
- User stories: `US-003`, `US-004`, `US-005`
- Ket qua user can validate: Teacher tao/xem course, tao class profile, add Student demo vao class; Student duoc add thay class, Student khac khong thay.
- Vertical slice: backend course/class/membership APIs + frontend Teacher/Student UI + ownership/membership tests + manual validation.

## Scope P0

- Lam:
  - Backend CRUD toi thieu cho course cua Teacher hien tai.
  - Backend tao class profile thuoc course cua Teacher, validate `student_level` gom `weak`, `average`, `strong`.
  - Backend list demo students co san va add Student vao class cua Teacher.
  - Backend Student endpoint chi tra class ma Student la member.
  - Frontend Teacher dashboard hien flow course -> class -> add Student.
  - Frontend Student dashboard hien class membership.
  - Automated tests cho teacher ownership, student membership, student level validation va wrong-role guard.
- Khong lam:
  - Supabase persistence/schema migration.
  - RAG, document picker, outline/lesson generation.
  - Multi-teacher UI phuc tap, invite/signup Student, bulk import.
- Dependencies da xong: `P0-001`, `P0-002`
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker cho demo local P0-003.
- [ ] Can hoi user:

Ghi chu quyet dinh: P0-003 se dung in-memory demo store backend de dat vertical slice local. Neu user yeu cau Supabase Postgres bat buoc cho P0-003, can Supabase project/schema credentials va scope se thay doi.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Teacher tao course thanh cong va course gan `teacher_id` hien tai.
  - Teacher chi list course cua minh; Student/Admin bi chan khoi teacher course endpoints.
  - Teacher tao class profile trong course cua minh; invalid `student_level` tra 422.
  - Teacher add Student co san vao class cua minh; Student do thay class qua `/student/classes`.
  - Student khac khong thay class; direct membership endpoint voi wrong role bi chan.
- Frontend:
  - Course/class/membership API client gui bearer token dung endpoint.
  - Workspace config khong expose teacher management actions trong Student workspace.
- Integration/e2e:
  - Chua them browser e2e; manual validation tren dev server sau implementation.
- Security/access:
  - Backend enforce role/ownership/membership, khong chi an UI.
  - Frontend khong hardcode backend URL hoac secrets.

### Manual validation

Prerequisite:
- Backend chay tai `http://localhost:3000`.
- Frontend chay tai `http://localhost:5173/`.
- Demo auth P0-002 da pass.

Steps:
1. Login Teacher, tao course `Introduction to Artificial Intelligence`.
2. Tao class `KTPM-K18` voi level `average`, 12 sessions, 90 phut.
3. Add `Student Demo` vao class.
4. Logout va login Student Demo, xac nhan thay class `KTPM-K18`.

Expected:
- Course/class thuoc Teacher hien tai.
- Teacher dashboard hien course/class/membership moi tao.
- Student duoc add thay class va course title.

Negative check:
- Student khong thay Teacher management controls.
- Student khac hoac token sai khong thay class/membership.
- Teacher khong add Student vao class khong thuoc minh.

## Implementation Plan Theo Vertical Slice

Backend:
- Them Pydantic models cho course, class profile, membership va demo student public profile.
- Them in-memory repository functions co reset hook cho tests.
- Them routes `/courses`, `/courses/{course_id}/classes`, `/classes/{class_id}/students`, `/students`, `/student/classes`.
- Reuse auth dependency P0-002 de check role va ownership.

Frontend:
- Them API client `learning.ts`.
- Mo rong Teacher dashboard voi form tao course, form tao class, danh sach students va add membership.
- Mo rong Student dashboard voi list class memberships.
- Loading/error/success text co ban.

Tests:
- Them backend `test_learning.py`.
- Them frontend API client tests.
- Giu `./init.sh` pass.

Docs / Env:
- Cap nhat evidence sau khi verify.
- Ghi debt neu dung in-memory store cho P0-003.

## Evidence Sau Khi Lam

Commands da chay:
- `env XDG_CACHE_HOME=... UV_CACHE_DIR=... uv run pytest tests/test_learning.py`: 6 passed.
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts`: 4 passed.
- `pnpm --dir frontend run typecheck`: pass.
- `./init.sh`: pass, frontend typecheck/lint/test/build pass, Vitest 6 files/20 tests pass, backend pytest 14 pass.
- Local HTTP smoke against `http://127.0.0.1:3000/api/v1`: teacher create course 200, create class 200, list students 200 count 1, add membership 200, student/classes 200 count 1 KTPM-K18, student goi /courses 403, teacher goi /student/classes 403.

Ket qua:
- Backend course/class/membership APIs va service guards hoat dong voi demo in-memory store.
- Frontend Teacher dashboard co form tao course, tao class profile, add Student demo; Student dashboard hien class membership.
- Review khong phat hien blocker sau baseline; wrong-role HTTP smoke pass.

Manual validation da huong dan user:
- Backend dev server dang chay tai `http://localhost:3000`.
- Frontend dev server dang chay tai `http://localhost:5173/`.
- Login Teacher -> create course `Introduction to Artificial Intelligence` -> create class `KTPM-K18` -> add `Student Demo`.
- Logout -> login Student -> xac nhan `KTPM-K18` hien trong My classes.
- Negative check da co evidence HTTP: Student goi `/courses` bi 403; Teacher goi `/student/classes` bi 403.

## Files Changed

- `backend/main.py`
- `backend/tests/test_learning.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/harness/exec-plans/tech-debt-tracker.md`

## Blockers / Next Step

- Khong co blocker cho P0-003.
- Next: `P0-004 - Knowledge base source selection and RAG retrieval`.
- P0-004 can Supabase credentials/schema/data pre-ingested; khong duoc mock RAG that.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
