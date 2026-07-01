# Exec Plan - V4-029 Auth registration and JWT lifecycle hardening

## Muc Tieu

- Feature: `V4-029 Auth registration and JWT lifecycle hardening`
- User stories: `US-405`, `US-413`
- Ket qua user can validate: Admin tao invite; invited user co workflow accept/register vao dung role/org; session lifecycle co expiry/revocation/disabled-profile guard ro hon; frontend co UI accept invite/register va error state khong mat role silently.
- Vertical slice: backend auth contract + frontend accept invite UI + tests/evidence.

## Scope P0

- Lam:
  - Them invite acceptance/register foundation khong expose service secret ra frontend.
  - Demo provider co duong accept invite deterministic cho local/test; Supabase provider co contract service/client boundary phu hop docs hien tai.
  - Hardening current-user/session checks cho disabled profile, expired invite, used invite, wrong email/role/org, token missing/invalid.
  - Frontend co accept invite/register panel co loading/error/success states.
  - Cap nhat docs/evidence.
- Khong lam:
  - Chua lam MFA, password reset email, magic link hoac OAuth providers trong slice nay.
  - Chua thay Supabase hosted email verification flow neu project config chua co.
  - Chua lam OpenAPI quality rieng; neu co tag/auth schema nho chi lam khi can cho route moi.
- Dependencies da xong: `V2-010`, `V2-011`, `V4-014`, `V4-028`.
- Source-of-truth da doc: `AGENTS.md`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`, `feature_list.json`, reliability/security docs, Supabase skill/docs.
- Khong dung: `README.md`.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Add tests in `backend/tests/test_auth.py` cho accept invite:
    - success maps invited email/role/org va marks invite used.
    - expired invite returns 400/403 structured error.
    - used invite cannot be accepted twice.
    - wrong email cannot accept invite.
    - disabled profile/session rejected by `get_current_user`.
  - Add boundary tests in `backend/tests/test_auth_module_boundaries.py` neu them schema/client/service names moi.
- Frontend:
  - Update `frontend/src/api/auth.test.ts` cho `acceptInvite` client.
  - Update `frontend/src/auth/session.test.ts` neu session fields/status thay doi.
  - Add helper tests if register/accept state logic extracted.
- Integration:
  - `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_auth.py tests/test_auth_module_boundaries.py -q`
  - `pnpm --dir frontend exec vitest run src/api/auth.test.ts src/auth/session.test.ts`
  - Full frontend/backend and final `./init.sh`.

### Manual validation

1. Admin tao invite Teacher/Student.
2. Open accept/register panel, nhap token/email/name/password va accept.
3. Login bang user moi, xac nhan role/org dung workspace.
4. Thu accept expired/used/wrong-email invite va xac nhan error ro.
5. Logout/re-login/refresh session khong mat role silently.

## Implementation Plan Theo Vertical Slice

Backend:
- [x] Extend auth schemas voi accept invite request/response.
- [x] Extend auth repository/service to accept invite atomically in memory/Postgres.
- [x] Supabase Auth bridge: expose register/sign-up contract where safe; no service key in frontend.
- [x] Add route `POST /api/v1/auth/invites/accept` theo existing auth router style.

Frontend:
- [x] Add `acceptInvite` API client.
- [x] Add accept invite/register UI in login/auth surface without replacing demo quick login.
- [x] Persist session response exactly as existing session storage.

Docs:
- [x] Update V4 product review, progress, handoff.
- [x] Record remaining auth enhancement debt in `TD-018`.

## Evidence Sau Khi Lam

Commands da chay:
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_auth.py -q` -> 16 passed.
- `pnpm --dir frontend exec vitest run src/api/auth.test.ts` -> 7 passed.
- `pnpm --dir frontend exec vitest run src/api/auth.test.ts src/auth/session.test.ts` -> 2 files/10 tests passed.
- `pnpm --dir frontend run build` -> pass.
- `pnpm --dir frontend exec node /tmp/v4-029-ui-check.mjs` -> rendered QA pass, console issues empty.
- `./init.sh` -> pass; frontend 13 files/59 tests + build, backend 144 tests.

Ket qua:
- Backend co invite acceptance/register contract `AcceptInviteRequest`, route `POST /api/v1/auth/invites/accept`, profile `status=active|disabled`, invite `expires_at`, repository methods `get_invite_by_code` va `accept_invite` cho memory/Postgres.
- Supabase Auth adapter co `sign_up_with_password`; service van map profile/role/org tu invite backend-side va khong dua service secret ra frontend.
- Demo provider co registered-account path de invited Teacher/Student login lai bang password vua dat.
- Current-user/session guard reject disabled Supabase profile, ke ca khi access token con hop le.
- Frontend login surface co panel `Kich hoat invite`; accept thanh cong luu session va dieu huong vao workspace role.
- Playwright fallback rendered QA: desktop login screenshot, accept invite tao qua API, URL sang `/teacher`, body co `QA Teacher` va `KHONG GIAN SOAN GIANG`, mobile login first viewport; screenshots `/tmp/v4-029-auth-invite-desktop.png`, `/tmp/v4-029-auth-invite-accepted.png`, `/tmp/v4-029-auth-invite-mobile.png`.

Manual validation da huong dan user:
- Admin dang nhap demo, tao Teacher/Student invite trong Admin workspace.
- Copy `invite_code`, logout hoac mo browser moi, dien panel `Kich hoat invite` voi email dung invite/name/password moi.
- Xac nhan app dieu huong vao `/teacher` hoac `/student` va hien dung role/org.
- Thu sai email, invite da accept, invite expired de xac nhan API tra error va UI hien loi.
- Supabase mode: disable profile trong `profiles.status='disabled'`, goi `/me` voi JWT cu phai bi 403.

## Files Changed

- `feature_list.json`
- `backend/app/auth/schemas.py`
- `backend/app/auth/ports.py`
- `backend/app/auth/repositories.py`
- `backend/app/auth/services.py`
- `backend/app/auth/routes.py`
- `backend/app/auth/supabase_client.py`
- `backend/app/auth/__init__.py`
- `backend/app/main.py`
- `backend/tests/test_auth.py`
- `frontend/src/api/auth.ts`
- `frontend/src/api/auth.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `docs/harness/exec-plans/completed/V4-029-auth-registration-jwt-lifecycle.md`

## Blockers / Next Step

- Khong co blocker hien tai.
- Next: `V4-030 OpenAPI and Swagger contract quality`.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co test plan truoc code.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, ghi vao `docs/harness/exec-plans/tech-debt-tracker.md` (`TD-018`).
