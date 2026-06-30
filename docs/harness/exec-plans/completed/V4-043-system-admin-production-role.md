# Exec Plan - V4-043 System admin production role foundation

## Muc Tieu

- Feature: `V4-043 System admin production role foundation`
- User stories:
  - Platform operator can bootstrap one real system owner from Supabase-authenticated account configured in `.env`, not from demo login.
  - Organization Admin remains scoped to one organization and cannot create/become system owner through normal invite flow.
- Ket qua user can validate:
  - Supabase user with email/id in `SYSTEM_ADMIN_EMAILS`/`SYSTEM_ADMIN_USER_IDS` logs in and gets role `system_admin`.
  - System Admin can create organization and create first organization Admin invite.
  - Normal Admin cannot call System Admin APIs and normal invite cannot create `system_admin`.
- Vertical slice: backend auth/schema/routes + frontend minimal System Admin workspace + tests + docs.

## Scope P0

- Lam:
  - Add `system_admin` to profile role model.
  - Keep public demo accounts limited to Admin/Teacher/Student.
  - Add safe Postgres schema upgrade for `profiles.role` check constraint.
  - Add system organization bootstrap defaults.
  - Add System Admin-only organization/admin-invite APIs.
  - Add frontend role/session support and a minimal operator workspace.
- Khong lam:
  - Khong them system admin vao public quick demo login.
  - Khong cho system admin tu dong bypass moi org Admin endpoint hien co.
  - Khong them billing, impersonation, delete organization, MFA/password reset trong slice nay.
  - Khong hardcode secret hoac Supabase service key.
- Dependencies da xong: `V4-029`, `V4-030`, `BUG-005`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co. User da yeu cau fix gap root/system admin production va khong hoi lai.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - `Role` includes `system_admin`, demo accounts do not.
  - `auth_schema_sql()` updates `profiles` role constraint to include `system_admin` but keeps `organization_invites` limited to org roles.
  - Supabase login bootstraps configured system admin from env allowlist.
  - Supabase login still rejects unprovisioned, unconfigured users.
  - Normal invite rejects `system_admin`.
  - System Admin creates organization and organization Admin invite.
  - Org Admin cannot call System Admin service.
- Frontend:
  - `UserRole`/session accepts `system_admin`.
  - `getRoleRoute('system_admin')` returns `/system`.
  - API client calls `/system/organizations` and `/system/organizations/{id}/admin-invites`.
- Integration/e2e:
  - Covered by API/unit tests in this slice; rendered QA optional if time remains.
- Security/access:
  - Negative tests for org Admin/Teacher/Student denied from system APIs.
  - Negative test normal invite cannot create owner/system role.

### Manual validation

Prerequisite:
- Set `AUTH_PROVIDER=supabase`, `AUTH_REPOSITORY=postgres`.
- Set `SYSTEM_ADMIN_EMAILS=owner@example.edu` or `SYSTEM_ADMIN_USER_IDS=<supabase-auth-user-id>`.
- Supabase Auth user exists and can login with password.

Steps:
1. Login as configured owner account.
2. Open `/me`; confirm role is `system_admin`.
3. Open `/system`; create organization.
4. Create organization Admin invite for that organization.
5. Login as normal organization Admin and call `/api/v1/system/organizations`.

Expected:
- Owner session is `system_admin`, not public demo account.
- Organization is persisted.
- Admin invite role is `admin` for selected organization.
- Normal Admin receives 403 on System Admin API.

Negative check:
- Normal `POST /api/v1/auth/invites` with role `system_admin` is rejected.
- `GET /api/v1/auth/demo-accounts` still returns only Admin/Teacher/Student.

## Implementation Plan Theo Vertical Slice

Backend:
- Add `system_admin` role and `OrganizationInviteRole`.
- Add organization list/upsert repository methods.
- Add env allowlist bootstrap in auth service.
- Add system admin services/routes.
- Add `/system/dashboard` route and OpenAPI tag/examples.

Frontend:
- Extend UserRole/session labels/workspace mapping.
- Add system admin API client functions.
- Add minimal System Admin workspace in app shell.

Tests:
- Add fail-first backend auth tests.
- Add fail-first frontend auth/session API tests.

Docs / Env:
- Add optional `SYSTEM_ADMIN_EMAILS`, `SYSTEM_ADMIN_USER_IDS`, `SYSTEM_ADMIN_ORGANIZATION_*` to `.env.example`.
- Update V4 production gap/product review, progress, handoff.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline `./init.sh`: pass truoc code, frontend 15 files/73 tests + build, backend 199 tests.
- Fail-first backend: `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_auth.py tests/test_auth_module_boundaries.py -q` fail do chua co `SystemAdminInviteCreateRequest`.
- Fail-first frontend: `pnpm --dir frontend exec vitest run src/api/auth.test.ts src/auth/session.test.ts src/auth/workspaces.test.ts` fail 4 tests do chua co `system_admin` session/API/workspace support.
- Targeted backend sau fix: `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_auth.py tests/test_auth_module_boundaries.py -q` pass 32.
- Targeted frontend sau fix: `pnpm --dir frontend exec vitest run src/api/auth.test.ts src/auth/session.test.ts src/auth/workspaces.test.ts` pass 19.
- Backend full: `UV_CACHE_DIR=.uv-cache uv run pytest -q` pass 203.
- Frontend typecheck/lint/full/build: pass.
- OpenAPI/auth regression: `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_auth.py tests/test_auth_module_boundaries.py tests/test_openapi_contract.py -q` pass 36.
- `python3 -m json.tool feature_list.json` pass.
- `git diff --check` pass.
- Final `./init.sh` pass frontend 15 files/77 tests + build, backend 203 tests.

Ket qua:
- Backend co `system_admin` role, Supabase bootstrap env allowlist, System Admin-only organization/admin-invite APIs, OpenAPI tag System.
- Frontend co session/route/workspace Owner he thong tai `/system`.
- Public quick demo login van chi co Admin/Teacher/Student; normal invite khong tao duoc `system_admin`.

Manual validation da huong dan user:
- Prerequisite: `AUTH_PROVIDER=supabase`, `AUTH_REPOSITORY=postgres`, set `SYSTEM_ADMIN_EMAILS=owner@example.edu` hoac `SYSTEM_ADMIN_USER_IDS=<supabase-auth-user-id>`, Supabase user ton tai.
- Steps: login owner, kiem tra `/me` role `system_admin`, vao `/system`, tao organization, tao invite Admin dau tien, thu Org Admin goi `/api/v1/system/organizations`.
- Expected: Owner vao workspace Owner, invite role `admin` theo organization; Org Admin bi 403.
- Negative: `POST /api/v1/auth/invites` role `system_admin` bi reject; `/auth/demo-accounts` khong tra system admin.

## Files Changed

- `.env.example`
- `backend/app/auth/schemas.py`
- `backend/app/auth/ports.py`
- `backend/app/auth/repositories.py`
- `backend/app/auth/services.py`
- `backend/app/auth/routes.py`
- `backend/app/auth/__init__.py`
- `backend/app/main.py`
- `backend/app/openapi_contract.py`
- `backend/tests/test_auth.py`
- `backend/tests/test_auth_module_boundaries.py`
- `backend/tests/test_openapi_contract.py`
- `frontend/src/api/auth.ts`
- `frontend/src/api/auth.test.ts`
- `frontend/src/auth/session.ts`
- `frontend/src/auth/session.test.ts`
- `frontend/src/auth/workspaces.ts`
- `frontend/src/auth/workspaces.test.ts`
- `frontend/src/features/admin/AdminWorkspace.tsx`
- `frontend/src/labels.ts`
- `frontend/src/workspaceActionTargets.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `docs/version4/API_CONTRACT_INVENTORY.md`
- `docs/version4/README.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `docs/version4/PRODUCTION_GAP_ANALYSIS.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Khong co blocker. Future ops nen mo feature rieng cho owner rotation, MFA policy, tenant disable/delete va impersonation co audit.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
