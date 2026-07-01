# Exec Plan - V4-052 Full HTML design parity and real navigation

## Muc Tieu

- Feature: V4-052 Full HTML design parity and real navigation.
- User stories:
  - Admin can navigate every admin page selected in `images/admin/html/`.
  - Product owner can audit every `images/**/*.html` file against a React page and backend/API status.
  - Operator can test real account/database behavior without mock-only frontend data.
- Ket qua user can validate:
  - Admin menu/sidebar/taskbar co cac trang con thieu: Tong quan, Hang doi duyet, Kho bai giang mau, Kho tri thuc, Nguoi dung, Tac vu, Bao cao, Nhat ky hoat dong, Cai dat.
  - Cac trang admin moi click duoc va lay so lieu/list tu API state hien co hoac hien empty state ro khi DB chua co du lieu.
  - Cac loi prototype trong HTML duoc chuan hoa truoc khi code: ngon ngu, icon, desktop width/height, density, spacing va responsive.
  - `docs/version5/HTML_DESIGN_PARITY_INVENTORY.md` liet ke tat ca HTML design va status/gap.
- Vertical slice: frontend navigation + admin page parity dau tien, kem API gap inventory.
- Clarification 2026-07-01: cac file HTML co hau to `part1`/`part2` la cac phan view/section cua cung mot page/feature, khong phai duplicate. Inventory va React markers phai map tung part, khong duoc bo qua noi dung part sau.

## Scope P0

- Lam:
  - Inventory tat ca file `images/**/*.html`.
  - Chuan hoa design system khi HTML mau thuan: dung tieng Viet UI, lucide icons, desktop webapp 1440px, no-overlap responsive, cung spacing/radius/type scale.
  - Mo Admin page ids/menu/action targets theo HTML design.
  - Them Admin overview, lesson library, reports, activity log, settings view bang React/TSX code-native.
  - Dung data that dang co trong state/API: review queue, knowledge documents, managed users, invites, generation jobs/job center, dashboard state neu can.
  - Them backend API that cho cac page Admin moi khi frontend can contract rieng: lesson library, reports, activity feed va safe settings.
  - Cap nhat tests cho workspace pages va raw parity markers.
- Khong lam:
  - Khong khoi phuc demo login/role quick cards.
  - Khong import prototype HTML/CDN/Tailwind runtime.
  - Khong hardcode sample business dataset de lam dep UI.
  - Khong danh dau full goal done neu cac role Teacher/Student/System pages con gap trong inventory.
- Dependencies da xong:
  - V4-048, V4-049, V4-051.
- Source-of-truth da doc:
  - `docs/version5/README.md`
  - `docs/version5/PRODUCT_MARKET_REVIEW.md`
  - `docs/harness/SOP.md`
  - `docs/harness/ARCHITECTURE.md`
  - `docs/harness/QUALITY_SCORE.md`
  - `docs/harness/RELIABILITY_SECURITY.md`
  - `feature_list.json`
  - `progress.md`
  - `session-handoff.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker cho slice dau tien.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Chay `./init.sh` sau slice neu code backend khong doi.
  - Neu them API moi, bo sung pytest route/permission va OpenAPI contract.
- Frontend:
  - Cap nhat `frontend/src/workspacePages.test.ts` de fail khi Admin page list thieu page tu HTML design.
  - Bo sung/cap nhat raw source test cho `AdminWorkspace.tsx` marker: `admin-design-overview`, `admin-design-lesson-library`, `admin-design-reports`, `admin-design-activity-log`, `admin-design-settings`.
  - Chay targeted Vitest cho workspace/admin tests, sau do `./init.sh`.
- Integration/e2e:
  - Neu dev server san sang, rendered QA Admin desktop 1440px cho cac page moi.
- Security/access:
  - Raw check khong co `OPENAI_API_KEY`, `NVIDIA_OPENAI_API_KEY`, `SECRET_API_KEY_SUPABASE` trong frontend source.
  - Khong goi `demoLogin`/`fetchDemoAccounts` trong `App.tsx`.

### Manual validation

Prerequisite:
- `.env` dung real auth: `AUTH_PROVIDER=supabase`, `AUTH_REPOSITORY=postgres`, `LEARNING_REPOSITORY=postgres`, `ENABLE_DEMO_LOGIN=false`.
- Co account Admin that trong DB va bearer/session frontend hop le.

Steps:
1. Login Admin bang email/password that.
2. Click tung menu Admin: Tong quan, Hang doi, Kho bai giang mau, Kho tri thuc, Nguoi dung, Tac vu, Bao cao, Nhat ky, Cai dat.
3. Xac nhan moi page render dung desktop shell, khong mat navigation, khong overflow ngang 1440px.
4. Xac nhan page nao chua co data DB thi hien empty state, khong hien sample fake data.
5. Doc `docs/version5/HTML_DESIGN_PARITY_INVENTORY.md` de xem gap con lai.

Expected:
- Admin menu/page parity dau tien pass.
- Full inventory ro rang phan biet done/in-progress/gap.

Negative check:
- Login UI khong hien demo role quick-access cards.
- Student/Teacher khong thay Admin menu.

## Implementation Plan Theo Vertical Slice

Backend:
- Them endpoint Admin-only org-scoped neu frontend can data/action that chua co API hien huu.
- Khong tao endpoint fake; moi endpoint phai co permission/org-scope tests va OpenAPI contract.

Frontend:
- Chuan hoa loi design HTML truoc khi code: Vietnamese labels, icon set thong nhat, density desktop, max-width/content rails, card/table sizing va responsive breakpoints.
- Xu ly file `part1`/`part2` nhu multi-part page: ghi section coverage ro trong inventory va them marker code-native de regression test bat duoc neu bo sot part.
- Update `workspacePages.ts` them Admin page ids va action targets.
- Update `App.tsx` icon map cho page ids moi.
- Refactor `AdminWorkspace.tsx` them helpers tinh summary va cac section React code-native.
- Reuse `JobCenter` cho task page, reuse document/user/review state cho report/overview/activity/settings.

Tests:
- Update workspace page tests.
- Update admin/student workspace raw tests hoac tao test moi.

Docs / Env:
- Add `docs/version5/HTML_DESIGN_PARITY_INVENTORY.md`.
- Update `progress.md` va `session-handoff.md` khi ket thuc turn.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline truoc code: `./init.sh` pass frontend 21 files/105 tests + build, backend 223 tests.
- Fail-first targeted: `vitest run src/workspacePages.test.ts src/features/adminStudentWorkspace.test.ts` fail dung ky vong vi thieu Admin page ids/markers.
- Sau fix targeted: `vitest run src/workspacePages.test.ts src/features/adminStudentWorkspace.test.ts` pass 2 files/10 tests.
- Frontend typecheck: `pnpm --dir frontend run typecheck` pass.
- Frontend lint: `pnpm --dir frontend run lint` pass.
- Frontend full tests: `pnpm --dir frontend test` pass 21 files/106 tests.
- Frontend build: `pnpm --dir frontend run build` pass.
- Full harness: `./init.sh` pass frontend typecheck/lint/106 tests/build va backend 223 tests.
- Backend fail-first/targeted API: `UV_CACHE_DIR=/home/dammanhdungvn/Workspaces/ai-in-action/demo-day/.cache/uv uv run pytest tests/test_admin_fullstack_surfaces.py tests/test_audit_module_boundaries.py tests/test_openapi_contract.py -q` pass 11 tests.
- Full harness sau API/frontend integration: `./init.sh` pass frontend typecheck/lint/107 tests/build va backend 227 tests.
- Clarification pass: inventory cap nhat `part1`/`part2` la multi-part sections, them React markers `admin-design-*-part*` va `lesson-presentation-design-part*` de khong map nham la duplicate.
- Full harness sau multi-part marker/tests: `./init.sh` pass frontend typecheck/lint/108 tests/build va backend 227 tests; `git diff --check` pass.
- DB audit read-only: Postgres `profiles` hien chi co 3 demo profiles `auth_provider=demo`, chua co Supabase Admin that de rendered QA real-account.
- `python3 -m json.tool feature_list.json` pass.
- `git diff --check` pass.
- Supabase/current-docs check cho reset password: Supabase Auth reset flow gui recover email va co redirect option; implementation dung backend Auth REST `/recover`, khong expose service key/frontend secret.
- Admin Users part2 bulk actions: backend co `PATCH /api/v1/auth/users/bulk-status` va `POST /api/v1/auth/users/bulk-password-reset`, org-scoped Admin-only; frontend Admin Users co bulk select, bulk doi mat khau, khoa tai khoan, mo lai, `Xoa khoi active` bang soft-disable. Hard-delete account that khong lam trong slice nay de tranh mat du lieu hoc tap/token policy chua ro.
- `.env.local` runtime parity: da bo sung key thieu theo `.env.example`, backend core config va ingest script doc `.env.local`, `init.sh` validate `.env.local`/`.env`, `.gitignore` ignore `.env.local`.
- Real-account env bootstrap: bo sung `TEACHFLOW_BOOTSTRAP_*` va `TEACHFLOW_QA_ADMIN_*` vao `.env.example`; `.env.local` local ignored file co the duoc dien bang `--prepare-qa-env-local` hoac rotate bang `--rotate-qa-env-local`, khong in password.
- Targeted backend: `UV_CACHE_DIR=/home/dammanhdungvn/Workspaces/ai-in-action/demo-day/.cache/uv uv run pytest tests/test_auth.py tests/test_openapi_contract.py tests/test_core_helpers.py -q` pass 45.
- Targeted frontend: `pnpm --dir frontend exec vitest run src/api/auth.test.ts src/features/adminStudentWorkspace.test.ts` pass 2 files/19 tests.
- Final harness after bulk/env changes: `./init.sh` pass frontend typecheck/lint/21 files/109 tests/build va backend 230 tests.
- Final JSON/diff: `python3 -m json.tool feature_list.json` pass; `git diff --check` pass.
- Real-account bootstrap path: added `backend/scripts/bootstrap_real_accounts.py` with dry-run default and `--apply` guard; script creates Supabase Auth users via server-side service key and upserts Postgres `profiles`/`organizations`. It reads bootstrap email/password from shell env or `.env.local`, does not print passwords/secrets, and skips existing profiles.
- Bootstrap tests: `UV_CACHE_DIR=/home/dammanhdungvn/Workspaces/ai-in-action/demo-day/.cache/uv uv run pytest tests/test_real_account_bootstrap.py tests/test_auth.py tests/test_openapi_contract.py -q` pass 43.
- Bootstrap dry-run: `uv run python scripts/bootstrap_real_accounts.py --admin-email admin.qa@example.edu` prints planned account and no writes.
- Bootstrap `.env.local` support: `tests/test_real_account_bootstrap.py` pass 5; dry-run `uv run python scripts/bootstrap_real_accounts.py --admin-email admin.qa@example.edu` pass and made no writes.
- Bootstrap QA env prepare/rotate: added `--prepare-qa-env-local` va `--rotate-qa-env-local`, redacts sensitive values on apply errors. Targeted `UV_CACHE_DIR=/home/dammanhdungvn/Workspaces/ai-in-action/demo-day/.cache/uv uv run pytest tests/test_real_account_bootstrap.py -q` pass 8. Local ignored `.env.local` da duoc dien/rotate QA credentials, output chi in key names. Sandbox `--apply` fail sach do DNS Supabase pooler bi chan; escalation retry 2 lan timeout o auto reviewer, chua tao account Auth/Postgres.
- Final harness after bootstrap `.env.local` support: `./init.sh` pass frontend typecheck/lint/21 files/109 tests/build va backend 235 tests.
- Real Admin rendered QA runner: added `frontend/scripts/admin-real-account-qa.mjs` and `pnpm --dir frontend run qa:admin-real`. Runner requires real Admin email/password from `TEACHFLOW_QA_ADMIN_*` or bootstrap env, logs in via real `/auth/login`, clicks all Admin pages, checks API failures/console errors/horizontal overflow/secret key names, and writes screenshots under `/tmp/teachflow-admin-real-qa`.
- QA runner checks: `node --check frontend/scripts/admin-real-account-qa.mjs` pass; missing credential run fails early with clear message and no mock login.
- Frontend/backend API contract guard: added `backend/tests/test_frontend_backend_contract.py` to extract `frontend/src/api/*` `buildApiUrl(...)` paths and compare them with backend OpenAPI paths, normalizing query strings and path params. Targeted test pass: `UV_CACHE_DIR=/home/dammanhdungvn/Workspaces/ai-in-action/demo-day/.cache/uv uv run pytest tests/test_frontend_backend_contract.py -q` -> 1 pass. Final `./init.sh` pass frontend typecheck/lint/21 files/109 tests/build va backend 239 tests.
- Real-account bootstrap apply: `uv run python scripts/bootstrap_real_accounts.py --apply` succeeded, creating/ensuring real Supabase Auth + Postgres profiles for `system_admin`, `admin`, `teacher` and `student`; output did not print passwords/secrets.
- Real Admin rendered QA: `TEACHFLOW_QA_FRONTEND_URL=http://127.0.0.1:5174 pnpm --dir frontend run qa:admin-real` pass on backend `127.0.0.1:3001` and frontend `127.0.0.1:5174`. Runner logged in through real `/auth/login`, clicked all 9 Admin pages, detected no API 4xx/5xx, no console errors, no horizontal overflow and no secret text. Screenshots: `/tmp/teachflow-admin-real-qa/admin-overview-tong-quan.png`, `admin-review-hang-doi-duyet.png`, `admin-lesson-library-bai-giang-mau.png`, `admin-knowledge-kho-tri-thuc.png`, `admin-users-nguoi-dung.png`, `admin-jobs-tac-vu.png`, `admin-reports-bao-cao.png`, `admin-activity-log-nhat-ky.png`, `admin-settings-cai-dat.png`.
- Final verification after QA script fix: `node --check frontend/scripts/admin-real-account-qa.mjs` pass; `./init.sh` pass frontend typecheck/lint/21 files/109 tests/build va backend 239 tests.

Ket qua:
- Hoan thanh. Admin navigation/page parity frontend cho overview, lesson library, reports, activity log va settings da co. Backend gap baseline da xu ly bang `GET /admin/lesson-library`, `GET /admin/reports`, `GET /admin/activity`, `GET/PATCH /admin/settings`; frontend AdminWorkspace da goi cac endpoint nay va settings form luu that metadata/policy khong nhay cam. Multi-part HTML clarification da duoc map/test. Admin Users part2 bulk selection/password reset/lock/unlock/soft-delete khoi active da co API + frontend that. Frontend/backend API gap guard da co automated test OpenAPI contract. `.env.local` local ignored da co QA bootstrap credentials va account-that gate da pass bang bootstrap `--apply` + rendered QA Admin tren database that.

Manual validation da huong dan user:
- Login Admin bang account that, mo menu: Tong quan, Hang doi duyet, Bai giang mau, Kho tri thuc, Nguoi dung, Tac vu, Bao cao, Nhat ky, Cai dat.
- Xac nhan cac page moi khong hien data mau; khi DB thieu data thi hien empty/gap state.
- Doc `docs/version5/HTML_DESIGN_PARITY_INVENTORY.md` de xem HTML nao da map va API gap nao con lai.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V4-052-full-html-design-parity-navigation.md`
- `docs/version5/HTML_DESIGN_PARITY_INVENTORY.md`
- `frontend/src/workspacePages.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/src/features/admin/AdminWorkspace.tsx`
- `frontend/src/workspacePages.test.ts`
- `frontend/src/features/adminStudentWorkspace.test.ts`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/scripts/admin-real-account-qa.mjs`
- `frontend/package.json`
- `backend/tests/test_frontend_backend_contract.py`
- `backend/app/main.py`
- `backend/app/audit/ports.py`
- `backend/app/audit/repositories.py`
- `backend/tests/test_admin_fullstack_surfaces.py`
- `backend/tests/test_audit_module_boundaries.py`
- `backend/tests/test_openapi_contract.py`
- `backend/app/auth/schemas.py`
- `backend/app/auth/services.py`
- `backend/app/auth/routes.py`
- `backend/app/auth/supabase_client.py`
- `backend/app/core/config.py`
- `backend/scripts/ingest_books.py`
- `backend/scripts/bootstrap_real_accounts.py`
- `backend/tests/test_auth.py`
- `backend/tests/test_core_helpers.py`
- `backend/tests/test_real_account_bootstrap.py`
- `.gitignore`
- `.env.local` local ignored runtime file
- `docs/harness/DEMO_RUNBOOK.md`
- `docs/harness/SOP.md`
- `progress.md`
- `session-handoff.md`
- `docs/harness/exec-plans/tech-debt-tracker.md`

## Blockers / Next Step

- Khong con blocker P0 cho V4-052. Hard-delete account that van la future auth/data-deletion slice rieng neu user yeu cau; bulk parity hien dung soft-disable an toan de giu lich su hoc tap va tranh revoke/session policy chua ro.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
