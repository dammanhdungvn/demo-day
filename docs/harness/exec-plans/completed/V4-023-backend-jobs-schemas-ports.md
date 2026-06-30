# Exec Plan - V4-023 Backend jobs schemas and ports extraction

## Muc Tieu

- Feature: `V4-023 Backend jobs schemas and ports extraction`
- User stories: `US-413 Backend modularization plan`
- Ket qua user can validate: Generation job lifecycle va job queue API tiep tuc dung nhu hien tai, nhung job schema/protocol da co module boundary trong `backend/app/jobs/`.
- Vertical slice: backend architecture cleanup nho, behavior-preserving; khong doi frontend, DB schema, env, API path hay response payload.

## Scope P0

- Lam:
  - Tao `backend/app/jobs/__init__.py`, `backend/app/jobs/schemas.py`, `backend/app/jobs/ports.py`.
  - Move `GenerationJobStatus` va `GenerationJobResponse` ra jobs schema module.
  - Move `GenerationJobRepository` protocol ra jobs ports module.
  - Import/re-export compatibility names trong `backend/app/main.py`.
  - Them backend boundary tests va chay jobs/AI generation regression.
- Khong lam:
  - Chua tach generation job repositories, services hoac routes.
  - Khong doi `generation_jobs` schema SQL, env var `LEARNING_REPOSITORY`, rate guard, AI provider, job lifecycle hay frontend API.
  - Khong them UI moi hoac route moi.
- Dependencies da xong: `V4-022`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Them `backend/tests/test_jobs_module_boundaries.py`.
  - Test import `GenerationJobStatus`, `GenerationJobResponse` tu `app.jobs.schemas` va compatibility export tu `main`.
  - Test `GenerationJobRepository` protocol expose `ensure_schema`, `create_job`, `update_job`, `list_jobs_for_actor`.
  - Test allowed status literals co day du queued/processing/completed/failed/cancelled/retrying/skipped.
- Frontend:
  - Khong co frontend change; final `./init.sh` van chay frontend typecheck/lint/test/build.
- Integration/e2e:
  - Chay `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_jobs_module_boundaries.py tests/test_generation_jobs.py -q`.
  - Chay `tests/test_ai_outline.py tests/test_lesson_blocks.py tests/test_ai_rate_guard.py` de cover job usage.
  - Chay backend full pytest va final `./init.sh`.
- Security/access:
  - Existing generation job tests tiep tuc cover actor/job scoping va safe error detail.

### Manual validation

Prerequisite:
- Backend dang chay voi demo data hoac local in-memory default.
- Co Teacher demo account.

Steps:
1. Teacher generate outline hoac lesson de tao generation job.
2. Goi `GET /api/v1/generation-jobs`.
3. Tao failed generation path neu can va doc job queue.

Expected:
- Job response fields `id`, `job_type`, `status`, `actor_id`, `actor_role`, `input`, `retrieved_context`, `output`, `error_message`, `created_at`, `updated_at` khong doi.
- Job lifecycle va safe error detail van dung behavior hien tai.

Negative check:
- Actor khong dung scope khong doc duoc job cua user khac theo guard hien co.

## Implementation Plan Theo Vertical Slice

Backend:
- Them jobs package va move schema/protocol ra module moi.
- Import jobs schema/port vao `backend/app/main.py` de repositories/services/routes hien co tiep tuc dung.
- Cap nhat `backend/app/jobs/__init__.py` export public names.

Frontend:
- Khong thay doi.

Tests:
- Viet boundary test truoc, chay de fail do chua co `app.jobs`.
- Implement module split.
- Chay targeted va full verification.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/version4/PRODUCT_REVIEW.md`.
- Move exec plan sang completed neu done.
- Khong doi env.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` truoc code: pass frontend 13 files/57 tests + build, backend 130 tests.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_jobs_module_boundaries.py -q` test-first: fail dung ky vong vi thieu `app.jobs`.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_jobs_module_boundaries.py -q`: pass 2.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_generation_jobs.py -q`: pass 3.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_jobs_module_boundaries.py tests/test_generation_jobs.py tests/test_ai_outline.py tests/test_lesson_blocks.py tests/test_ai_rate_guard.py -q`: pass 38.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest -q`: pass 132.
- `./init.sh`: pass frontend 13 files/57 tests + build, backend 132 tests.
- `python3 -c "import json; json.load(open('feature_list.json')); print('feature_list_json_ok')"`: pass.
- `git diff --check`: pass.

Ket qua:
- `backend/app/jobs/` da co schema va port boundary.
- `backend/app/main.py` khong con dinh nghia truc tiep job schema/protocol da tach, nhung compatibility exports van giu.
- Generation job lifecycle, API response va AI generation behavior khong doi.

Manual validation da huong dan user:
- Teacher tao generation job va doc job queue theo steps trong plan.
- Negative check: actor/scope guard hien co tiep tuc duoc cover trong automated tests.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V4-023-backend-jobs-schemas-ports.md`
- `backend/app/jobs/__init__.py`
- `backend/app/jobs/schemas.py`
- `backend/app/jobs/ports.py`
- `backend/app/main.py`
- `backend/tests/test_jobs_module_boundaries.py`
- `progress.md`
- `session-handoff.md`
- `docs/version4/PRODUCT_REVIEW.md`

## Blockers / Next Step

- Khong co blocker.
- Next sau khi done: jobs repository extraction hoac content/shared citation schema boundary.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
