# Exec Plan - local-api-proxy-failed-fetch-fix

## Muc Tieu

- Feature: P0-001 reliability bugfix cho local/demo startup.
- User stories: US-001, US-002.
- Ket qua user can validate: Lan dau mo frontend khong con `Failed to fetch` o demo accounts khi truy cap qua Vite/preview URL.
- Vertical slice: Frontend dev config + env docs + verification.

## Scope P0

- Lam:
  - Cho frontend dev server proxy `/api` ve backend `127.0.0.1:3000`.
  - Dung `URL_BACKEND=/api/v1` cho local dev de browser khong goi nham `localhost` cua may user.
  - Cap nhat huong dan run local neu can.
- Khong lam:
  - Khong doi auth strategy.
  - Khong them persistence/Supabase Auth.
  - Khong mo P1/P2.
- Dependencies da xong: P0-001 den P0-011 da done.
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md` de suy luan nghiep vu/scope.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend: `./init.sh` de chay full pytest.
- Frontend: `./init.sh` de chay typecheck/lint/vitest/build.
- Integration/e2e: `curl http://127.0.0.1:5173/api/v1/auth/demo-accounts` phai proxy ve backend va tra 200.
- Security/access: `./init.sh` frontend guard khong hardcode backend URL/secret keys.

### Manual validation

Prerequisite:
- Backend chay port `3000`, frontend chay port `5173`.

Steps:
1. Mo frontend bang URL Vite/preview dang dung.
2. Quan sat man hinh sign-in.
3. Bam demo account Teacher/Admin/Student va dang nhap voi password demo.

Expected:
- Demo accounts hien ra, khong con `Failed to fetch`.
- Login vao dung workspace.

Negative check:
- Tat backend roi reload frontend thi UI phai bao loi fetch thay vi crash.

## Implementation Plan Theo Vertical Slice

Backend:
- Khong doi backend.

Frontend:
- Cap nhat `vite.config.ts` them dev proxy `/api -> http://127.0.0.1:3000`.

Tests:
- Chay `./init.sh`.
- Smoke Vite proxy bang curl.

Docs / Env:
- Cap nhat `.env.example` va README run instructions cho local dev proxy.
- Cap nhat `.env` local neu hien tai dang dung absolute localhost.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` truoc khi code: pass baseline.
- `curl -sS -i http://127.0.0.1:5173/api/v1/auth/demo-accounts`: 200 qua Vite proxy.
- `curl -sS -i http://127.0.0.1:5173/api/v1/health`: 200 qua Vite proxy.
- `git diff --check`: pass.
- `./init.sh` sau khi code/docs: pass.

Ket qua:
- Frontend test tang tu 30 len 31 tests, tat ca pass.
- Backend pytest 39 tests pass.
- Local `.env` da doi `URL_BACKEND=/api/v1`.
- Vite dev server proxy `/api` sang `http://127.0.0.1:3000`, nen frontend preview/forwarded URL khong con phu thuoc browser `localhost`.
- Frontend dev server da restart tai `0.0.0.0:5173`; backend van chay tai `127.0.0.1:3000`.

Manual validation da huong dan user:
- Mo frontend tai `http://127.0.0.1:5173` hoac forwarded/preview URL port `5173`.
- Man hinh sign-in phai hien demo accounts, khong con `Failed to fetch`.
- Login bang password demo de vao dung workspace.

## Files Changed

- `.env`
- `.env.example`
- `frontend/vite.config.ts`
- `frontend/src/config.test.ts`
- `README.md`
- `frontend/README.md`
- `docs/version1/MVP.md`
- `docs/version1/PRD_MVP.md`
- `docs/harness/DEMO_RUNBOOK.md`

## Blockers / Next Step

- Khong co blocker. User co the reload frontend va testing MVP.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
