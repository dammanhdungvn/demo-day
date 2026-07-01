# Exec Plan - V4-026 Backend jobs route extraction

## Muc Tieu

- Feature: `V4-026 Backend jobs route extraction`
- User stories: `US-413 Backend modularization plan`
- Ket qua user can validate: endpoint `GET /api/v1/generation-jobs` van hoat dong nhu cu cho Teacher/Admin va van chan Student, nhung FastAPI route da nam trong `backend/app/jobs/routes.py`.
- Vertical slice: backend architecture cleanup nho, behavior-preserving; khong doi frontend, DB schema, env, API path hay response payload.

## Scope P0

- Lam:
  - Tao `backend/app/jobs/routes.py`.
  - Move route handler `generation_jobs_route` ra jobs router.
  - Include jobs router trong `backend/app/main.py`.
  - Cap nhat backend boundary tests va chay jobs/AI regression.
- Khong lam:
  - Chua tach rate guard helpers, AI generation flow, generation job lifecycle write paths, content/knowledge/AI routes.
  - Khong doi SQL, env var `LEARNING_REPOSITORY`, AI provider, job lifecycle hay frontend API.
  - Khong them UI moi hoac route moi.
- Dependencies da xong: `V4-025`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Cap nhat `backend/tests/test_jobs_module_boundaries.py`.
  - Test import `router` va `generation_jobs_route` tu `app.jobs.routes`.
  - Test `main.app` register path `/api/v1/generation-jobs`.
  - Test compatibility export tu `main` neu route name con can cho old tests.
- Frontend:
  - Khong co frontend change; final `./init.sh` van chay frontend typecheck/lint/test/build.
- Integration/e2e:
  - Chay `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_jobs_module_boundaries.py tests/test_generation_jobs.py -q`.
  - Chay `tests/test_ai_outline.py tests/test_lesson_blocks.py tests/test_ai_rate_guard.py` de cover job usage.
  - Chay backend full pytest va final `./init.sh`.
- Security/access:
  - Existing generation job tests va boundary route registration giu Teacher/Admin role dependency; Student access 403 duoc cover qua API tests hien co.

### Manual validation

Prerequisite:
- Backend dang chay voi demo data hoac local in-memory default.
- Co Teacher/Admin/Student demo account.

Steps:
1. Teacher generate outline hoac lesson de tao generation job.
2. Teacher/Admin goi `GET /api/v1/generation-jobs`.
3. Student goi cung endpoint.

Expected:
- Teacher/Admin response schema/status khong doi.
- Student van bi chan 403.

Negative check:
- Khong xuat hien route duplicate hoac doi OpenAPI path.

## Implementation Plan Theo Vertical Slice

Backend:
- Them jobs route module.
- Move decorator/handler `generation_jobs_route` khoi `backend/app/main.py`.
- Include router trong app main.

Frontend:
- Khong thay doi.

Tests:
- Cap nhat boundary test truoc, chay de fail do thieu `app.jobs.routes`.
- Implement route split.
- Chay targeted va full verification.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/version4/PRODUCT_REVIEW.md`.
- Move exec plan sang completed neu done.
- Khong doi env.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` truoc code: pass frontend 13 files/57 tests + build, backend 134 tests.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_jobs_module_boundaries.py -q` truoc implementation: fail dung ky vong vi thieu `app.jobs.routes`.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_jobs_module_boundaries.py -q`: pass 5.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_generation_jobs.py -q`: pass 3.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_jobs_module_boundaries.py tests/test_generation_jobs.py tests/test_ai_outline.py tests/test_lesson_blocks.py tests/test_ai_rate_guard.py -q`: pass 41.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest -q`: pass 135.
- `./init.sh`: pass frontend 13 files/57 tests + build, backend 135 tests.
- `python3 -m json.tool feature_list.json`: pass.
- `git diff --check`: pass.

Ket qua:
- `backend/app/jobs/routes.py` expose `router` va `generation_jobs_route`.
- `backend/app/main.py` include `jobs_router` va khong con dinh nghia decorator route `/generation-jobs` truc tiep.
- Job queue API `/api/v1/generation-jobs`, role guard va response payload khong doi.

Manual validation da huong dan user:
- Teacher/Admin goi `GET /api/v1/generation-jobs` de xac nhan payload khong doi.
- Student goi endpoint nay va xac nhan van bi chan 403.
- Tao job qua outline/lesson/reindex/upload flow roi xem lai job queue.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V4-026-backend-jobs-routes.md`
- `backend/app/jobs/routes.py`
- `backend/app/jobs/__init__.py`
- `backend/app/main.py`
- `backend/tests/test_jobs_module_boundaries.py`
- `progress.md`
- `session-handoff.md`
- `docs/version4/PRODUCT_REVIEW.md`

## Blockers / Next Step

- Khong co blocker.
- Next: content/shared citation schema boundary hoac jobs lifecycle services extraction.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
