# Exec Plan - V4-002 Admin review and Student learning surface polish

## Muc Tieu

- Feature: Admin review and Student learning surface polish.
- User stories: `US-410`, `US-411`.
- Ket qua user can validate: Admin thay moderation queue/detail ro citation, warning, status va action feedback; Student thay dashboard/reading surface dep hon, de doc hon, khong lan voi Teacher controls.
- Vertical slice: frontend V4-P1 polish tren API/state hien co, regression backend/frontend, rendered QA desktop/mobile.

## Scope V4-P1

- Lam:
  - Them helper tinh Admin review summary va Student learning summary tu data API/state that.
  - Redesign Admin queue/detail theo visual language V4, hien warning/citation/status summary va feedback/action state.
  - Redesign Student dashboard/reading surface: class context, continue learning, reading mode, presentation/PDF controls.
  - Them future slots cho progress/tutor duoi dang disabled/empty state ro rang, khong fake feature.
  - Motion nhe, focus visible, responsive desktop/mobile.
- Khong lam:
  - Khong them Student progress persistence, tutor backend, analytics, LMS, assignment/submission.
  - Khong doi role/business rule backend neu API hien co du.
  - Khong them hardcoded fake metrics/product data vao UI.
- Dependencies da xong: `V4-001`, `P0-008`, `P0-009`, `P0-010`.
- Source-of-truth da doc: `docs/version1/`, `docs/version2/`, `docs/version3/`, `docs/version4/`, `feature_list.json`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Research tham khao: WCAG 2.2 focus/target accessibility, NN/g visibility of system status, MDN `prefers-reduced-motion`, React docs performance guidance.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co. User da yeu cau tu quyet va khong hoi lai khi user di ngu.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - `uv run pytest tests/test_lesson_blocks.py tests/test_learning.py -q` de guard Admin publish/request/reject va Student access.
  - Full backend qua `./init.sh`.
- Frontend:
  - Them `frontend/src/features/adminStudentWorkspace.test.ts` cho summary helpers: citation coverage, warning count, queue item status, first continue lesson, disabled future slots.
  - `pnpm --dir frontend exec vitest run src/features/adminStudentWorkspace.test.ts`.
  - Full frontend typecheck/lint/test/build.
- Integration/e2e:
  - Playwright rendered QA fallback vi Browser plugin khong co: Admin desktop/mobile, Student desktop/mobile, console warning/error relevant = 0, target interactions click selected review/open lesson.
- Security/access:
  - Khong doi backend guard; regression backend + Student UI chi render lessons tu `fetchStudentLessons`.

### Manual validation

Prerequisite:
- Backend/frontend chay local voi demo accounts va co it nhat mot lesson da submit/publish tu demo flow.

Steps:
1. Dang nhap Admin, vao moderation queue, chon lesson can review.
2. Kiem tra queue/detail co warning count, citation coverage, block status, feedback input va publish/request changes/reject actions ro.
3. Dang nhap Student, xem dashboard, mo published lesson, mo presentation va export PDF.
4. Kiem tra mobile viewport Admin/Student khong overlap, focus visible.

Expected:
- Admin thay review context va evidence truoc khi publish/request/reject.
- Student chi thay published lessons cua class minh, reading surface de doc va khong co Teacher controls.
- Future progress/tutor slots hien la chua kich hoat/coming later, khong gia lap du lieu.

Negative check:
- Student khong thay draft/submitted/rejected lessons.
- Teacher/Admin controls khong hien trong Student reading view.
- Console khong co error/warning lien quan.

## Implementation Plan Theo Vertical Slice

Backend:
- Khong doi endpoint neu khong can; chay regression sau UI.

Frontend:
- Tao `frontend/src/features/adminStudentWorkspace.ts` gom pure helpers.
- Mo rong `frontend/src/ui/teacherWorkspace.tsx` neu co primitive reusable phu hop, hoac them primitive nhe khong duplicate.
- Refactor/rerender Admin/Student JSX trong `App.tsx` vua du, tranh them logic tinh toan inline.
- CSS token/classes trong `App.css`, motion respect `prefers-reduced-motion`.

Tests:
- Viet helper tests fail/pass truoc khi integrate UI.
- Run targeted frontend tests, then full init.

Docs / Env:
- Cap nhat `docs/version4/PRODUCT_REVIEW.md`, `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/OVERNIGHT_HANDOFF.md`.
- Khong them env moi.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline truoc code: `./init.sh` -> pass frontend 12 files / 54 tests + build, backend 98 tests.
- Test-first: `pnpm --dir frontend exec vitest run src/features/adminStudentWorkspace.test.ts` -> fail module `./adminStudentWorkspace` chua ton tai.
- Helper targeted: `pnpm --dir frontend exec vitest run src/features/adminStudentWorkspace.test.ts` -> pass 2.
- Frontend: `pnpm --dir frontend typecheck && pnpm --dir frontend lint && pnpm --dir frontend test -- --run` -> pass 13 files / 56 tests.
- Frontend build: `pnpm --dir frontend run build` -> pass.
- Backend regression: `uv run pytest tests/test_lesson_blocks.py tests/test_learning.py -q` -> pass 34.
- Playwright rendered QA fallback vi Browser plugin khong co tren `http://127.0.0.1:5174/`: Admin desktop/mobile va Student desktop/mobile pass, console warning/error relevant = 0.

Ket qua:
- Hoan thanh. Admin moderation co queue/detail/citation evidence/action feedback. Student learning surface co class context, continue learning, reading canvas, block nav, citation panel, presentation/PDF controls va future progress/tutor disabled slots khong fake data.

Manual validation da huong dan user:
- Prerequisite: backend/frontend chay local, co lesson submitted/published.
- Steps: Admin dang nhap -> chon lesson/block trong queue -> xem warning/citation/action feedback; Student dang nhap -> `Tiếp tục học` -> chon block -> xem citation/presentation/PDF/future slots.
- Expected: Admin thay evidence truoc publish/request/reject; Student chi thay published lessons va khong thay Teacher controls; mobile khong overlap.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V4-002-admin-student-surface-polish.md`
- `docs/version4/assets/teachflow-v4-admin-student-concept.png`
- `docs/version4/PRODUCT_REVIEW.md`
- `frontend/src/features/adminStudentWorkspace.ts`
- `frontend/src/features/adminStudentWorkspace.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`

## Blockers / Next Step

- Khong co blocker cua V4-002.
- Next neu tiep V4: V4-P2 split frontend monolith va backend modularization plan.
- Next neu tiep product value: V2-P1 Student progress hoac grounded tutor theo docs version 2.

## Quality Gate

- [x] Khong vuot V4-P1 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
