# Exec Plan - V4-006 Split frontend monolith - Teacher workspace module

## Muc Tieu

- Feature: Split frontend monolith - Teacher workspace module.
- User stories: `US-412`.
- Ket qua user can validate: Teacher workflow/Lesson Studio van chay nhu V4-001/V2-013, nhung Teacher state/render logic khong con nam trong `App.tsx`.
- Vertical slice: frontend architecture cleanup + rendered regression; backend runtime behavior khong doi.

## Scope V4-P2

- Lam:
  - Tao `frontend/src/features/teacher/TeacherWorkspace.tsx`.
  - Di chuyen `TeacherManagement` state, effects, actions va JSX tu `App.tsx` sang module moi.
  - Di chuyen helper chi Teacher dung: draft converters, default course/class/topic, audit action label.
  - `App.tsx` chi import va render `TeacherWorkspace` cho role teacher.
- Khong lam:
  - Khong redesign UI trong feature nay.
  - Khong doi API contract, backend routes, response schema hoac env.
  - Khong tach backend code trong feature nay.
  - Khong them fake data.
- Dependencies da xong: `V4-001`, `V4-003`, `V4-005`.
- Source-of-truth da doc: `docs/version4/USER_STORIES_V4.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker. Day la behavior-preserving frontend split.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated checks

- Baseline truoc feature: `./init.sh` da pass frontend 13 files / 57 tests + build, backend 103 tests voi 1 Starlette/httpx deprecation warning.
- Sau refactor:
  - `pnpm --dir frontend typecheck`
  - `pnpm --dir frontend lint`
  - `pnpm --dir frontend test -- --run`
  - `pnpm --dir frontend run build`
  - `./init.sh`
  - `git diff --check`

### Rendered/manual smoke

Prerequisite:
- Backend/frontend local dev servers. Neu can, dung mocked API Playwright de smoke deterministic.

Steps:
1. Login Teacher.
2. Xac nhan workflow timeline/metrics/source strip/job queue render.
3. Mo Lesson Studio voi lesson co blocks, chon block va citation inspector.
4. Xac nhan progress panel va export controls van render desktop/mobile.

Expected:
- Console warning/error rong cho luong Teacher.
- Khong co failed `/api/v1` response bat thuong.
- Text khong overlap tren desktop 1440x1100 va mobile 390x900.

## Implementation Plan

1. Tao `features/teacher/TeacherWorkspace.tsx` tu `TeacherManagement` va helper lien quan.
2. Xoa `TeacherManagement`/Teacher-only imports khoi `App.tsx`.
3. App shell render `TeacherWorkspace`.
4. Chay frontend checks/build.
5. Chay rendered Teacher smoke.
6. Chay `./init.sh`, cap nhat evidence va move exec plan completed.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline truoc feature: `./init.sh` -> pass frontend 13 files / 57 tests + build, backend 103 tests, 1 Starlette/httpx deprecation warning.
- `pnpm --dir frontend typecheck` -> pass.
- `pnpm --dir frontend lint` -> pass.
- `pnpm --dir frontend test -- --run` -> pass 13 files / 57 tests.
- `pnpm --dir frontend run build` -> pass.
- Playwright fallback Teacher desktop/mobile mocked API smoke -> pass, console issues va bad responses empty. Screenshots: `/tmp/teachflow-v4-006-teacher-desktop.png`, `/tmp/teachflow-v4-006-teacher-mobile.png`.
- `./init.sh` -> pass frontend 13 files / 57 tests + build, backend 103 tests, 1 Starlette/httpx deprecation warning.
- `git diff --check` -> pass.

Ket qua:
- Da tach `TeacherWorkspace` sang `frontend/src/features/teacher/TeacherWorkspace.tsx`.
- Da chuyen Teacher-only defaults/draft helpers/audit label vao module Teacher.
- Da tach `displayName` sang `frontend/src/labels.ts` de App shell va Teacher dung chung.
- `App.tsx` giam tu 2561 xuong 627 lines va khong con `TeacherManagement`/Teacher-specific API state.

Manual validation da huong dan user:
- Dang nhap Teacher, xem workflow timeline/metrics/source strip/job queue.
- Mo Lesson Studio, chon block, citation inspector va export controls.
- Xac nhan UI/behavior khong doi so voi V4-001/V2-013.

## Files Changed

- `feature_list.json`
- `frontend/src/App.tsx`
- `frontend/src/features/teacher/TeacherWorkspace.tsx`
- `frontend/src/labels.ts`
- `docs/harness/exec-plans/active/V4-006-split-frontend-teacher-workspace.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`

## Blockers / Next Step

- Khong co blocker.
- Next V4-P2 slice nen bat dau backend app factory/core config theo `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, hoac chuyen sang V2 durable worker/tutor neu uu tien product value.

## Quality Gate

- [x] Khong vuot V4-P2 scope.
- [x] Co test plan truoc code.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
