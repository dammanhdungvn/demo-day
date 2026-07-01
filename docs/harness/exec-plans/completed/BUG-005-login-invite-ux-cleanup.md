# Exec Plan - BUG-005 Login invite activation UX cleanup

## Muc Tieu

- Feature: `BUG-005`
- User stories:
  - Invited Teacher/Student can join by invite code without a confusing login first screen.
  - Demo user can focus on quick role access and normal login first.
- Ket qua user can validate: login mac dinh gon hon, invite flow chuyen thanh secondary path `Co ma moi?`.
- Vertical slice: frontend UX + frontend tests + docs/evidence; backend invite API giu nguyen.

## Scope P0

- Lam:
  - An invite acceptance form khoi login first screen mac dinh.
  - Doi wording tu `Kich hoat invite` sang `Co ma moi?` va `Tham gia bang ma moi`.
  - Mo panel invite khi user bam secondary action.
  - Tu mo panel va prefill code neu URL co `invite_code` hoac `code`.
- Khong lam:
  - Khong xoa backend invite/register/JWT flow.
  - Khong doi API contract `/api/v1/auth/invites/accept`.
  - Khong them routing framework moi.
- Dependencies da xong: `V4-029`, `V4-034`, `V4-035`.
- Source-of-truth da doc: `docs/version5/README.md`, `docs/version5/PRODUCT_MARKET_REVIEW.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md` de suy luan scope.

## Cau Hoi / Context Chua Ro

- [x] Khong co.

## Test Plan Truoc Khi Code

### Automated tests

- Backend: khong doi backend; full `./init.sh` chay backend regression.
- Frontend:
  - Cap nhat `frontend/src/loginSecurity.test.ts` de chan wording `Kich hoat invite` va yeu cau wording moi.
  - Chay fail-first targeted test truoc implementation.
  - Chay targeted login test, typecheck, lint, full frontend test va build.
- Integration/e2e:
  - Playwright rendered smoke login desktop/mobile vi Browser plugin khong co trong toolset.
- Security/access:
  - Dam bao khong them backend URL/secret vao frontend source.

### Manual validation

Prerequisite:
- Backend chay `cd backend && uv run fastapi dev main.py --host 127.0.0.1 --port 3000`.
- Frontend chay `cd frontend && pnpm dev --host 127.0.0.1 --port 5173`.

Steps:
1. Mo `http://127.0.0.1:5173`.
2. Xac nhan login mac dinh chi tap trung quick role + email/password, invite la secondary action `Co ma moi?`.
3. Bam `Co ma moi?`, thay panel `Tham gia bang ma moi`.
4. Mo `http://127.0.0.1:5173/?invite_code=abc123` va xac nhan panel mo san, code duoc dien san.

Expected:
- Khong con visible copy `Kich hoat invite`.
- Invite flow van submit qua API hien co va co error/loading state.
- Demo login/normal login khong bi anh huong.

Negative check:
- Khong lo API URL, demo password, OpenAI/Supabase secret tren login.

## Implementation Plan Theo Vertical Slice

Backend:
- Khong doi.

Frontend:
- Them state `isInvitePanelOpen`.
- `LoginPanel` render invite form co dieu kien; mac dinh an.
- Them secondary action/button voi copy `Co ma moi?`.
- Them handler dong panel.
- Parse URL query `invite_code`/`code` khi chua co session de prefill va mo panel.

Tests:
- Update `loginSecurity.test.ts`.
- Chay targeted fail-first va after-fix.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`.
- Chuyen exec plan sang completed khi xong.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` truoc code -> pass frontend 15 files/72 tests + build va backend 199 tests.
- `pnpm --dir frontend exec vitest run src/loginSecurity.test.ts` fail-first -> fail dung ky vong vi source con `Kich hoat invite`.
- `pnpm --dir frontend exec vitest run src/loginSecurity.test.ts` -> pass 2 tests.
- `pnpm --dir frontend typecheck` -> pass.
- `pnpm --dir frontend lint` -> pass.
- `pnpm --dir frontend test -- --run` -> pass 15 files/73 tests.
- `pnpm --dir frontend build` -> pass.
- `pnpm --dir frontend exec node /tmp/bug-005-login-invite-qa.mjs` -> pass rendered QA desktop/mobile.
- `python3 -m json.tool feature_list.json` -> pass.
- `git diff --check` -> pass.
- `./init.sh` sau code -> pass frontend 15 files/73 tests + build va backend 199 tests.

Ket qua:
- Login mac dinh khong render form invite lon.
- Secondary action `Co ma moi?` mo panel `Tham gia bang ma moi`.
- Query `invite_code`/`code` prefill ma moi va tu mo panel.
- Mobile responsive fixed sau khi QA phat hien nut dong bi stretch.

Manual validation da huong dan user:
- Co trong section Manual validation.

## Files Changed

- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/src/loginSecurity.test.ts`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/harness/exec-plans/completed/BUG-005-login-invite-ux-cleanup.md`

## Blockers / Next Step

- Khong co blocker.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md` hoac khong co debt moi.
