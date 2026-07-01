# Exec Plan - BUG-006 Login backend API readiness

## Muc Tieu

- Feature/hotfix: `BUG-006 Login backend API readiness and connection UX`.
- User goal: tam dung frontend Job Center dang lam, quay lai lam frontend login truoc va connect voi API backend.
- Product problem: Login la diem vao san pham; neu backend chua ready thi user thay loi mo hoac click vao role ma khong hieu API co chay khong.

## Scope

- Frontend login:
  - Goi `fetchHealth` va `fetchDemoAccounts` qua `URL_BACKEND=/api/v1`/Vite proxy.
  - Them status ngan tren login card: dang ket noi, san sang, loi ket noi.
  - Disable quick role, email/password login va invite form khi backend chua ready.
  - Them nut retry connection.
  - Khong hien backend URL, API base, demo password.
- API client:
  - Auth client doc JSON error detail tu backend.
  - Error helper map network/auth errors sang copy than thien.
- Khong lam trong hotfix:
  - Khong doi backend auth behavior.
  - Khong tiep tuc Job Center UI dang paused.
  - Khong them landing page/copy dai.

## Test Plan Truoc Khi Code

- Frontend unit:
  - Auth API client parse backend `detail` cho login error.
  - Error helper map `Failed to fetch` va invalid credential.
  - Login security raw test van cam API URL/demo password.
- Rendered QA:
  - Desktop login: status `San sang`, co 3 role cards.
  - Click Teacher quick login: vao `/teacher`, workspace hien user role, khong API 4xx/5xx.
  - Mobile login: status `San sang`, co 3 role cards, khong overflow ro.
  - Backend-error state: mock health fail, login hien `Khong ket noi duoc he thong`.

## Implementation Summary

- `frontend/src/App.tsx`: them `BackendConnectionState`, `refreshLoginConnection`, status panel trong `LoginPanel`, auth controls disabled khi backend chua ready, retry button.
- `frontend/src/api/auth.ts`: parse JSON error detail thay vi status-only.
- `frontend/src/errors.ts`: map network/auth errors sang copy user-facing.
- `frontend/src/App.css`: style `.login-system-status`.
- Tests: `frontend/src/errors.test.ts`, update `frontend/src/api/auth.test.ts`.

## Evidence

- Direct backend/proxy smoke:
  - `curl http://127.0.0.1:3000/api/v1/health` pass.
  - `curl http://127.0.0.1:3000/api/v1/auth/demo-accounts` pass.
  - `curl http://127.0.0.1:5173/api/v1/health` pass.
  - `curl http://127.0.0.1:5173/api/v1/auth/demo-accounts` pass.
- Frontend tests:
  - `pnpm --dir frontend exec vitest run src/api/auth.test.ts src/errors.test.ts src/loginSecurity.test.ts src/config.test.ts` pass 21.
  - `pnpm --dir frontend typecheck` pass.
  - `pnpm --dir frontend lint` pass.
  - `pnpm --dir frontend test -- --run` pass 20 files/100 tests.
  - `pnpm --dir frontend build` pass.
  - `git diff --check` pass.
  - `./init.sh` pass frontend 20 files/100 tests + build va backend 219 tests.
- Rendered QA (Browser plugin absent, dung Playwright fallback):
  - Desktop login status `San sang`, 3 role buttons, click Teacher vao `/teacher`, co `Giang vien Demo`, no console issues/no API bad responses.
  - Mobile login status `San sang`, 3 role buttons, no console issues.
  - Backend-error route mock hien `Khong ket noi duoc he thong`.
  - Screenshots: `/tmp/login-api-ready.png`, `/tmp/login-teacher-connected.png`, `/tmp/login-api-ready-mobile.png`, `/tmp/login-api-error-state.png`.

## Manual Validation

1. Chay backend:

```bash
cd backend
UV_CACHE_DIR=.uv-cache uv run fastapi dev main.py --host 127.0.0.1 --port 3000
```

2. Chay frontend tu root repo:

```bash
pnpm --dir frontend run dev --host 127.0.0.1 --port 5173
```

Neu dang `cd frontend/`, chay:

```bash
pnpm run dev --host 127.0.0.1 --port 5173
```

3. Mo `http://127.0.0.1:5173/`, xac nhan status `San sang`, click Teacher/Admin/Student de vao workspace.

## Result

- Done 2026-06-30.
- V2-014 Job Center van paused/blocked theo user request, chua final DoD.
