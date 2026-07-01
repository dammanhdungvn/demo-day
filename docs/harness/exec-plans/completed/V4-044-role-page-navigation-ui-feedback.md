# Exec Plan - V4-044 Role workspace page navigation and UI feedback primitives

## Muc Tieu

- Feature: `V4-044 Role workspace page navigation and UI feedback primitives`
- User stories:
  - User muon moi chuc nang doc lap nam o page rieng, navigate qua menu thay vi tat ca nam chung mot trang dai.
  - User can loading/alert/skeleton/spinner/switch/table/pagination/toast de biet he thong dang lam gi.
- Ket qua user can validate:
  - Teacher/Admin/Student vao workspace thay menu page ro.
  - Click menu se doi active page, khong chi scroll den section trong mot page.
  - Cac list chinh co table/pagination hoac feedback state ro hon.
- Vertical slice: frontend architecture + UI primitives + tests + rendered QA. Backend khong doi.

## Scope P0

- Lam:
  - Them role page config va active page state trong AppShell.
  - Truyen active page vao Teacher/Admin/Student/System Admin workspace va chi render page dang chon.
  - Them local UI primitives theo shadcn composition pattern: Alert, Spinner, Skeleton, Switch, DataTable, Pagination, Toast.
  - Them pagination/table cho cac list can scan nhanh.
  - Cap nhat CSS responsive/focus/motion.
- Khong lam:
  - Khong migrate toan bo project sang Tailwind/shadcn CLI trong slice nay vi project hien la manual CSS, chua co `components.json`, Tailwind config hay alias; shadcn CLI info da xac nhan project chua initialized.
  - Khong doi backend API/schema.
  - Khong them fake business data/metrics.
- Dependencies da xong: V4-034, V4-035, V4-043.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`, harness docs.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co. User yeu cau thuc hien phuong an dung hon, khong hoi lai.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Khong doi backend; full `./init.sh` van phai pass.
- Frontend:
  - Them/doi test `workspaceActionTargets.test.ts` cho role page config va label -> page mapping.
  - Them test cho pagination helper: page count, clamp page, current slice.
  - Frontend `typecheck`, `lint`, `test`, `build`.
- Integration/e2e:
  - Playwright rendered QA fallback neu Browser plugin khong co:
    - Teacher: click menu `Tai lieu`, `Dan y`, `Lesson Studio`; xac nhan chi active page hien chinh.
    - Admin: click `Nguoi dung`/`Kho tri thuc`; xac nhan menu active va page rieng.
    - Student: click `Luyen tap`/`Tai lieu ca nhan`; xac nhan page rieng.
    - Console/page errors empty.
- Security/access:
  - Khong doi auth/backend guard; frontend khong hardcode backend URL/secrets.

### Manual validation

Prerequisite:
- Chay backend va frontend local; demo login bat neu muon test nhanh 3 role.

Steps:
1. Login Teacher, click tung menu page: `Tong quan`, `Khoa hoc & lop`, `Tai lieu`, `Dan y`, `Lesson Studio`, `Hang doi xu ly`.
2. Login Admin, click `Hang doi duyet`, `Kho tri thuc`, `Nguoi dung`.
3. Login Student, click `Lop cua toi`, `Lesson`, `Luyen tap`, `Tai lieu ca nhan`.
4. Quan sat alert/loading/skeleton/spinner/switch/table/pagination/toast surface tren workspace.

Expected:
- Main viewport chi hien page dang chon; cac page khac khong bi don chung vao mot scroll surface.
- Menu active ro, co icon + text + focus state.
- List chinh co pagination/table hoac empty/loading/error state ro.
- Khong hien API URL, demo password, secret.

Negative check:
- Doi page khong lam logout, khong mat session, khong goi role sai.
- Mobile khong overlap text/menu.

## Implementation Plan Theo Vertical Slice

Backend:
- Khong doi.

Frontend:
- Them `frontend/src/workspacePages.ts` de khai bao page config theo role.
- Them `frontend/src/ui/applicationShell.tsx` hoac primitives tuong duong cho status/toast/table/pagination/skeleton/switch.
- Cap nhat `DashboardShell` de dung active page state thay vi scroll-only.
- Cap nhat Teacher/Admin/Student/System Admin workspace nhan `activePage` va conditional render page sections.
- Cap nhat CSS theo concept `docs/version4/assets/v4-044-page-navigation-workspace-concept.png`.

Tests:
- Update/add tests frontend helper.
- Rendered QA.

Docs / Env:
- Cap nhat V4 README/Product Review/progress/session handoff/feature evidence.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline truoc code: `./init.sh` pass frontend 15 files/77 tests + build va backend 203 tests.
- `pnpm --dir frontend dlx shadcn@latest info --json` pass voi escalated network; project hien la Manual, chua co config/components.
- `pnpm --dir frontend typecheck` pass.
- `pnpm --dir frontend lint` pass.
- `pnpm --dir frontend test -- --run` pass 17 files/86 tests.
- `pnpm --dir frontend build` pass.
- `pnpm --dir frontend exec node /tmp/v4-044-page-navigation-qa.mjs` pass: Playwright spawn backend/frontend, quick-login Teacher/Admin/Student, click page menu va screenshot `/tmp/v4-044-teacher-pages.png`, `/tmp/v4-044-admin-pages.png`, `/tmp/v4-044-student-pages.png`.
- `python3 -m json.tool feature_list.json` pass.
- `git diff --check` pass.
- Final `./init.sh` pass frontend 17 files/86 tests + build va backend 203 tests.

Ket qua:
- Done. Teacher/Admin/Student/System Admin da co role page config va active-page render; workspace khong con chi scroll/nhồi tat ca section trong mot page. UI primitives local theo shadcn composition pattern da co cho alert/spinner/skeleton/switch/table/pagination/toast. CSS bo opacity animation khoi content panel de page khong trong luc doi trang.

Manual validation da huong dan user:
- Login Teacher, click `Tong quan`, `Khoa hoc & lop`, `Tai lieu`, `Dan y`, `Lesson Studio`, `Hang doi xu ly`.
- Login Admin, click `Hang doi duyet`, `Kho tri thuc`, `Nguoi dung`.
- Login Student, click `Lop cua toi`, `Lesson`, `Luyen tap`, `Tai lieu ca nhan`.
- Kiem tra menu active, page heading, toast khi doi trang, switch `Che do tap trung`, empty/loading/error state va table/pagination tren list.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V4-044-role-page-navigation-ui-feedback.md`
- `docs/version4/assets/v4-044-page-navigation-workspace-concept.png`
- `docs/version4/README.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/src/workspacePages.ts`
- `frontend/src/workspacePages.test.ts`
- `frontend/src/ui/application.tsx`
- `frontend/src/ui/pagination.ts`
- `frontend/src/ui/pagination.test.ts`
- `frontend/src/features/teacher/TeacherWorkspace.tsx`
- `frontend/src/features/admin/AdminWorkspace.tsx`
- `frontend/src/features/student/StudentWorkspace.tsx`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Khong co blocker. Luu y: full shadcn CLI/Tailwind migration nen la feature rieng neu can upstream shadcn components that; slice nay dung local primitives theo shadcn pattern de khong pha app hien co.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao exec plan: full shadcn CLI/Tailwind migration la slice rieng neu can, khong lam shortcut pha app trong V4-044.
