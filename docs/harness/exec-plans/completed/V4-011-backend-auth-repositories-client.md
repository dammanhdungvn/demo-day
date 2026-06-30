# Exec Plan - V4-011 Backend auth repositories and Supabase client extraction

## Muc Tieu

- Feature: `V4-011 Backend auth repositories and Supabase client extraction`
- User stories: `US-413 Backend modularization plan`
- Ket qua user can validate: auth provider/repository behavior, demo login va invite flow khong doi; auth adapters da tach khoi backend monolith.
- Vertical slice: backend architecture cleanup nho; khong doi frontend vi API contract khong doi.

## Scope P0

- Lam:
  - Tao `backend/app/auth/repositories.py` va `backend/app/auth/supabase_client.py`.
  - Move `auth_schema_sql`, `InMemoryAuthRepository`, `PostgresAuthRepository`, `SupabaseAuthRestClient`.
  - Import lai adapter classes/function trong `backend/app/main.py` de giu compatibility exports.
  - Them backend smoke tests cho repository/client module boundary.
- Khong lam:
  - Khong tach auth service functions (`authenticate_user`, `get_current_user_from_authorization`, invite services).
  - Khong tach FastAPI auth routes/dependencies.
  - Khong doi auth provider strategy, env var, DB schema semantics, API path, status code hoac response payload.
  - Khong chinh frontend.
- Dependencies da xong: `V4-010`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Them/cap nhat `backend/tests/test_auth_module_boundaries.py` de assert repository/client imports tu `app.auth.*`, memory repository idempotent invite behavior va `main` compatibility exports.
  - Chay `uv run pytest tests/test_auth_module_boundaries.py tests/test_auth.py -q`.
  - Chay targeted regression `uv run pytest tests/test_auth.py tests/test_learning.py tests/test_lesson_blocks.py tests/test_student_progress.py -q`.
  - Chay `uv run pytest -q`.
- Frontend:
  - Khong co frontend change; final `./init.sh` van chay frontend typecheck/lint/test/build.
- Integration/e2e:
  - `./init.sh` sau implementation.
- Security/access:
  - Auth tests cover login/session/profile/invite; role/membership regression cover downstream UserProfile/Role imports.

### Manual validation

Prerequisite:
- Backend dev server chay bang `cd backend && uv run fastapi dev main.py --host 0.0.0.0 --port 3000`.

Steps:
1. Dang nhap demo Admin qua `/api/v1/auth/login`.
2. Dung Bearer token goi `/api/v1/auth/invites`.
3. Dung token Admin tao invite Teacher/Student.
4. Dung token Teacher goi `/api/v1/auth/invites`.

Expected:
- Admin login/list/create invite tra 200.
- Duplicate pending invite van idempotent theo repository behavior hien co.
- Teacher goi invite endpoint tra 403.

Negative check:
- Missing Bearer token tra 401; wrong-role request tra 403.

## Implementation Plan Theo Vertical Slice

Backend:
- Tao auth repository/client modules.
- Update imports trong `backend/app/main.py`.
- Xoa adapter definitions da move khoi `backend/app/main.py`.

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
- Auth repository/client boundary + auth targeted pass 17 tests.
- Role/ownership/lesson/student progress targeted regression pass 51 tests, co 1 Starlette/httpx deprecation warning hien co.
- Full backend pytest pass 113 tests, co 1 Starlette/httpx deprecation warning hien co.
- Final `./init.sh` pass frontend 13 files/57 tests + build va backend 113 tests.
- JSON/diff checks pass.

Manual validation da huong dan user:
- Prerequisite/steps/expected/negative check nam trong plan nay; auth/invite/role behavior da duoc cover boi automated tests.

## Files Changed

- `backend/app/auth/demo.py`
- `backend/app/auth/repositories.py`
- `backend/app/auth/supabase_client.py`
- `backend/app/auth/__init__.py`
- `backend/app/main.py`
- `backend/tests/test_auth_module_boundaries.py`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `docs/harness/exec-plans/completed/V4-011-backend-auth-repositories-client.md`

## Blockers / Next Step

- Khong co blocker hien tai.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
