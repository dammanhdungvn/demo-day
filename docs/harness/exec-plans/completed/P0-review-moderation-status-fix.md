# Exec Plan - Post-review moderation status fix

## Muc Tieu

- Fix cac loi review ve moderation boundary sau P0-007/P0-008/P0-009.
- Ket qua user can validate: Teacher khong the sua/unpublish lesson da submitted/published; edit block reset review status; Teacher thay request-changes feedback sau khi reload/switch role.

## Scope

- Lam:
  - Guard submit theo lesson status.
  - Guard edit/regenerate/status block theo lesson status.
  - Reset block status ve `needs_review` khi title/content thay doi.
  - Them Teacher lesson list API va UI Existing lesson de xem `changes_requested` + `admin_feedback`.
- Khong lam:
  - Persistence production.
  - P1/P2.

## Evidence

Commands da chay:
- `uv run pytest tests/test_lesson_blocks.py -q`
- `pnpm vitest run src/api/learning.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- `uv run pytest -q`
- `pnpm test`
- `pnpm build`
- `git diff --check`

Ket qua:
- Backend targeted lesson tests: 16 pass.
- Frontend API tests: 12 pass.
- Frontend typecheck/lint clean.
- Backend full pytest: 39 pass.
- Frontend full tests: 7 files/30 tests pass.
- Frontend production build pass.
- `git diff --check` pass.

## Manual Validation

- Theo `docs/harness/DEMO_RUNBOOK.md` phan Manual Revision Flow.

## Files Changed

- `backend/main.py`
- `backend/tests/test_lesson_blocks.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/App.tsx`
- `docs/harness/DEMO_RUNBOOK.md`
- `progress.md`
- `session-handoff.md`
- `feature_list.json`

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co regression tests cho tung review finding.
- [x] Co manual validation steps.
- [x] Khong hardcode secrets/backend URL.
