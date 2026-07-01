# Exec Plan - V2-005 AI generation job lifecycle

## Muc Tieu

- Feature: AI generation job lifecycle
- User stories: `US-211`, `US-207`, `US-208`, `US-212`
- Ket qua user can validate: Teacher thay job records cho outline/lesson/block regeneration, status/error khong mat sau restart khi dung `LEARNING_REPOSITORY=postgres`.
- Vertical slice: backend repository/schema/service/API + frontend Teacher job queue doc data that.

## Scope P0

- Lam:
  - Them `GenerationJobRepository` memory/Postgres.
  - Them schema helper `generation_jobs` idempotent, backward-compatible voi table P0-004.
  - Ghi lifecycle `processing` -> `completed`/`failed` cho outline generation, lesson generation, block regeneration.
  - Expose `GET /api/v1/generation-jobs` cho Teacher/Admin.
  - Frontend Teacher Job Queue doc recent jobs that tu API va refresh sau AI actions.
- Khong lam:
  - Khong chuyen sang background worker/async queue trong slice nay.
  - Khong them retry/cancel UI day du; chi luu status/error va endpoint list de poll/refresh.
  - Khong lam rate limiter day du; chi luu provider/model metadata va job lifecycle lam nen cho US-212.
- Dependencies da xong: `V2-004`
- Source-of-truth da doc: `docs/version2/README.md`, `docs/version2/PRD_V2_PRODUCTION.md`, `docs/version2/USER_STORIES_V2.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker; background worker se lam scope rieng sau.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - `tests/test_generation_jobs.py` kiem tra memory repository create/update/list theo actor va Admin all-jobs.
  - `tests/test_generation_jobs.py` kiem tra schema co table/columns/index/RLS/revoke va alter columns backward-compatible.
  - `tests/test_ai_outline.py` hoac targeted generation test kiem tra outline generation tao completed job va failed job khi AI schema loi.
  - `tests/test_lesson_blocks.py` regression cho lesson/block generation van pass.
- Frontend:
  - `frontend/src/api/learning.test.ts` test `fetchGenerationJobs` goi `/generation-jobs`.
  - Full typecheck/lint/test/build qua `./init.sh`.
- Integration/e2e:
  - Supabase/Postgres smoke: create/update/list generation job bang repository moi, cleanup.
- Security/access:
  - Teacher list chi job cua minh; Admin list all; Student bi 403.

### Manual validation

Prerequisite:
- Backend chay voi `.env` co `LEARNING_REPOSITORY=postgres` va Supabase/Postgres conninfo hop le.

Steps:
1. Dang nhap Teacher, tao outline va lesson blocks.
2. Regenerate mot lesson block.
3. Reload frontend, mo Teacher workspace va xem Hàng đợi xử lý.
4. Restart backend va reload lai Teacher workspace.

Expected:
- Job Queue hien outline_generation/lesson_generation/block_regeneration gan nhat voi status completed hoac failed.
- Job records co actor, role, input entity ids, output entity ids va error message an toan neu fail.

Negative check:
- Student goi `/generation-jobs` bi 403.
- Teacher khac khong thay job cua Teacher hien tai.

## Implementation Plan Theo Vertical Slice

Backend:
- Them model `GenerationJobResponse`, protocol/repository memory/Postgres, schema helper.
- Wire `generate_course_outline`, `generate_lesson_blocks`, `regenerate_lesson_block` tao/update job.
- Them service `list_generation_jobs` va route `GET /api/v1/generation-jobs`.

Frontend:
- Them type/API `GenerationJob` va `fetchGenerationJobs`.
- Teacher workspace load/reload jobs va pass vao `JobQueue`.
- `JobQueue` render data thật neu co, fallback local running flags khi chua co record.

Tests:
- Test-first backend/frontend API tests.
- Targeted backend/frontend tests, Postgres smoke, full `./init.sh`.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/OVERNIGHT_HANDOFF.md`.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline sau V2-004: `./init.sh` -> pass frontend 45 tests/build va backend 69 tests.
- `uv run pytest tests/test_generation_jobs.py -q` -> pass 3 tests.
- `uv run pytest tests/test_ai_outline.py tests/test_lesson_blocks.py tests/test_generation_jobs.py -q` -> pass 31 tests.
- `uv run pytest tests/test_generation_jobs.py tests/test_ai_outline.py tests/test_lesson_blocks.py tests/test_content_persistence.py tests/test_audit_persistence.py -q` -> pass 37 tests.
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts` -> pass 15 tests.
- `pnpm --dir frontend typecheck` -> pass.
- `pnpm --dir frontend lint` -> pass.
- `pnpm --dir frontend test -- --run` -> pass 12 files / 46 tests.
- `pnpm --dir frontend build` -> pass.
- `LEARNING_REPOSITORY=postgres uv run python - <<'PY' ...` -> `generation_job_smoke_ok`, tao/update/list/cleanup generation job tam.
- `./init.sh` -> pass frontend 12 files/46 tests + build va backend 72 tests.
- Playwright rendered smoke Teacher workspace -> pass, Job Queue hien `Chưa có job AI gần đây.`, console issues none.

Ket qua:
- Backend co `GenerationJobRepository` memory/Postgres, schema helper `generation_job_schema_sql()` va route `GET /api/v1/generation-jobs`.
- Outline generation, lesson generation va block regeneration tao/update job lifecycle.
- Frontend Teacher Job Queue doc job API that va refresh sau AI actions.

Manual validation da huong dan user:
- Huong dan trong phan Manual validation cua plan nay va `docs/OVERNIGHT_HANDOFF.md`.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V2-005-ai-generation-job-lifecycle.md`
- `backend/tests/test_generation_jobs.py`
- `backend/main.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/ui/teacherWorkspace.tsx`
- `frontend/src/App.tsx`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`

## Blockers / Next Step

- Khong co blocker hien tai. Async background worker/retry/cancel UI day du de lai cho slice V2 async jobs rieng.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
