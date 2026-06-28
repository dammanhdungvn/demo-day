# Exec Plan - P0-007 Teacher Lesson Studio review flow

## Muc Tieu

- Feature: `P0-007 - Teacher Lesson Studio review flow`
- User stories: `US-015`, `US-016`, `US-017`, `US-018`, `US-019`
- Ket qua user can validate: Teacher review lesson blocks, edit/regenerate/approve/reject va submit lesson cho Admin.
- Vertical slice: backend block actions + frontend controls + tests/manual validation.

## Scope P0

- Lam:
  - Edit block title/content.
  - Regenerate one block bang AI.
  - Approve, approve_with_warning, reject.
  - Submit lesson khi khong con block `needs_review`.
- Khong lam:
  - Admin approve/publish (P0-008).
  - Student view/PDF/presentation.
- Dependencies da xong: `P0-006`
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Teacher update block content/status.
  - Submit reject khi con block `needs_review`.
  - Submit doi lesson status sang `submitted_for_admin_review`.
  - Student khong thao tac duoc lesson block.
- Frontend:
  - API client cho update/regenerate/status/submit dung bearer token.

### Manual validation

Prerequisite:
- Da generate lesson blocks P0-006.

Steps:
1. Edit mot block va save.
2. Approve cac block.
3. Submit lesson.

Expected:
- Status block cap nhat, lesson submit thanh cong khi tat ca block da review.

Negative check:
- Submit khi con `needs_review` bi chan.

## Implementation Plan Theo Vertical Slice

Backend:
- Them request models va services block update/regenerate/status/submit.
- Them routes.

Frontend:
- Them API client va controls trong lesson block panel.

Tests:
- Backend + frontend API tests.

Docs / Env:
- Cap nhat state/evidence.

## Evidence Sau Khi Lam

Commands da chay:
- `uv run pytest tests/test_lesson_blocks.py -q`
- `pnpm --dir frontend run typecheck && pnpm --dir frontend run lint && pnpm --dir frontend exec vitest run src/api/learning.test.ts && pnpm --dir frontend run build`
- `uv run pytest -q`
- Live HTTP smoke local voi OpenAI key hien co.

Ket qua:
- Backend lesson/teacher studio targeted tests: `5 passed`.
- Frontend API tests: `10 passed`.
- Backend full pytest: `28 passed`.
- Frontend typecheck/lint/build pass.
- Live smoke: generate lesson 200, update block 200, regenerate block 200, submit before review 400, approve all blocks 200, submit after review 200 `submitted_for_admin_review`.

Manual validation da huong dan user:
Prerequisite:
- Da generate lesson blocks.

Steps:
1. Sua title/content mot block va save.
2. Regenerate mot block.
3. Approve cac block.
4. Submit lesson.

Expected:
- Block status cap nhat.
- Submit bi chan neu con block `needs_review`.
- Lesson submit thanh `submitted_for_admin_review` khi tat ca block da review.

## Files Changed

- `backend/main.py`
- `backend/tests/test_lesson_blocks.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `feature_list.json`
- `docs/harness/exec-plans/active/P0-007-teacher-lesson-studio.md`

## Blockers / Next Step

- Khong con blocker cho P0-007.
- Next: `P0-008 - Admin moderation and publish flow`.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
