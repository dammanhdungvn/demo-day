# Exec Plan - P0-001 Project setup, env baseline, verification

## Muc Tieu

- Feature: `P0-001 - Project setup, env baseline, verification`
- User stories: `US-001`
- Ket qua user can validate: backend co `/api/v1/health`, frontend Vite React TSX doc API base tu env va hien trang thai health.
- Vertical slice: backend FastAPI + frontend Vite React + tests/build + manual validation.

## Scope P0

- Lam:
  - Scaffold `backend/` bang `uv init --app`.
  - Tao FastAPI app voi base path `/api/v1` va health endpoint.
  - Tao pytest health endpoint test.
  - Scaffold `frontend/` bang `pnpm create vite frontend --template react-ts`.
  - Tao API client doc backend URL tu root env `URL_BACKEND` qua Vite config.
  - Tao frontend smoke UI goi health endpoint va states loading/success/error.
  - Them scripts typecheck/lint/test/build neu can de `./init.sh` verify.
- Khong lam:
  - Auth/demo accounts.
  - Supabase schema/RLS.
  - Upload/RAG/course generation.
  - UI polish nang cao hoac full Lesson Studio.
- Dependencies da xong: khong co.
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker cho P0-001.
- [ ] Can hoi user:

Assumption: muc tieu user moi nhan manh upload tai lieu hoc tap, nhung P0-001 chi la setup nen chua can quyet dinh lai scope upload vs pre-ingest.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - `pytest` test health route `/api/v1/health` da register va payload handler co `status: "ok"`.
  - `python -m compileall main.py tests`.
- Frontend:
  - `pnpm --dir frontend run typecheck`.
  - `pnpm --dir frontend run lint`.
  - `pnpm --dir frontend run test`.
  - `pnpm --dir frontend run build`.
- Integration/e2e:
  - Chua can E2E browser trong P0-001, vi chi scaffold baseline. Manual validation du de user kiem tra health.
- Security/access:
  - `./init.sh` guard frontend khong hardcode `localhost:3000/api/v1` va khong expose secret key names.

### Manual validation

Prerequisite:
- `.env` hoac `.env.example` co `URL_BACKEND=http://localhost:3000/api/v1`.

Steps:
1. Chay backend: `cd backend && uv run fastapi dev main.py --host 0.0.0.0 --port 3000`.
2. Mo `http://localhost:3000/api/v1/health`.
3. Chay frontend: `pnpm --dir frontend dev`.
4. Mo frontend va xem health card.

Expected:
- Backend health tra JSON `{"status":"ok",...}`.
- Frontend hien backend URL lay tu env va health status success.

Negative check:
- Doi `URL_BACKEND` sai va reload frontend, UI hien error state ro rang.
- `rg "localhost:3000/api/v1" frontend/src` khong co ket qua.

## Implementation Plan Theo Vertical Slice

Backend:
- Scaffold uv app.
- Thay `main.py` bang FastAPI app.
- Them pytest health route/payload test, khong dung `TestClient` trong baseline de tranh treo dependency.

Frontend:
- Scaffold Vite React TS.
- Them `.env.example` frontend neu can.
- Tao `src/config.ts`, `src/api/health.ts`, `src/App.tsx` toi gian.

Tests:
- Backend pytest.
- Frontend Vitest smoke test cho config/API client.
- Chay `./init.sh`.

Docs / Env:
- Cap nhat progress/handoff/evidence.
- Khong doc hoac in `.env` secrets.

## Evidence Sau Khi Lam

Commands da chay:
- `pnpm --dir frontend run typecheck`
- `pnpm --dir frontend run lint`
- `pnpm --dir frontend run test`
- `pnpm --dir frontend run build`
- `./init.sh`
- `git diff --check`

Ket qua:
- Frontend typecheck/lint/test/build pass.
- Backend pytest trong `./init.sh` pass voi `2 passed`; health test khong dung `TestClient.get()` nen khong treo baseline.
- `./init.sh` pass va verify khong hardcode `localhost:3000/api/v1` trong `frontend/src`.
- API base frontend dung root env `URL_BACKEND` qua `vite.config.ts`; khong can bien env frontend rieng.

Manual validation da huong dan user:
- Backend: `cd backend && uv run fastapi dev main.py --host 0.0.0.0 --port 3000`.
- Health URL: `http://localhost:3000/api/v1/health`.
- Frontend: `pnpm --dir frontend dev`.
- Expected: frontend health card hien API base tu `URL_BACKEND` va health status success.

## Files Changed

- `.env.example`
- `AGENTS.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `init.sh`
- `backend/`
- `frontend/`
- `docs/harness/ARCHITECTURE.md`
- `docs/harness/SOP.md`
- `docs/harness/exec-plans/completed/P0-001-project-setup.md`

## Blockers / Next Step

- Khong con blocker cho P0-001.
- Next: `P0-002 - Auth, demo accounts, role routing`.
- Can xac nhan demo account/auth strategy neu docs version1 khong du ro truoc khi code P0-002.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
