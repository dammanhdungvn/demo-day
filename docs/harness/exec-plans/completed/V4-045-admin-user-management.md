# Exec Plan - V4-045 Admin Teacher/Student User Management

## Muc Tieu

- Feature: `V4-045 Admin Teacher and Student user management`
- User story:
  - Admin cua organization can quan ly Teacher/Student that, khong chi tao invite roi mat dau vet.
  - Admin can thay ai dang active/disabled, tim kiem/loc, va tam khoa/mo lai quyen truy cap khi can.
- Ket qua user can validate:
  - Admin page `Nguoi dung` co member list Teacher/Student trong organization.
  - Admin tao invite moi van duoc, dong thoi thay pending invites va active/disabled members rieng.
  - Admin co the disable/enable Teacher/Student, khong delete data/historical records.
- Vertical slice: backend API + frontend UI + tests + rendered/manual validation.

## Scope P0

- Lam:
  - Admin-only API list managed users: Teacher/Student trong organization cua Admin.
  - Admin-only API update profile status `active|disabled` cho Teacher/Student cung organization.
  - Frontend Admin `Nguoi dung` page: summary cards, search/filter role/status, DataTable, Pagination, enable/disable actions, loading/empty/error state.
  - Cap nhat docs/evidence.
- Khong lam:
  - Khong xoa user khoi Supabase Auth hoac `auth.users`.
  - Khong doi role user, khong move organization.
  - Khong quan ly Admin/System Admin trong page organization Admin.
  - Khong them billing/MFA/password reset/impersonation.
- Dependencies da xong: V4-029, V4-035, V4-043, V4-044.
- Source-of-truth da doc: V4 docs, production gap, harness docs, progress/handoff, Supabase official docs `managing-user-data.md`, `row-level-security.md`, changelog.
- Khong dung: `README.md`.

## Test Plan Truoc Khi Code

### Backend

- Them test service trong `backend/tests/test_auth.py`:
  - Admin list managed users chi tra `teacher/student` cung organization.
  - Filter role/status hoat dong.
  - Admin disable/reactivate Teacher/Student cung organization.
  - Admin khong disable Admin/System Admin.
  - Admin khong disable user organization khac.
  - Teacher/Student goi service bi 403.
- Cap nhat boundary test `backend/tests/test_auth_module_boundaries.py` neu them schema/service/route exports.

### Frontend

- Them API tests trong `frontend/src/api/auth.test.ts`:
  - `fetchManagedUsers` goi `/auth/users`.
  - `updateManagedUserStatus` PATCH `/auth/users/{id}` voi status.
- Them helper test neu tach filter/sort summary logic cho Admin user management.
- Chay:
  - `pnpm --dir frontend typecheck`
  - `pnpm --dir frontend lint`
  - `pnpm --dir frontend test -- --run`
  - `pnpm --dir frontend build`

### Integration / QA

- Playwright rendered QA fallback:
  - Login Admin quick role.
  - Mo page `Nguoi dung`.
  - Xac nhan member table, filters, invite form, pending invite table.
  - Click disable/enable tren Teacher/Student trong memory mode neu an toan; reload list.

### Security

- Backend enforce role/org/scope; frontend chi la surface.
- Khong expose secret/backend URL.
- Khong delete auth user; disable profile de current-user guard chan request sau.

## Manual Validation

Prerequisite:
- Backend/frontend local dang chay, `ENABLE_DEMO_LOGIN=true`.

Steps:
1. Login Admin.
2. Mo page `Nguoi dung`.
3. Xem summary Teacher/Student/disabled va bang `Teacher & Student`.
4. Search email/name, loc role `Teacher`/`Student`, loc status `Active`/`Disabled`.
5. Bam `Tạm khóa` mot Teacher/Student; xac nhan row chuyen disabled.
6. Bam `Mở lại`; xac nhan row chuyen active.
7. Tao invite Teacher/Student moi va xac nhan invite table cap nhat.

Expected:
- Bang members chi hien Teacher/Student cung organization.
- Action co loading/feedback ro.
- Pending invites van hien rieng voi invite code.

Negative check:
- Teacher/Student khong goi duoc API managed users.
- Admin khong thay/khong thao tac Admin/System Admin.
- Admin khong thao tac user organization khac.

## Implementation Plan

Backend:
- Them schemas `ManagedUserResponse`, `ManagedUserStatusUpdateRequest` trong auth schemas.
- Them service functions `list_managed_users`, `update_managed_user_status`.
- Dung `AuthRepository.list_profiles(status=None)` va `upsert_profile` de cap nhat status co guard.
- Them routes:
  - `GET /api/v1/auth/users`
  - `PATCH /api/v1/auth/users/{profile_id}`

Frontend:
- Them types/API client.
- Cap nhat Admin `Nguoi dung` page de load song song invites + managed users.
- Them local filter/search/pagination state, DataTable actions, summary cards.
- Dung existing UI primitives.

Docs:
- Cap nhat feature evidence, progress, product review/README neu can.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline truoc code: `./init.sh` pass frontend 17 files/86 tests + build va backend 203 tests.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_auth.py -q` pass 30.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_openapi_contract.py tests/test_auth_module_boundaries.py -q` pass 12.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_auth.py tests/test_openapi_contract.py tests/test_auth_module_boundaries.py -q` pass 39.
- `pnpm --dir frontend typecheck` pass.
- `pnpm --dir frontend exec vitest run src/api/auth.test.ts src/features/admin/userManagement.test.ts src/workspacePages.test.ts` pass 3 files/19 tests.
- `pnpm --dir frontend exec node /tmp/v4-045-admin-user-management-qa.mjs` pass Playwright rendered QA: Admin quick login, page `Nguoi dung`, `Teacher Demo`/`Student Demo`, filter Teacher, disable va reactivate `Teacher Demo`; screenshot `/tmp/v4-045-admin-user-management.png`.
- Final `./init.sh` pass: frontend 18 files/89 tests + build; backend 209 tests.

Ket qua:
- Done. Admin `Nguoi dung` da la workspace quan ly Teacher/Student thuc te:
  - Backend API list/update managed users organization-scoped.
  - Frontend summary/search/filter/table/pagination/disable-enable.
  - Invite form/table van o cung page nhung tach voi member list.
  - Demo-login seed demo profiles vao repository persistence neu thieu, khong reactivate profile da disabled.

## Files Expected To Change

- `feature_list.json`
- `docs/harness/exec-plans/completed/V4-045-admin-user-management.md`
- `backend/app/auth/schemas.py`
- `backend/app/auth/services.py`
- `backend/app/auth/routes.py`
- `backend/tests/test_auth.py`
- `frontend/src/api/auth.ts`
- `frontend/src/api/auth.test.ts`
- `frontend/src/features/admin/AdminWorkspace.tsx`
- `frontend/src/App.css`
- `progress.md`
- `session-handoff.md`

## Quality Gate

- [x] Backend permission tests pass.
- [x] Frontend API/UI helper tests pass.
- [x] Frontend targeted typecheck/tests pass.
- [x] Final `./init.sh` pass.
- [x] Manual validation steps documented.
- [x] No hardcoded secrets/backend URL.
