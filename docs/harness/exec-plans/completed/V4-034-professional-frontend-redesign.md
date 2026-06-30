# Exec Plan - V4-034 Professional frontend redesign

## Muc Tieu

- Feature: `V4-034 Professional frontend redesign`
- User stories: `US-401`, `US-402`, `US-408`, `US-409`, `US-410`, `US-411`
- Ket qua user can validate: frontend nhin professional hon theo phong cach enterprise/Google-like, login co 3 quick role access nhung khong lo API/password, Teacher/Admin/Student workspace de dung hon va responsive hon.
- Vertical slice: frontend design system + login/app shell/workspace styling + rendered QA + docs/evidence. Backend khong doi behavior.

## Scope P0

- Lam:
  - Dung concept `docs/version4/assets/v4-034-professional-frontend-concept.png` lam visual spec.
  - Redesign global tokens, typography, buttons, forms, panels, cards/lists, status chips va focus/motion.
  - Redesign login first viewport: brand, 3 quick roles, manual login, invite activation; khong hien API URL/password.
  - Redesign app shell: left sidebar, topbar, identity/logout, active nav, workspace context.
  - Dong bo surface Teacher/Admin/Student, dac biet Lesson Studio va citation inspector.
  - Desktop/mobile Playwright QA va screenshot comparison voi concept.
- Khong lam:
  - Khong them business workflow moi.
  - Khong doi API contract/backend auth/RAG/lesson generation.
  - Khong them framework UI nang neu CSS/React hien tai du de hoan thanh.
- Dependencies da xong: `V4-001`, `V4-002`, `V4-006`, `V4-029`, `V4-032`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co. User da yeu cau tu thuc hien, khong hoi lai.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Khong doi backend; final `./init.sh` van chay backend full tests.
- Frontend:
  - `pnpm --dir frontend typecheck`
  - `pnpm --dir frontend test -- --run`
  - `pnpm --dir frontend build`
  - `frontend/src/loginSecurity.test.ts` dam bao khong lo API URL/demo password trong UI source.
- Integration/e2e:
  - Playwright fallback desktop login + Teacher workspace render.
  - Playwright fallback mobile login/workspace render.
  - Screenshot comparison: concept vs rendered screenshot bang `view_image`.
- Security/access:
  - Quick access van dung demo-login account id; frontend khong gui mat khau demo.
  - Khong them `URL_BACKEND`/secret visible trong UI.

### Manual validation

Prerequisite:
- Backend/frontend local dang chay voi demo login enabled neu can test full quick access.

Steps:
1. Mo login desktop va mobile, kiem tra 3 role quick access Admin/Teacher/Student.
2. Chon Teacher, xem sidebar/topbar/workflow/metrics/knowledge/RAG/Lesson Studio/citation inspector.
3. Chon Admin va Student de kiem tra visual language dong bo.

Expected:
- UI trong sach, professional, de scan, khong co API URL/demo password.
- Controls co hover/focus ro, text khong overlap tren desktop/mobile.
- Core workflow render va navigation shortcut van dung.

Negative check:
- Frontend source/bundle khong chua secret hoac hardcoded demo password.
- Student khong thay Teacher/Admin controls; Teacher khong thay Admin library management ngoai scope.

## Implementation Plan Theo Vertical Slice

Backend:
- Khong doi.

Frontend:
- Refine `App.tsx` structure neu can cho app shell/topbar/sidebar classes.
- Replace `App.css` tokens/layout theo concept, giu class names de giam rui ro logic.
- Remove stale `.api-strip` CSS va bat ky visible debug/security copy cu.
- Add subtle motion/focus states co reduced-motion support.

Tests:
- Chay targeted frontend typecheck/test truoc, sau do rendered QA, sau do final `./init.sh`.

Docs / Env:
- Cap nhat `docs/version4/README.md`, `PRODUCT_REVIEW.md`, `progress.md`, `session-handoff.md`, `feature_list.json`.

## Evidence Sau Khi Lam

Commands da chay:
- `pnpm --dir frontend typecheck`
- `pnpm --dir frontend test -- --run`
- `pnpm --dir frontend lint`
- `pnpm --dir frontend build`
- Playwright fallback rendered QA vi Browser plugin khong co: login desktop, Teacher desktop/mobile, Admin desktop, Student desktop.
- `rg -n "api-strip|Mật khẩu demo|URL_BACKEND missing|DEMO_PASSWORD|http://127.0.0.1:3001/api/v1" frontend/src frontend/src/App.css`
- `./init.sh`

Ket qua:
- Typecheck pass.
- Frontend test pass: 14 files / 61 tests.
- Lint pass.
- Build pass.
- Rendered QA pass: console/page errors empty, forbidden API/password text not visible.
- Final `./init.sh` pass: frontend typecheck/lint/test/build pass, backend 160 tests pass.
- Screenshot evidence:
  - `/tmp/v4-034-login-desktop.png`
  - `/tmp/v4-034-teacher-desktop.png`
  - `/tmp/v4-034-teacher-mobile.png`
  - `/tmp/v4-034-admin-desktop.png`
  - `/tmp/v4-034-student-desktop.png`
- Concept inspected bang `view_image`: `docs/version4/assets/v4-034-professional-frontend-concept.png`.

Manual validation da huong dan user:
- Mo login desktop/mobile: thay 3 quick role access Admin/Teacher/Student, khong thay API URL/demo password.
- Chon Teacher: thay sidebar/topbar/workflow/metrics/knowledge/RAG/Lesson Studio/citation inspector.
- Chon Admin/Student: vao thang workflow that, khong con panel demo role-verification chen len dau.

## Files Changed

- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `docs/version4/assets/v4-034-professional-frontend-concept.png`
- `feature_list.json`
- `docs/harness/exec-plans/active/V4-034-professional-frontend-redesign.md`
- `docs/version4/README.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Next sau V4-034: quay lai `V4-033 Knowledge storage governance` hoac tiep tuc UI component extraction neu QA phat hien debt.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
