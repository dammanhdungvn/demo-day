# Exec Plan - P0-009 Student class-based published lesson access

## Muc Tieu

- Feature: `P0-009 - Student class-based published lesson access`
- User stories: `US-024`, `US-025`, `US-026`, `US-031`
- Ket qua user can validate: Student chi thay published lessons thuoc class minh duoc add vao, doc lesson/blocks/citations, khong co Teacher/Admin controls.
- Vertical slice: backend Student lesson list/detail + frontend Student Dashboard reading view + tests + manual validation.

## Scope P0

- Lam:
  - Student lessons endpoint theo class membership va status `published`.
  - Student lesson detail endpoint co direct permission check.
  - UI Student list published lessons va reading view blocks/citations.
- Khong lam:
  - Presentation mode/PDF export (P0-010).
  - Student AI tutor/P2.
  - Production persistence.
- Dependencies da xong: `P0-003`, `P0-008`.
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Student co membership thay published lesson dung class.
  - Student khong thay draft/submitted/changes_requested lesson.
  - Student khong co membership bi 404 khi direct lesson detail.
- Frontend:
  - API client list/detail student lessons dung backend URL va bearer token.
- Integration/e2e:
  - Smoke Teacher create class/add Student -> generate/review/submit -> Admin publish -> Student list/detail.
- Security/access:
  - Teacher/Admin bi chan khoi Student lesson endpoints.
  - Reading UI khong co edit/regenerate/approve/publish controls.

### Manual validation

Prerequisite:
- Teacher da add demo Student vao class va Admin da publish lesson.

Steps:
1. Dang nhap Student.
2. Xem My classes va Published lessons.
3. Mo lesson published va doc blocks/citations.
4. Xac nhan khong co controls edit/regenerate/approve/publish.

Expected:
- Student chi thay published lessons thuoc class membership.
- Direct lesson ngoai class hoac chua published bi chan.

Negative check:
- Teacher/Admin goi Student lesson endpoints bi 403.

## Implementation Plan Theo Vertical Slice

Backend:
- Them student lesson list/detail services va routes.
- Dung `CLASS_STUDENTS` de tinh allowed class ids.
- Chi tra lesson `published`.

Frontend:
- Mo rong API client.
- Mo rong `StudentClasses` thanh Student workspace co class list + published lesson list/detail.

Tests:
- Them backend tests vao lesson flow.
- Them frontend API tests.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`.

## Evidence Sau Khi Lam

Commands da chay:
- `uv run pytest tests/test_lesson_blocks.py -q`
- `pnpm vitest run src/api/learning.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- `uv run pytest -q`
- `pnpm test`
- `pnpm build`
- `git diff --check`
- Live HTTP smoke qua `uv run fastapi dev main.py --host 127.0.0.1 --port 3000`

Ket qua:
- Backend targeted P0-009 tests: 12 pass.
- Frontend API tests: 12 pass.
- Frontend typecheck/lint clean.
- Backend full pytest: 35 pass.
- Frontend full tests: 6 files/28 tests pass.
- Frontend production build pass.
- Live smoke: add Student 200; Student lessons before publish 200 count 0; Admin publish `published`; Student lessons after publish 200 count 1; detail 200 with 5 blocks; Teacher goi Student lessons 403.

Manual validation da huong dan user:
- Dang nhap Student sau khi Teacher add vao class va Admin publish lesson; xem My classes, Published lessons, mo lesson detail va doc blocks/citations; xac nhan khong co Teacher/Admin controls.

## Files Changed

- `backend/main.py`
- `backend/tests/test_lesson_blocks.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/harness/exec-plans/active/P0-009-student-published-lesson-access.md`
- `docs/harness/exec-plans/tech-debt-tracker.md`

## Blockers / Next Step

- Khong con blocker cho P0-009.
- Next: `P0-010 - Web Presentation and PDF export`.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
