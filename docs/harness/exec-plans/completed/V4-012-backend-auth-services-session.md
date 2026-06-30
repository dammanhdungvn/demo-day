# Exec Plan - V4-012 Backend auth services and session extraction

## Muc Tieu

- Feature: `V4-012 Backend auth services and session extraction`
- User stories: `US-413 Backend modularization plan`
- Ket qua user can validate: demo login/session, Supabase auth path, logout, invite flow va role checks khong doi; auth service logic da tach khoi monolith.
- Vertical slice: backend architecture cleanup nho; khong doi frontend vi API contract khong doi.

## Scope P0

- Lam:
  - Tao `backend/app/auth/services.py`.
  - Move demo session store, `create_session_token`, `list_public_demo_accounts`, `reset_demo_sessions_for_tests`.
  - Move auth provider/repository/client factories, login/refresh/current-user/logout services, invite service helpers va `require_role`.
  - Move `MessageResponse` vao auth schemas neu can de service module khong import `main`.
  - Import lai cac service names trong `backend/app/main.py` de giu compatibility exports.
- Khong lam:
  - Khong tach FastAPI route decorators hoac route registration.
  - Khong tach `get_current_user`/`require_roles` dependency wrappers neu lam tang rui ro route typing.
  - Khong doi auth provider strategy, env var, DB schema semantics, API path, status code hoac response payload.
  - Khong chinh frontend.
- Dependencies da xong: `V4-011`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Cap nhat `backend/tests/test_auth_module_boundaries.py` de assert service imports tu `app.auth.services`, `main` compatibility exports, login/session/logout behavior.
  - Chay `uv run pytest tests/test_auth_module_boundaries.py tests/test_auth.py -q`.
  - Chay targeted regression `uv run pytest tests/test_auth.py tests/test_learning.py tests/test_lesson_blocks.py tests/test_student_progress.py -q`.
  - Chay `uv run pytest -q`.
- Frontend:
  - Khong co frontend change; final `./init.sh` van chay frontend typecheck/lint/test/build.
- Integration/e2e:
  - `./init.sh` sau implementation.
- Security/access:
  - Auth tests cover missing/invalid Bearer, wrong-role 403, invite admin-only, Supabase profile mapping.

### Manual validation

Prerequisite:
- Backend dev server chay bang `cd backend && uv run fastapi dev main.py --host 0.0.0.0 --port 3000`.

Steps:
1. Dang nhap demo Teacher qua `/api/v1/auth/login`.
2. Dung Bearer token goi `/api/v1/me`.
3. Logout bang `/api/v1/auth/logout`.
4. Goi lai `/api/v1/me` bang token cu.

Expected:
- Login va `/me` tra 200 truoc logout.
- Logout tra `{ "message": "Logged out" }`.
- Token cu sau logout tra 401.

Negative check:
- Student/Teacher goi Admin invite endpoint van tra 403.

## Implementation Plan Theo Vertical Slice

Backend:
- Tao auth services module.
- Update auth schemas neu can cho `MessageResponse`.
- Update imports trong `backend/app/main.py`.
- Xoa service/session definitions da move khoi `backend/app/main.py`.

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
- `cd backend && uv run pytest tests/test_auth_module_boundaries.py tests/test_auth.py -q`
- `cd backend && uv run pytest tests/test_auth.py tests/test_learning.py tests/test_lesson_blocks.py tests/test_student_progress.py -q`
- `cd backend && uv run pytest -q`
- `./init.sh`
- `python3 -m json.tool feature_list.json`
- `git diff --check`

Ket qua:
- Auth service boundary + auth targeted pass 18 tests.
- Role/ownership/lesson/student progress targeted regression pass 51 tests, co 1 Starlette/httpx deprecation warning hien co.
- Full backend pytest pass 114 tests, co 1 Starlette/httpx deprecation warning hien co.
- Final `./init.sh` pass frontend 13 files/57 tests + build va backend 114 tests.
- JSON/diff checks pass.

Manual validation da huong dan user:
- Prerequisite/steps/expected/negative check nam trong plan nay; login/session/logout/invite/role behavior da duoc cover boi automated tests.

## Files Changed

- `backend/app/auth/services.py`
- `backend/app/auth/schemas.py`
- `backend/app/auth/__init__.py`
- `backend/app/main.py`
- `backend/tests/test_auth_module_boundaries.py`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `docs/harness/exec-plans/completed/V4-012-backend-auth-services-session.md`

## Blockers / Next Step

- Khong co blocker hien tai.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
