# Exec Plan - V4-051 Production real-account login only

## Muc Tieu

- Feature: `V4-051 Production real-account login only`.
- User stories:
  - User khong muon demo login nua.
  - Admin/Teacher/Student phai la account that qua Supabase Auth va profile/invite trong Postgres.
- Ket qua user can validate: login screen chi con email/password va ma moi; backend local/prod mac dinh tat demo login; user that dang nhap duoc neu Supabase account co profile DB.
- Vertical slice: env/default + backend auth guard tests + frontend login UI/runtime + manual validation.

## Scope P0

- Lam:
  - Doi `.env.example` production-first: `AUTH_PROVIDER=supabase`, `AUTH_REPOSITORY=postgres`, `LEARNING_REPOSITORY=postgres`, `ENABLE_DEMO_LOGIN=false`.
  - Doi local `.env` non-secret auth mode sang `ENABLE_DEMO_LOGIN=false` va giu Supabase/Postgres.
  - Bo demo quick-access role cards va demo API calls khoi `frontend/src/App.tsx`.
  - Them/cap nhat tests chan demo login runtime trong frontend va backend default.
  - Cap nhat runbook/manual validation cho real accounts.
- Khong lam:
  - Khong tao user/password that trong source.
  - Khong in hoac sua secret Supabase/OpenAI values.
  - Khong xoa hoan toan demo service/tests vi local regression van can opt-in.
- Dependencies da xong:
  - `V2-010`, `V4-029`, `V4-043`, `BUG-006`.
- Source-of-truth da doc:
  - `docs/version2/PRD_V2_PRODUCTION.md`
  - `docs/version4/PRODUCTION_GAP_ANALYSIS.md`
  - `docs/harness/SOP.md`
  - `feature_list.json`
  - `progress.md`, `session-handoff.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co. User da chot khong dung demo login.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Test service default `ENABLE_DEMO_LOGIN` missing => no public demo accounts va quick login 404.
  - Giu tests opt-in demo login khi explicit `ENABLE_DEMO_LOGIN=true`.
- Frontend:
  - Raw/security test `App.tsx` khong import/goi `fetchDemoAccounts`, `demoLogin`, khong render `account-button login-role-*`.
  - Login copy dung tai khoan that/mã mời.
- Integration/e2e:
  - `./init.sh` full gate.
- Security/access:
  - Static guard frontend khong hardcode backend URL/secrets.

### Manual validation

Prerequisite:
- `.env` co `AUTH_PROVIDER=supabase`, `AUTH_REPOSITORY=postgres`, `LEARNING_REPOSITORY=postgres`, `ENABLE_DEMO_LOGIN=false`.
- Supabase Auth co user owner/admin/teacher/student that, va Postgres profile/invite tu flow app.

Steps:
1. Restart backend/frontend.
2. Mo `http://127.0.0.1:5173/`.
3. Xac nhan khong co Admin/Teacher/Student demo role cards.
4. Dang nhap bang Supabase account that da co profile.
5. Owner login `/system`, tao organization va tao invite Admin dau tien neu can bootstrap tenant.
6. Admin tao invite Teacher/Student; user accept invite bang ma moi de tao account that.

Expected:
- Login thanh cong vao workspace theo role tu profile DB.
- `GET /api/v1/auth/demo-accounts` tra `[]` khi demo disabled.
- `POST /api/v1/auth/demo-login` tra 404 khi demo disabled.

Negative check:
- Demo role cards khong hien.
- Demo password/quick login khong co trong UI.

## Implementation Plan Theo Vertical Slice

Backend:
- Them default-disabled test neu env missing.
- Neu can, giu route demo nhung chi opt-in explicit `ENABLE_DEMO_LOGIN=true`.

Frontend:
- Bo demo account state, demo API imports, role card render va handler quick login khoi `App.tsx`.
- Cap nhat copy login thanh real account first.

Tests:
- Cap nhat `loginSecurity.test.ts` va auth tests.
- Cap nhat frontend API tests neu demo API client van duoc giu cho dev opt-in.

Docs / Env:
- Cap nhat `.env.example`, `.env` non-secret auth flags, `docs/harness/DEMO_RUNBOOK.md`, progress/handoff/evidence.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline `./init.sh` pass truoc code: frontend 21 files/104 tests/build, backend 221 tests.
- Fail-first/backend targeted: `UV_CACHE_DIR=/home/dammanhdungvn/Workspaces/ai-in-action/demo-day/.cache/uv uv run pytest tests/test_auth.py -q` fail dung ky vong khi `.env` con `ENABLE_DEMO_LOGIN=true`.
- Sau fix targeted frontend: `pnpm --dir frontend exec vitest run src/loginSecurity.test.ts src/api/auth.test.ts` pass 2 files/16 tests.
- Sau fix targeted backend: `uv run pytest tests/test_auth.py -q` pass 33.
- `python3 -m json.tool feature_list.json` pass.
- `git diff --check` pass.
- Final `./init.sh` pass.
- Runtime smoke:
  - `GET /api/v1/health` ok.
  - `GET /api/v1/auth/demo-accounts` tra `[]`.
  - `POST /api/v1/auth/demo-login` tra 404 `Demo login is disabled`.
  - Frontend `/` tra 200.

Ket qua:
- Login UI khong con demo role cards va khong goi demo auth API trong `App.tsx`.
- `.env` local va `.env.example` deu production-first cho real accounts.
- Account creation path that la Supabase Owner allowlist -> System Admin organization/admin invite -> Admin invite Teacher/Student -> accept invite.

Manual validation da huong dan user:
- Xem `docs/harness/DEMO_RUNBOOK.md` muc Bootstrap Account That va Manual Product Flow.

## Files Changed

- `.env`
- `.env.example`
- `frontend/src/App.tsx`
- `frontend/src/loginSecurity.test.ts`
- `backend/tests/test_auth.py`
- `docs/harness/DEMO_RUNBOOK.md`
- `docs/version5/PRODUCTION_READINESS_AUDIT.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/harness/exec-plans/completed/V4-051-production-real-account-login.md`

## Blockers / Next Step

- Khong co blocker. User can tao/login account that theo runbook.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md` hoac xac nhan khong co debt moi.
