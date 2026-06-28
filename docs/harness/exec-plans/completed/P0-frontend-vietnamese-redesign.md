# Exec Plan - P0 Frontend Vietnamese Redesign

## Muc Tieu

- Feature: P0 UX reliability/presentation fix cho MVP demo.
- User stories: US-002 den US-031 lien quan role workspace, Teacher flow, Admin review, Student view, Presentation/PDF.
- Ket qua user can validate: Giao dien dau vao va dashboard chinh dep hon, bo cuc hop ly hon, copy tieng Viet co dau, van giu nguyen workflow demo MVP.
- Vertical slice: Frontend UI/CSS + i18n copy trong component + browser QA + test/build.

## Scope P0

- Lam:
  - Redesign app shell, login, dashboard/workspace, panels, forms, lesson studio, admin queue, student reading view bang CSS/React hien co.
  - Doi copy UI chinh sang tieng Viet co dau.
  - Giu workflow va API hien co; khong doi business rule/backend.
  - Them icon/component styling neu can nhung khong dua framework nang.
- Khong lam:
  - Khong them P1/P2 feature.
  - Khong doi auth strategy, persistence, Supabase schema, AI provider.
  - Khong dua secrets vao frontend.
- Dependencies da xong: P0-001 den P0-011 done.
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md` de suy luan nghiep vu/scope.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend: `./init.sh` de dam bao backend regression khong bi anh huong.
- Frontend: `pnpm --dir frontend run typecheck`, `lint`, `test`, `build` qua `./init.sh`.
- Integration/e2e:
  - Playwright fallback vi Browser plugin khong co: screenshot desktop/mobile.
  - Login bang demo Teacher de xac nhan workspace render va controls respond.
- Security/access:
  - `./init.sh` guard frontend khong hardcode backend URL/secret key names.

### Manual validation

Prerequisite:
- Backend chay port `3000`, frontend chay port `5173`.

Steps:
1. Mo frontend.
2. Kiem tra man hinh dang nhap hien tieng Viet co dau, demo accounts ro rang, khong `Failed to fetch`.
3. Dang nhap Teacher, tao course/class, chon source, generate outline/lesson.
4. Dang nhap Admin va Student de kiem tra workspace chinh khong vo layout.

Expected:
- UI ro hierarchy: header, workspace rail, panels, forms, status.
- Copy chinh la tieng Viet co dau.
- Khong overlap, khong text tran nut/card o desktop va mobile.
- Demo flow P0 van hoat dong.

Negative check:
- Student/Admin khong thay controls ngoai quyen; backend role guard van pass qua test suite.

## Implementation Plan Theo Vertical Slice

Backend:
- Khong doi backend.

Frontend:
- Capture current screenshots.
- Tao Image Gen concept cho app workspace/login.
- Rut design tokens: palette, typography, spacing, buttons, panels, status, responsive.
- Refactor copy helpers va visible labels trong `App.tsx` sang tieng Viet co dau.
- Redesign `App.css` theo app shell/dashboard utilitarian, khong landing page.

Tests:
- Chay `./init.sh`.
- Browser QA bang Playwright desktop/mobile va interaction login.

Docs / Env:
- Cap nhat progress/session handoff va completed exec plan.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` truoc khi code: pass baseline.
- Image Gen concept: `/home/dammanhdungvn/.codex/generated_images/019f0da2-74bf-74e0-bb00-4e243520021c/ig_0d4f5ddc89f63e94016a41293c011481939561e27b5c50b288.png`.
- `pnpm --dir frontend run typecheck`: pass.
- `pnpm --dir frontend run lint`: pass.
- `./init.sh` sau redesign: pass.
- Playwright screenshots:
  - `/tmp/teachflow-final-login-desktop.png`
  - `/tmp/teachflow-final-login-mobile.png`
  - `/tmp/teachflow-after-teacher-desktop.png`
  - `/tmp/teachflow-after-teacher-mobile.png`
  - `/tmp/teachflow-final-admin-desktop.png`
  - `/tmp/teachflow-final-student-desktop.png`
- Playwright role smoke: Teacher/Admin/Student shell render, console warning/error empty.

Ket qua:
- Frontend redesign theo app shell utilitarian: login compact, sidebar workflow, panels/forms/status chips, button icon, responsive mobile.
- Copy UI chinh da doi sang tieng Viet co dau; enum/API value van giu tieng Anh noi bo.
- Them `lucide-react` cho icon UI va `playwright` devDependency cho rendered QA.
- `./init.sh` pass voi frontend 7 files/31 tests, backend 39 tests.

Manual validation da huong dan user:
- Mo `http://127.0.0.1:5173`, kiem tra man hinh dang nhap co tieng Viet co dau.
- Dang nhap Teacher/Admin/Student bang demo accounts, kiem tra workspace khong vo layout.
- Chay demo flow theo `docs/harness/DEMO_RUNBOOK.md`.

## Files Changed

- `frontend/package.json`
- `frontend/pnpm-lock.yaml`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/src/labels.ts`
- `frontend/src/auth/workspaces.ts`
- `frontend/src/auth/workspaces.test.ts`
- `frontend/src/presentation/slides.ts`
- `frontend/src/presentation/slides.test.ts`

## Blockers / Next Step

- Khong co blocker. User co the testing UI moi.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Khong co shortcut/debt moi can ghi tracker.
