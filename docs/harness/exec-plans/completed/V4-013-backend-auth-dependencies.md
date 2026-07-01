# Exec Plan - V4-013 Backend auth FastAPI dependency extraction

## Muc Tieu

- Feature: `V4-013 Backend auth FastAPI dependency extraction`
- User stories: `US-413 Backend modularization plan`
- Ket qua user can validate: Bearer auth, `/me`, role guards va dashboard permission behavior khong doi; FastAPI auth dependencies co module rieng.
- Vertical slice: backend architecture cleanup nho; khong doi frontend vi API contract khong doi.

## Scope P0

- Lam:
  - Tao `backend/app/auth/dependencies.py`.
  - Move `get_current_user` va `require_roles`.
  - Import lai dependency names trong `backend/app/main.py` de giu route decorators va compatibility exports.
  - Cap nhat boundary tests.
- Khong lam:
  - Khong tach auth routes.
  - Khong doi auth service/session/repository behavior.
  - Khong doi API path, status code hoac response payload.
  - Khong chinh frontend.
- Dependencies da xong: `V4-012`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Cap nhat `backend/tests/test_auth_module_boundaries.py` de assert dependencies import tu `app.auth.dependencies` va `main` compatibility exports.
  - Chay `uv run pytest tests/test_auth_module_boundaries.py tests/test_auth.py -q`.
  - Chay targeted regression `uv run pytest tests/test_auth.py tests/test_learning.py tests/test_lesson_blocks.py tests/test_student_progress.py -q`.
  - Chay `uv run pytest -q`.
- Frontend:
  - Khong co frontend change; final `./init.sh` van chay frontend typecheck/lint/test/build.
- Integration/e2e:
  - `./init.sh` sau implementation.
- Security/access:
  - Auth/learning/lesson/student-progress regression cover 401/403, role guard, membership/status access.

### Manual validation

Prerequisite:
- Backend dev server chay bang `cd backend && uv run fastapi dev main.py --host 0.0.0.0 --port 3000`.

Steps:
1. Dang nhap demo Teacher qua `/api/v1/auth/login`.
2. Dung Bearer token goi `/api/v1/me`.
3. Dung token Teacher goi `/api/v1/admin/dashboard`.

Expected:
- `/me` tra 200 voi user Teacher.
- Admin dashboard tra 403.

Negative check:
- Goi `/api/v1/me` khong co Bearer token tra 401.

## Implementation Plan Theo Vertical Slice

Backend:
- Tao auth dependencies module.
- Update imports trong `backend/app/main.py`.
- Xoa dependency wrappers da move khoi `backend/app/main.py`.

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
- Auth dependency boundary + auth targeted pass 19 tests.
- Role/ownership/lesson/student progress targeted regression pass 51 tests, co 1 Starlette/httpx deprecation warning hien co.
- Full backend pytest pass 115 tests, co 1 Starlette/httpx deprecation warning hien co.
- Final `./init.sh` pass frontend 13 files/57 tests + build va backend 115 tests.
- JSON/diff checks pass.

Manual validation da huong dan user:
- Prerequisite/steps/expected/negative check nam trong plan nay; `/me`, role dependency va 401/403 behavior da duoc cover boi automated tests.

## Files Changed

- `backend/app/auth/dependencies.py`
- `backend/app/auth/__init__.py`
- `backend/app/main.py`
- `backend/tests/test_auth_module_boundaries.py`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `docs/harness/exec-plans/completed/V4-013-backend-auth-dependencies.md`

## Blockers / Next Step

- Khong co blocker hien tai.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
