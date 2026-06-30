# Exec Plan - V4-009 Backend core time/errors/security helper extraction

## Muc Tieu

- Feature: `V4-009 Backend core time/errors/security helper extraction`
- User stories: `US-413 Backend modularization plan`
- Ket qua user can validate: backend van giu nguyen API/auth/role/org-scope behavior, nhung helper dung chung da co boundary core ro hon.
- Vertical slice: backend-only architecture cleanup nho; khong doi frontend vi khong doi user workflow hoac API contract.

## Scope P0

- Lam:
  - Tao `backend/app/core/time.py`, `backend/app/core/errors.py`, `backend/app/core/security.py`.
  - Move `_now_iso`, `_not_found`, `_auth_error`, `_extract_bearer_token`, `_safe_generation_job_error`, `_user_organization_id`, `_entity_organization_id`, `_same_organization`.
  - Import lai helper trong `backend/app/main.py`, giu ten helper hien co de giam blast radius.
  - Them backend smoke tests cho helper core.
- Khong lam:
  - Khong tach auth routes/repositories/services trong slice nay.
  - Khong tach learning/progress/content schemas.
  - Khong doi env var, DB schema, API path, response payload, auth strategy.
  - Khong chinh frontend.
- Dependencies da xong: `V4-004`, `V4-007`, `V4-008`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Them `backend/tests/test_core_helpers.py` cho `_not_found`, `_auth_error`, `_extract_bearer_token`, `_safe_generation_job_error`, org-scope helpers va `_now_iso`.
  - Chay `uv run pytest tests/test_core_helpers.py tests/test_health.py tests/test_auth.py tests/test_learning.py tests/test_student_progress.py -q`.
  - Chay `uv run pytest -q`.
- Frontend:
  - Khong co frontend change; final `./init.sh` van chay frontend typecheck/lint/test/build.
- Integration/e2e:
  - `./init.sh` sau implementation.
- Security/access:
  - Targeted `tests/test_auth.py`, `tests/test_learning.py`, `tests/test_student_progress.py` de cover Bearer token, role guard, membership/org-scope regressions.

### Manual validation

Prerequisite:
- Backend dev server chay bang `cd backend && uv run fastapi dev main.py --host 0.0.0.0 --port 3000`.

Steps:
1. Curl `http://127.0.0.1:3000/api/v1/health`.
2. Dang nhap demo Teacher qua `/api/v1/auth/login`, dung Bearer token goi `/api/v1/teacher/dashboard`.
3. Dung token Teacher goi `/api/v1/admin/dashboard`.

Expected:
- Health tra `status: ok`.
- Teacher dashboard tra 200.
- Teacher goi Admin dashboard tra 403 nhu truoc.

Negative check:
- Goi dashboard khong co Bearer token tra 401 `Authentication required`.

## Implementation Plan Theo Vertical Slice

Backend:
- Tao core modules time/errors/security.
- Update import trong `backend/app/main.py`.
- Xoa helper definitions da move khoi `backend/app/main.py`.

Frontend:
- Khong co.

Tests:
- Them `backend/tests/test_core_helpers.py`.
- Chay targeted backend tests, full backend tests, final `./init.sh`.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/version4/PRODUCT_REVIEW.md`.
- Move exec plan sang `completed/` khi done.

## Evidence Sau Khi Lam

Commands da chay:
- `cd backend && uv run pytest tests/test_core_helpers.py -q`
- `cd backend && uv run pytest tests/test_core_helpers.py tests/test_health.py tests/test_auth.py tests/test_learning.py tests/test_student_progress.py -q`
- `cd backend && uv run pytest -q`
- `./init.sh`
- `python3 -m json.tool feature_list.json`
- `git diff --check`

Ket qua:
- Core helper smoke pass 5 tests.
- Targeted backend regression pass 32 tests, co 1 Starlette/httpx deprecation warning hien co.
- Full backend pytest pass 108 tests, co 1 Starlette/httpx deprecation warning hien co.
- Final `./init.sh` pass frontend 13 files/57 tests + build va backend 108 tests.
- JSON/diff checks pass.

Manual validation da huong dan user:
- Prerequisite/steps/expected/negative check nam trong plan nay; backend auth/role/org-scope da duoc cover boi targeted automated tests.

## Files Changed

- `backend/app/core/time.py`
- `backend/app/core/errors.py`
- `backend/app/core/security.py`
- `backend/app/main.py`
- `backend/tests/test_core_helpers.py`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `docs/harness/exec-plans/completed/V4-009-backend-core-time-errors-security.md`

## Blockers / Next Step

- Khong co blocker hien tai.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
