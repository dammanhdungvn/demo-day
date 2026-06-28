# Exec Plan - P0-008 Admin moderation and publish flow

## Muc Tieu

- Feature: `P0-008 - Admin moderation and publish flow`
- User stories: `US-020`, `US-021`, `US-022`, `US-023`
- Ket qua user can validate: Admin thay lesson da Teacher submit, xem blocks/citations/warnings/status review, publish lesson hoac request changes kem feedback.
- Vertical slice: backend Admin endpoints + frontend Admin dashboard + tests + manual validation.

## Scope P0

- Lam:
  - Admin review queue cho lesson status `submitted_for_admin_review`.
  - Admin publish status sang `published`.
  - Admin request changes kem feedback status `changes_requested`.
  - UI Admin de xem blocks/citations/warnings va thuc hien publish/request changes.
- Khong lam:
  - Admin sua truc tiep lesson content.
  - Audit log nang cao/P1.
  - Persistence production cho lesson store.
- Dependencies da xong: `P0-007`.
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Admin list review queue chi thay lesson submitted.
  - Admin publish chuyen status sang `published`.
  - Admin request changes chuyen status sang `changes_requested` va luu feedback.
- Frontend:
  - API client co list queue, publish, request changes.
- Integration/e2e:
  - Smoke flow Teacher generate/review/submit -> Admin queue -> publish.
- Security/access:
  - Teacher/Student bi chan khoi Admin moderation endpoints.
  - Admin khong co endpoint sua content block.

### Manual validation

Prerequisite:
- Teacher da tao course/class/source docs, generate outline/lesson, approve het blocks va submit lesson cho Admin.

Steps:
1. Dang nhap Admin.
2. Mo Admin Dashboard review queue.
3. Xem lesson submitted, warning count, citations va block status.
4. Bam Approve & Publish.
5. Tao lesson khac hoac reset flow, bam Request Changes voi feedback.

Expected:
- Lesson publish co status `published`.
- Request changes luu feedback va status `changes_requested`.

Negative check:
- Dang nhap Teacher/Student va goi Admin endpoints phai bi 403.

## Implementation Plan Theo Vertical Slice

Backend:
- Them model response queue/item va request feedback.
- Them service list submitted lessons, publish lesson, request changes.
- Them routes Admin-only duoi `/api/v1/admin/...`.

Frontend:
- Mo rong Admin dashboard: review queue, detail blocks, citations/warnings, action buttons.
- Them API client functions.

Tests:
- Backend tests trong lesson/admin flow.
- Frontend API tests.

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
- Backend targeted P0-008 tests: 9 pass.
- Frontend API tests: 11 pass.
- Frontend typecheck/lint clean.
- Backend full pytest: 32 pass.
- Frontend full tests: 6 files/27 tests pass.
- Frontend production build pass.
- Live smoke: Teacher/Admin login 200; Admin queue 200 count 1; publish 200 status `published`; request changes 200 status `changes_requested`; Teacher goi Admin publish endpoint bi 403.

Manual validation da huong dan user:
- Dang nhap Admin sau khi Teacher submit lesson; xem Admin moderation queue, blocks, citations, warnings; thu Approve & Publish; voi lesson khac nhap feedback va Request changes; dang nhap Teacher/Student khong co Admin action.

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
- `docs/harness/exec-plans/active/P0-008-admin-moderation-publish.md`
- `docs/harness/exec-plans/tech-debt-tracker.md`

## Blockers / Next Step

- Khong con blocker cho P0-008.
- Next: `P0-009 - Student class-based published lesson access`.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
