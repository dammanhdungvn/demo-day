# Exec Plan - BUG-007 Review fixes and real account shortcuts

## Muc Tieu

- Feature: BUG-007 Review fixes and real account shortcuts.
- User stories:
  - As an operator, clean checkout/build must include every asset/script referenced by source or package scripts.
  - As an Admin, retrying AI generation jobs from the org Job Center must not leave jobs stuck in `retrying`.
  - As a recruiter, I want easy access to real Admin/Teacher/Student database accounts from the login screen without using demo auth.
- Ket qua user can validate:
  - Login screen shows real account cards for Admin, Teacher and Student when configured from env, and clicking a card fills real credentials into the normal email/password login form.
  - Auth still uses `/auth/login`; no `/auth/demo-login` or `/auth/demo-accounts` is called by runtime login UI.
  - Admin cannot accidentally retry Teacher-owned AI generation jobs into a stuck state.
- Vertical slice: review fixes + frontend login helper for real database accounts + tests/docs.

## Scope P0

- Lam:
  - Ensure referenced hero image and QA script are present in the patch.
  - Add env-driven public real account shortcut config for Admin/Teacher/Student.
  - Render account cards that prefill the normal login form; no demo login endpoint.
  - Add guard so Admin retry of AI generation jobs is rejected before status changes.
  - Add/adjust tests for retry guard, login real-account cards, asset/script presence.
- Khong lam:
  - Khong hardcode API keys, Supabase service role, AI keys or backend URL.
  - Khong restore demo quick-login runtime cards.
  - Khong implement permanent hard-delete user workflow.
- Dependencies da xong:
  - V4-051, V4-052, V2-014.
- Source-of-truth da doc:
  - `docs/version5/README.md`
  - `docs/harness/SOP.md`
  - `docs/harness/QUALITY_SCORE.md`
  - `docs/harness/RELIABILITY_SECURITY.md`
  - `feature_list.json`
  - `progress.md`
  - `session-handoff.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Add/adjust `test_retry_generation_job_rejects_admin_ai_retry_before_status_update`.
  - Run targeted `uv run pytest tests/test_generation_jobs.py -q`.
- Frontend:
  - Add tests that login source contains real account shortcut UI and no demo endpoint usage.
  - Add tests that referenced hero asset and `scripts/admin-real-account-qa.mjs` exist.
  - Run targeted `pnpm --dir frontend exec vitest run src/loginSecurity.test.ts`.
- Integration/e2e:
  - Re-run `node --check frontend/scripts/admin-real-account-qa.mjs`.
- Security/access:
  - Confirm `./init.sh` secret/backend URL guard still passes.
  - Real account cards are env-driven and use regular `/auth/login`.

### Manual validation

Prerequisite:
- `.env.local` has real Supabase/Postgres account credentials for Admin, Teacher and Student.
- Backend and frontend are running.

Steps:
1. Open login page.
2. Click each real account card: Admin, Teacher, Student.
3. Confirm email/password fields are filled from configured real account values.
4. Submit login and confirm route goes to the matching workspace.

Expected:
- Recruiter can access real accounts quickly.
- No demo login request happens.

Negative check:
- If public password env is not configured, account card only fills email and still requires password input.
- Admin retrying a Teacher AI generation failed job returns 409 and original job remains `failed`.

## Implementation Plan Theo Vertical Slice

Backend:
- Add AI-generation retry job type guard before setting status to `retrying` for Admin actors.

Frontend:
- Add real account shortcut config in Vite define/config.
- Render three account cards in `LoginPanel`, filling credentials through normal form state.
- Keep demo quick-login functions unused by runtime `App.tsx`.

Tests:
- Backend retry guard test.
- Frontend login/account asset/script tests.

Docs / Env:
- Add env example keys for public real account shortcuts.
- Update progress/session handoff/evidence after verification.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline `./init.sh`: pass frontend 21 files/109 tests/build va backend 239 tests.
- Fail-first backend: `uv run pytest tests/test_generation_jobs.py::test_retry_generation_job_rejects_admin_ai_retry_before_status_update -q` failed as expected, Admin retry raised 403 after retry dispatcher path instead of pre-mutation 409.
- Backend targeted after fix: `uv run pytest tests/test_generation_jobs.py -q` pass 8 tests.
- Frontend targeted: `pnpm --dir frontend exec vitest run src/loginSecurity.test.ts src/config.test.ts` pass 2 files/10 tests.
- QA script syntax: `node --check frontend/scripts/admin-real-account-qa.mjs` pass.
- Frontend typecheck/lint: `pnpm --dir frontend run typecheck` pass; `pnpm --dir frontend run lint` pass.
- Final `./init.sh`: pass frontend typecheck/lint/21 files/112 tests/build va backend 240 tests.

Ket qua:
- Hoan thanh 3 review findings:
  - Hero asset `frontend/src/assets/teachflow-login-education-hero-asset-v2.png` is present and guarded by Vitest `?url` import.
  - QA script `frontend/scripts/admin-real-account-qa.mjs` is present and guarded by Vitest `?raw` import plus `node --check`.
  - Admin retry of Teacher-owned AI generation jobs is rejected before status mutation, so jobs remain `failed` instead of getting stuck in `retrying`.
- Login UI now shows env-driven real account cards for Admin, Teacher and Student. Cards fill the normal email/password form and still authenticate through `/auth/login`; runtime `App.tsx` still does not call demo auth endpoints.
- `.env.example` documents `TEACHFLOW_PUBLIC_*` real account shortcut variables. Local `.env.local` was updated from existing bootstrap accounts without printing values.

Manual validation da huong dan user:
- Open login page and confirm `Tài khoản thật` cards appear for Admin/Teacher/Student when `.env.local` has `TEACHFLOW_PUBLIC_*` values.
- Click each card, confirm form is filled, then submit login through the regular email/password flow.
- Confirm no demo role quick-login cards or `/auth/demo-login` runtime calls are present.

## Files Changed

- `.env.example`
- `.env.local` local ignored runtime file
- `backend/app/jobs/services.py`
- `backend/tests/test_generation_jobs.py`
- `docs/harness/exec-plans/completed/BUG-007-review-fixes-real-account-shortcuts.md`
- `feature_list.json`
- `frontend/vite.config.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/src/config.ts`
- `frontend/src/config.test.ts`
- `frontend/src/loginSecurity.test.ts`
- `frontend/src/vite-env.d.ts`
- `frontend/src/assets/teachflow-login-education-hero-asset-v2.png`
- `frontend/scripts/admin-real-account-qa.mjs`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Khong con blocker. Luu y: public real account password variables are intentionally bundled into the frontend if set, so only use dedicated recruiter/QA accounts.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
