# Exec Plan - V4-047 Minimal full frontend redesign

## Muc Tieu

- Feature: V4-047 Minimal full frontend redesign.
- User request: xay dung lai frontend dep hon, toi gian, khong phuc tap; animation va mau sac hai hoa; bo cuc hien tai dang roi va chua tach biet ro.
- Ket qua user can validate: Login/Teacher/Admin nhin gon, ro, it chu hon; Admin CRUD documents/users nam trong table voi nut Them/Sua/Xoa icon-only khi y nghia da ro.
- Visual specs duoc user duyet:
  - `images/frontend-design-approval-v1.png`
  - `images/login-design-approval-v1.png`
  - `docs/version4/assets/v4-047-minimal-frontend-redesign-concept.png`
  - `docs/version4/assets/v4-047-teachflow-reference-inspired-concept.png`
- User feedback da ap dung: login duoc duyet nhung bo dong tagline `Soan bai. Day tot.`; button Them/Sua/Xoa uu tien icon-only; web han che cau chu dai va dung icon khi nguoi dung hieu ngay.

## Scope P0

- Lam:
  - Login redesign theo concept da duyet: hero minh hoa, 3 role cards Admin/Teacher/Student, input icon, divider `hoac`, invite action gon, khong hien API URL/demo password/tagline.
  - Teacher overview theo concept thumbnail-inspired: dashboard action cards, recent list, AI Assistant panel, copy ngan.
  - Admin Knowledge dung DataTable lam UI chinh cho document list, co CTA Them PDF/Them URL icon-only, row actions Sua/Xoa icon-only khi ro nghia.
  - Admin Users dung DataTable voi row edit mode Sua -> Luu/Huy, disable/reactivate bang Xoa khoi active/Mo lai; Them Teacher/Them Student icon-only.
  - Them SOP rule: UI surface chua co concept duyet phai tao anh trong `images/` va xin duyet truoc khi code.
  - Giu backend/API va data thật hien co.
- Khong lam:
  - Khong rewrite backend.
  - Khong hard delete user/document/class/lesson.
  - Khong them landing page, fake metrics, fake charts, hero marketing.
  - Khong migrate framework lon/Tailwind/shadcn CLI trong slice nay.

## Test Plan Truoc Khi Code

- Automated:
  - Raw UI contract test cho AdminWorkspace phai co table CRUD labels/actions: Them PDF, Them URL, Sua, Luu, Huy, Xoa khoi active.
  - Frontend typecheck/lint/test/build.
  - Final `./init.sh`.
- Rendered QA:
  - Desktop/mobile login: 3 role cards visible, khong hien API URL/demo password/tagline cu.
  - Teacher overview: dashboard action cards/recent list/AI Assistant render va khong crash.
  - Admin Knowledge/Users: table + icon actions visible.

## Implementation Plan

1. Tao concept design va luu asset trong `images/` + `docs/version4/assets/`.
2. Cho user duyet concept truoc khi code; ap dung feedback bo tagline login.
3. Refactor login/Teacher overview/Admin documents/users theo concept va icon-first rule.
4. Them UI contract tests.
5. Chay typecheck/lint/test/build, rendered QA, `./init.sh`.
6. Cap nhat feature evidence/progress/session handoff/SOP va move exec plan completed.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline `./init.sh` pass truoc code: frontend 18 files/93 tests + build; backend 215 tests.
- `pnpm --dir frontend typecheck` pass.
- `pnpm --dir frontend lint` pass.
- `pnpm --dir frontend test -- --run` pass: 19 files/95 tests.
- `pnpm --dir frontend exec vitest run src/loginSecurity.test.ts` pass: 2 tests.
- `pnpm --dir frontend build` pass.
- Playwright rendered QA pass:
  - `/tmp/v4-047-login-approved-desktop.png`
  - `/tmp/v4-047-login-approved-mobile.png`
  - `/tmp/v4-047-teacher-approved-flow.png`
  - Login no console/page issues, 3 role buttons, khong hien `Soan bai. Day tot.`, API URL hay demo password.
- Final `./init.sh` pass: frontend 19 files/95 tests + build, backend 215 tests.

Ket qua:
- Login da implement theo concept duyet va feedback bo tagline.
- Teacher overview co dashboard action cards/recent list/AI Assistant panel code-native.
- Admin Knowledge/Admin Users dung table-first, Them/Sua/Xoa icon-only khi ro nghia.
- SOP co UI Approval Gate cho cac UI surface chua duoc duyet concept.
- Login visible label van ngan `Ma moi`; aria-label giu `Co ma moi?` de accessibility va regression test khong quay lai wording ky thuat.

## Files Changed

- `docs/harness/SOP.md`
- `docs/harness/exec-plans/completed/V4-047-minimal-full-frontend-redesign.md`
- `docs/version4/README.md`
- `feature_list.json`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/src/assets/teachflow-education-hero.png`
- `frontend/src/features/admin/AdminWorkspace.tsx`
- `frontend/src/features/admin/adminCrudSurface.test.ts`
- `frontend/src/features/teacher/TeacherWorkspace.tsx`
- `images/frontend-design-approval-v1.png`
- `images/login-design-approval-v1.png`
- `docs/version4/assets/v4-047-minimal-frontend-redesign-concept.png`
- `docs/version4/assets/v4-047-teachflow-reference-inspired-concept.png`

## Blockers / Next Step

- Khong co blocker.

## Quality Gate

- [x] Visual spec da luu trong repo.
- [x] Admin CRUD table actions visible.
- [x] Frontend checks pass.
- [x] Rendered QA pass.
- [x] `./init.sh` pass.
