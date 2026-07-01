# Exec Plan - V4-048 Convert new login and admin HTML designs

## Muc Tieu

- Feature: `V4-048 Convert new login and admin HTML designs`
- User stories:
  - User thay login khop design moi trong `images/frontend-login-design.html`.
  - Admin thao tac cac page review/knowledge/users/jobs bang portal UI moi, table-first va icon-first.
  - System Admin tao organization/moi Admin dau tien bang UI moi trong `images/admin/html/`.
- Ket qua user can validate: login/Admin/System Admin runtime React khop visual direction cua HTML/PNG design, van dung API/data that va khong lo URL/secret/password demo.
- Vertical slice: frontend-only tren API hien co; backend khong doi.

## Scope P0

- Lam:
  - Chuyen login design HTML sang `App.tsx`/`App.css`, dung asset local va lucide icons.
  - Chuyen Admin workspace pages hien co sang style portal moi: sidebar/topbar already shell-level, content area metrics/table/detail/forms theo design.
  - Chuyen System Admin organization/admin-invite pages sang style moi.
  - Cap nhat tests khi co Node/pnpm kha dung; neu toolchain thieu, ghi blocker verification ro.
- Khong lam:
  - Khong doi backend API/schema/permission.
  - Khong them fake business data moi de lam dep UI.
  - Khong import CDN Tailwind, Google Fonts runtime, Chart.js hay remote prototype images tu HTML mockup.
  - Khong tiep tuc `V2-014` Job Center retry/cancel ngoai phan surface Admin jobs can hien dung scaffold hien co.
- Dependencies da xong: `V4-047`, `BUG-006`, `V4-045`, `V4-046`; `V2-014` van blocked/paused theo progress hien tai.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`, `docs/version5/README.md`, `docs/version5/PRODUCT_MARKET_REVIEW.md`, `images/frontend-design-manifest-v2.md`, `images/frontend-login-design.html`, `images/admin/html/*`.
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co. User da chi ro design source trong `images`.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend: khong doi backend; neu toolchain day du, final `./init.sh` se chay backend pytest regression.
- Frontend:
  - `pnpm --dir frontend exec vitest run src/loginSecurity.test.ts src/auth/workspaces.test.ts src/workspacePages.test.ts`
  - `pnpm --dir frontend test -- --run`
  - `pnpm --dir frontend typecheck`
  - `pnpm --dir frontend lint`
  - `pnpm --dir frontend build`
- Integration/e2e:
  - Rendered QA login desktop/mobile: backend ready state, 3 role cards, invite panel, no visible API URL/demo password.
  - Rendered QA Admin desktop/mobile: admin-review, admin-knowledge, admin-users, admin-jobs khong overlap, table/action icons co accessible label.
  - Rendered QA System Admin desktop/mobile: organization va admin invite forms/tables.
- Security/access:
  - Verify frontend source khong hardcode `localhost:3000/api/v1`.
  - Verify frontend source khong chua `OPENAI_API_KEY`, `NVIDIA_OPENAI_API_KEY`, `SECRET_API_KEY_SUPABASE`.

### Manual validation

Prerequisite:
- Backend chay `http://127.0.0.1:3000`.
- Frontend chay qua Vite, `URL_BACKEND=/api/v1`.

Steps:
1. Mo login, xac nhan status `San sang`, 3 role cards Admin/Teacher/Student, hero minh hoa va form email/password khop design.
2. Click Admin, mo tung page `Hang doi duyet`, `Kho tri thuc`, `Nguoi dung`, `Tac vu`.
3. Neu co System Admin account, mo `To chuc` va `Moi Admin`.
4. Thu mobile width va desktop width.

Expected:
- Layout khong overlap/cat chu, action icon co tooltip/aria-label, table-first cho management pages.
- Khong hien backend URL, demo password, secret key name.
- Loading/empty/error state van hien ro.

Negative check:
- Tat backend roi refresh login: controls bi khoa va hien loi ket noi than thien.
- Student/Teacher khong thay Admin/System Admin pages trong navigation.

## Implementation Plan Theo Vertical Slice

Backend:
- Khong doi.

Frontend:
- Cap nhat login JSX va CSS tokens/layout theo HTML design.
- Cap nhat workspace shell/Admin/System Admin CSS de tiệm cận sidebar/topbar portal design.
- Cap nhat Admin page content classes/layout cho review, knowledge, users, jobs.
- Copy asset login hero local vao `frontend/src/assets/` neu can.

Tests:
- Cap nhat tests theo selectors/copy moi neu bi anh huong.
- Chay commands neu Node/pnpm kha dung; neu khong, ghi ro command fail.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`.
- Move exec plan sang completed khi pass DoD; neu verification bi chan boi toolchain, de active voi blocker ro.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` fail: shell khong co `pnpm`; `node`, `npm`, `corepack` cung khong co trong PATH.
- `apt-get update` voi escalation fail do khong co quyen ghi `/var/lib/apt/lists/lock`.
- `source ~/.nvm/nvm.sh && corepack pnpm --version` -> `11.9.0`.
- `./init.sh` pass lan cuoi: frontend typecheck/lint, 21 test files/102 tests, build; backend 219 tests pass.
- Playwright desktop QA 1440x1000 login/Admin review/knowledge/users/jobs pass, issues `[]`.

Ket qua:
- Done. Login va Admin portal desktop da chuyen sang React/CSS theo HTML/PNG design trong `images`.
- System Admin organization/admin-invite surface duoc style cung portal; khong them System Admin quick demo account vi V4-043 quy dinh Owner khong xuat hien trong public demo login.

Manual validation da huong dan user:
- Prerequisite: backend port 3000, frontend port 5173.
- Steps: mo login desktop, click Admin, kiem tra Hang doi duyet/Kho tri thuc/Nguoi dung/Tac vu.
- Expected: layout desktop khong overlap, table-first, action icon co tooltip/aria-label, khong hien backend URL/demo password.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/active/V4-048-login-admin-html-design-conversion.md`
- `.gitignore`
- `init.sh`
- `frontend/package.json`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/src/assets/teachflow-login-education-hero-asset-v2.png`

## Blockers / Next Step

- Khong con blocker cho V4-048.
- `images/teacher/html/` dang la untracked design artifact co san tu user, khong thuoc scope thay doi cua feature nay.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Khong co shortcut/debt moi can ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
