# Exec Plan - V4-003 Split frontend monolith - Student workspace module

## Muc Tieu

- Feature: Split frontend monolith - Student workspace module.
- User stories: `US-412`.
- Ket qua user can validate: Student workspace van giu UI/behavior V2-013, nhung code Student-specific duoc tach khoi `App.tsx` de future V3 learning features de phat trien hon.
- Vertical slice: frontend architecture cleanup + tests/rendered smoke; backend khong doi.

## Scope V4-P2

- Lam:
  - Tach `StudentClasses` va cac handler/state lien quan sang `frontend/src/features/student/StudentWorkspace.tsx`.
  - Dung typed props: `token`.
  - Giu business data den tu API/state/helper; khong hardcode fake progress/lesson.
  - Giu CSS class hien co de tranh visual churn.
  - `App.tsx` chi import/render Student component.
- Khong lam:
  - Khong doi API contract V2-013.
  - Khong refactor Teacher/Admin trong feature nay.
  - Khong them UI/animation moi truoc khi xac minh regression.
  - Khong them backend module split; de `US-413` feature rieng.
- Dependencies da xong: `V4-002`, `V2-013`.
- Source-of-truth da doc: `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version3/*`, `feature_list.json`, harness docs.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker. Refactor hẹp, behavior-preserving.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Baseline da co: final `./init.sh` sau V2-013 pass frontend 13 files / 57 tests + build, backend 103 tests.
- Sau refactor:
  - `pnpm --dir frontend typecheck`
  - `pnpm --dir frontend lint`
  - `pnpm --dir frontend test -- --run`
  - `pnpm --dir frontend run build`
  - `./init.sh`
- Neu co helper moi:
  - Them/sua Vitest helper test.

### Rendered QA

- Browser plugin khong co trong session; dung Playwright fallback.
- Flow:
  - Student workspace load -> `Tiếp tục học` -> lesson opens.
  - Presentation next slide -> progress update.
  - `Hoàn thành` -> completed state visible.
- Viewport: desktop 1440x1100 va mobile 390x900.
- Console warnings/errors va bad API responses phai empty.

### Manual validation

Prerequisite:
- Co Student account, class membership, lesson published.

Steps:
1. Dang nhap Student.
2. Bam `Tiếp tục học`.
3. Chon block/chuyen slide.
4. Bam `Hoàn thành`.

Expected:
- UI khong doi so voi V2-013.
- Progress chip/header van update.
- Presentation/PDF/citation panel van render.

## Implementation Plan

1. Tao `frontend/src/features/student/StudentWorkspace.tsx`.
2. Move Student component logic tu `App.tsx` sang module moi, import cac helper/API/labels/presentation can thiet.
3. Export `StudentWorkspace` va replace `StudentClasses` usage trong `App.tsx`.
4. Chay typecheck/lint/test/build, fix import/hook issues.
5. Chay Playwright rendered smoke.
6. Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/OVERNIGHT_HANDOFF.md`.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline truoc feature: `./init.sh` -> pass frontend 13 files / 57 tests + build, backend 103 tests.
- `pnpm --dir frontend typecheck` -> pass.
- `pnpm --dir frontend lint` -> pass.
- `pnpm --dir frontend test -- --run` -> pass 13 files / 57 tests.
- `pnpm --dir frontend run build` -> pass.
- `wc -l frontend/src/App.tsx frontend/src/features/student/StudentWorkspace.tsx frontend/src/presentation/LessonPresentation.tsx frontend/src/errors.ts` -> `App.tsx` 3334 lines, Student workspace 533 lines, presentation 156 lines.
- Playwright fallback vi Browser plugin khong co: `http://127.0.0.1:5174/student`, desktop 1440x1100 va mobile 390x900, Student continue -> next slide -> complete, console issues empty, bad responses empty.
- Final quality gate: `./init.sh` -> pass frontend 13 files / 57 tests + build, backend 103 tests; `git diff --check` pass; `python3 -m json.tool feature_list.json` pass.

Ket qua:
- Done. `StudentWorkspace` duoc tach khoi `App.tsx`; shared `LessonPresentation` va `getErrorMessage` co module rieng; behavior Student progress/presentation/citation giu nguyen.

Manual validation da huong dan user:
- Dang nhap Student, bam `Tiếp tục học`, chuyen slide, bam `Hoàn thành`, xac nhan chip `Xong` va header `Đã hoàn thành`.
- Screenshots QA: `/tmp/teachflow-v4-003-student-desktop.png`, `/tmp/teachflow-v4-003-student-mobile.png`.

## Files Changed

- `feature_list.json`
- `frontend/src/App.tsx`
- `frontend/src/features/student/StudentWorkspace.tsx`
- `frontend/src/presentation/LessonPresentation.tsx`
- `frontend/src/errors.ts`
- `docs/version4/PRODUCT_REVIEW.md`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`
- `docs/harness/exec-plans/active/V4-003-split-frontend-student-workspace.md`

## Blockers / Next Step

- Khong co blocker. Next V4-P2 nen tach Admin/Teacher workspace theo module rieng hoac mo `US-413` backend modularization plan.

## Quality Gate

- [x] Khong vuot V4-P2 scope.
- [x] Co test plan truoc code.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
