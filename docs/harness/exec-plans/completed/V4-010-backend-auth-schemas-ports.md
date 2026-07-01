# Exec Plan - V4-010 Backend auth schemas and ports extraction

## Muc Tieu

- Feature: `V4-010 Backend auth schemas and ports extraction`
- User stories: `US-413 Backend modularization plan`
- Ket qua user can validate: login/session/invite/role guard van giu behavior, trong khi auth schemas va protocols da co module boundary rieng.
- Vertical slice: backend architecture cleanup nho; khong doi frontend vi API contract khong doi.

## Scope P0

- Lam:
  - Tao `backend/app/auth/__init__.py`, `backend/app/auth/schemas.py`, `backend/app/auth/ports.py`.
  - Move `Role`, `UserProfile`, `PublicDemoAccount`, `DemoAccountRecord`, `LoginRequest`, `LoginResponse`, `RefreshSessionRequest`, `AuthOrganizationResponse`, `AuthProfileRecord`, `InviteCreateRequest`, `OrganizationInviteResponse`, `SupabaseAuthUser`, `SupabaseAuthSession`.
  - Move `SupabaseAuthClient` va `AuthRepository` protocols.
  - Import lai cac name trong `backend/app/main.py` de giu compatibility cho route response models va tests import `main`.
  - Them backend smoke tests cho auth module boundary.
- Khong lam:
  - Khong tach `InMemoryAuthRepository`, `PostgresAuthRepository`, `SupabaseAuthRestClient` trong slice nay.
  - Khong tach auth routes/dependencies/services.
  - Khong doi auth provider strategy, env var, DB schema, API path, status code hoac response payload.
  - Khong chinh frontend.
- Dependencies da xong: `V4-009`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Them `backend/tests/test_auth_module_boundaries.py` de assert auth schemas/ports import duoc tu `app.auth.*` va `main` van compatibility-export cung object.
  - Chay `uv run pytest tests/test_auth_module_boundaries.py tests/test_auth.py -q`.
  - Chay targeted regression `uv run pytest tests/test_auth.py tests/test_learning.py tests/test_lesson_blocks.py tests/test_student_progress.py -q`.
  - Chay `uv run pytest -q`.
- Frontend:
  - Khong co frontend change; final `./init.sh` van chay frontend typecheck/lint/test/build.
- Integration/e2e:
  - `./init.sh` sau implementation.
- Security/access:
  - `tests/test_auth.py`, `tests/test_learning.py`, `tests/test_lesson_blocks.py`, `tests/test_student_progress.py` cover login/session, role guard, ownership/membership/org-scope regression.

### Manual validation

Prerequisite:
- Backend dev server chay bang `cd backend && uv run fastapi dev main.py --host 0.0.0.0 --port 3000`.

Steps:
1. Dang nhap demo Teacher qua `/api/v1/auth/login`.
2. Dung Bearer token goi `/api/v1/me` va `/api/v1/teacher/dashboard`.
3. Dung cung token goi `/api/v1/admin/dashboard`.

Expected:
- Login tra `access_token` va `user.role = teacher`.
- `/me` va Teacher dashboard tra 200.
- Admin dashboard tra 403 nhu truoc.

Negative check:
- Login sai password tra 401; missing Bearer token tra 401.

## Implementation Plan Theo Vertical Slice

Backend:
- Tao auth package schemas/ports.
- Update imports trong `backend/app/main.py`.
- Xoa auth schema/protocol definitions da move khoi `backend/app/main.py`.

Frontend:
- Khong co.

Tests:
- Them `backend/tests/test_auth_module_boundaries.py`.
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
- Auth boundary + auth targeted pass 15 tests.
- Role/ownership/lesson/student progress targeted regression pass 51 tests, co 1 Starlette/httpx deprecation warning hien co.
- Full backend pytest pass 111 tests, co 1 Starlette/httpx deprecation warning hien co.
- Final `./init.sh` pass frontend 13 files/57 tests + build va backend 111 tests.
- JSON/diff checks pass.

Manual validation da huong dan user:
- Prerequisite/steps/expected/negative check nam trong plan nay; backend auth/role regression da duoc cover boi automated tests.

## Files Changed

- `backend/app/auth/__init__.py`
- `backend/app/auth/schemas.py`
- `backend/app/auth/ports.py`
- `backend/app/main.py`
- `backend/tests/test_auth_module_boundaries.py`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `docs/harness/exec-plans/completed/V4-010-backend-auth-schemas-ports.md`

## Blockers / Next Step

- Khong co blocker hien tai.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
