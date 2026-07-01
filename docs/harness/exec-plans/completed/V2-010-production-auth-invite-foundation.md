# Exec Plan - V2-010 Production auth provider and invite profile foundation

## Muc Tieu

- Feature: Production auth provider and invite profile foundation
- User stories: `US-201`, `US-202`, `US-203`, `US-207`, `US-208`
- Ket qua user can validate: Demo auth van chay; khi set `AUTH_PROVIDER=supabase`, backend login/refresh/me/logout qua Supabase Auth va map user vao profile co role/organization; Admin co UI tao/list invite Teacher/Student.
- Vertical slice: backend auth provider + profiles/orgs/invites schema + frontend auth/invite UI + tests.

## Scope P0

- Lam:
  - Them `AUTH_PROVIDER=demo|supabase`, default demo de giu V1.
  - Them `AUTH_REPOSITORY=memory|postgres`, default memory; production dung Postgres.
  - Supabase Auth password login/refresh/get-user/logout bridge qua backend.
  - Them schema idempotent `organizations`, `profiles`, `organization_invites`, RLS enabled va revoke grants tu `anon/authenticated`.
  - Profile map `id`, `email`, `name`, `role`, `organization_id`; user Supabase chua profile bi 403.
  - Admin create/list pending invites voi duplicate pending idempotent.
  - Frontend store optional refresh token/expires_in va Admin invite panel.
- Khong lam:
  - Khong scope toan bo course/class/document/lesson theo organization trong slice nay; lam feature tiep theo.
  - Khong tao Supabase Auth user tu service role/Admin API trong slice nay.
  - Khong them password reset; invite flow UI la acceptance thay the theo US-201.
- Dependencies da xong: `V2-009`
- Source-of-truth da doc: `docs/version2/PRD_V2_PRODUCTION.md`, `docs/version2/USER_STORIES_V2.md`, Supabase Auth password/getUser docs va changelog security grants.
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker; production data org scoping de lai V2-011.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Demo auth regression van pass voi `AUTH_PROVIDER=demo`.
  - Supabase fake client login success tra session + profile role/organization.
  - Supabase fake client `get_user` duoc goi cho bearer token trong `/me` path.
  - Supabase user khong co profile bi 403.
  - Refresh token goi fake Supabase client va tra session moi.
  - Admin create/list invite; duplicate pending invite idempotent; Student forbidden.
  - Postgres schema smoke tao org/profile/invite tam, cleanup.
- Frontend:
  - `refreshSession`, `fetchInvites`, `createInvite` API tests.
  - Session storage preserves optional refresh token/expires_in.
- Integration:
  - `./init.sh` full.
- Security/access:
  - Frontend secret guard van pass.
  - Schema RLS/revoke grants cho auth foundation tables.

### Manual validation

Prerequisite:
- Backend/frontend local running.

Steps:
1. De `AUTH_PROVIDER=demo`, login Admin/Teacher/Student demo.
2. Admin workspace tao invite Teacher/Student bang email moi.
3. Dat `AUTH_PROVIDER=supabase`, `AUTH_REPOSITORY=postgres`, tao profile cho Supabase user that trong DB.
4. Login bang email/password Supabase user.
5. Goi `/api/v1/me` voi access token.

Expected:
- Demo mode khong regress.
- Invite hien pending, duplicate email/role/org khong tao ban ghi lap.
- Supabase mode tra user profile co role/organization, token invalid bi 401.
- Supabase user chua profile bi 403.

Negative check:
- Student create invite bi 403.
- Frontend bundle khong co Supabase service key.

## Implementation Plan Theo Vertical Slice

Backend:
- Models: auth profile/org/invite, refresh request.
- Repository: memory/postgres auth repository va schema SQL.
- Supabase auth client: sign-in password, get user, refresh, logout.
- Services/routes: login branch theo `AUTH_PROVIDER`, `/auth/refresh`, `/auth/invites`, `/me` production path.

Frontend:
- Auth type/session storage optional refresh token/expires_in.
- API client refresh/invites.
- Admin invite panel trong workspace.

Tests:
- Backend `test_auth.py` mo rong theo fake client/repository.
- Frontend `auth.test.ts`, `session.test.ts`.
- Full `./init.sh`.

Docs / Env:
- Cap nhat `.env.example`, feature evidence, progress/handoff/overnight.
- Debt neu con demo default/organization scoping chua full.

## Evidence Sau Khi Lam

Commands da chay:
- `uv run pytest tests/test_auth.py -q` -> pass 12.
- `pnpm exec vitest run src/api/auth.test.ts src/auth/session.test.ts` -> pass 2 files / 9 tests.
- `uv run python -m compileall main.py` -> pass.
- `pnpm exec tsc --noEmit` -> pass.
- `uv run pytest tests/test_auth.py tests/test_knowledge_rag.py -q` -> pass 35.
- `pnpm run lint` -> pass `oxlint`.
- `./init.sh` -> pass frontend 12 files / 53 tests + build, backend 88 tests.
- Postgres smoke -> `auth_repository_smoke_ok pending_invites=1 duplicate_idempotent=true`.
- Playwright rendered QA fallback vi Browser plugin khong co -> Admin demo login, tao invite, desktop/mobile screenshots, console issues empty.

Ket qua:
- Backend co provider abstraction `AUTH_PROVIDER=demo|supabase` va `AUTH_REPOSITORY=memory|postgres`.
- Supabase mode password login/refresh/get-user/logout qua backend, khong dua service role key ra frontend.
- `profiles` gan `role` va `organization_id`; user Supabase chua provisioned bi 403.
- Admin create/list invite Teacher/Student, duplicate pending invite idempotent; Student bi 403.
- Frontend luu optional refresh token/expires_in, co refresh fallback khi verify session fail, Admin workspace co invite form/list pending invites.

Manual validation da huong dan user:
- Local demo: `http://127.0.0.1:5173/`, bam `admin@teachflow.local`, tao invite trong panel `Invite người dùng`.
- Production auth manual: dat `AUTH_PROVIDER=supabase`, `AUTH_REPOSITORY=postgres`, provision `profiles.id` bang Supabase Auth user id, login email/password that, goi `/api/v1/me` de xac nhan role/organization.
- Negative: Student khong tao/list invite duoc; user Supabase chua profile tra 403.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/active/V2-010-production-auth-invite-foundation.md`
- `.env.example`
- `backend/main.py`
- `backend/tests/test_auth.py`
- `frontend/src/api/auth.ts`
- `frontend/src/api/auth.test.ts`
- `frontend/src/auth/session.ts`
- `frontend/src/auth/session.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`

## Blockers / Next Step

- Khong co blocker cua V2-010.
- Next recommended feature: V2 org scoping cho course/class/document/lesson theo `organization_id`, vi V2-010 moi la auth/profile foundation.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md` hoac xac nhan khong co.
