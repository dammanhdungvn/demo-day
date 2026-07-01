# Exec Plan - V4-014 Backend auth route extraction

## Muc Tieu

- Feature: `V4-014 Backend auth route extraction`
- User stories: `US-413 Backend modularization plan`
- Ket qua user can validate: auth endpoints `/auth/*` va `/me` van giu path/status/response, route code da nam trong auth module.
- Vertical slice: backend architecture cleanup nho; khong doi frontend vi API contract khong doi.

## Scope P0

- Lam:
  - Tao `backend/app/auth/routes.py` voi `APIRouter`.
  - Move route handlers `/auth/demo-accounts`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/invites`, `/me`.
  - Include router trong `backend/app/main.py`.
  - Cap nhat boundary tests cho router path/method registration.
- Khong lam:
  - Khong tach dashboard routes.
  - Khong tach learning/content/knowledge routes.
  - Khong doi API path, status code, response schema, auth service behavior.
  - Khong chinh frontend.
- Dependencies da xong: `V4-013`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Cap nhat `backend/tests/test_auth_module_boundaries.py` de assert `app.auth.routes.router` co path/method hien co va app main da include route.
  - Chay `uv run pytest tests/test_auth_module_boundaries.py tests/test_auth.py tests/test_health.py -q`.
  - Chay targeted regression `uv run pytest tests/test_auth.py tests/test_learning.py tests/test_lesson_blocks.py tests/test_student_progress.py -q`.
  - Chay `uv run pytest -q`.
- Frontend:
  - Khong co frontend change; final `./init.sh` van chay frontend typecheck/lint/test/build.
- Integration/e2e:
  - `./init.sh` sau implementation.
- Security/access:
  - Auth tests cover login/session/logout/invite, missing Bearer, wrong-role 403.

### Manual validation

Prerequisite:
- Backend dev server chay bang `cd backend && uv run fastapi dev main.py --host 0.0.0.0 --port 3000`.

Steps:
1. GET `/api/v1/auth/demo-accounts`.
2. POST `/api/v1/auth/login` voi Teacher demo.
3. GET `/api/v1/me` voi Bearer token.
4. POST `/api/v1/auth/logout`.

Expected:
- Route path/status/response payload nhu truoc.

Negative check:
- GET `/api/v1/auth/invites` bang Teacher token tra 403; missing token tra 401.

## Implementation Plan Theo Vertical Slice

Backend:
- Tao auth routes module.
- Update `backend/app/main.py` include router va remove route handler definitions da move.

Frontend:
- Khong co.

Tests:
- Cap nhat `backend/tests/test_auth_module_boundaries.py`.
- Chay targeted backend tests, full backend tests, final `./init.sh`.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/OVERNIGHT_HANDOFF.md`, `docs/version4/PRODUCT_REVIEW.md`.
- Move exec plan sang `completed/` khi done.

## Evidence Sau Khi Lam

Commands da chay:
- `cd backend && uv run pytest tests/test_auth_module_boundaries.py tests/test_auth.py tests/test_health.py -q`
- `cd backend && uv run pytest tests/test_auth.py tests/test_learning.py tests/test_lesson_blocks.py tests/test_student_progress.py -q`
- `cd backend && uv run pytest -q`
- `./init.sh`
- `python3 -m json.tool feature_list.json`
- `git diff --check`

Ket qua:
- Auth router boundary + auth/health targeted pass 22 tests, co 1 Starlette/httpx deprecation warning hien co.
- Role/ownership/lesson/student progress targeted regression pass 51 tests, co 1 warning hien co.
- Full backend pytest pass 116 tests, co 1 Starlette/httpx deprecation warning hien co.
- Final `./init.sh` pass frontend 13 files/57 tests + build va backend 116 tests.
- JSON/diff checks pass.

Manual validation da huong dan user:
- Prerequisite/steps/expected/negative check nam trong plan nay; route dispatch/login/session/invite/role behavior da duoc cover boi automated tests.

## Files Changed

- `backend/app/auth/routes.py`
- `backend/app/auth/__init__.py`
- `backend/app/main.py`
- `backend/tests/test_auth_module_boundaries.py`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `docs/harness/exec-plans/completed/V4-014-backend-auth-routes.md`

## Blockers / Next Step

- Khong co blocker hien tai.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
