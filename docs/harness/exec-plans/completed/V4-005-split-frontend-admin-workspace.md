# Exec Plan - V4-005 Split frontend monolith - Admin workspace module

## Muc Tieu

- Feature: Split frontend monolith - Admin workspace module.
- User stories: `US-412`.
- Ket qua user can validate: Admin moderation/knowledge/invite surface van chay nhu V4-002, nhung Admin state/render logic khong con nam trong `App.tsx`.
- Vertical slice: frontend architecture cleanup + rendered regression; backend runtime behavior khong doi.

## Scope V4-P2

- Lam:
  - Tao `frontend/src/features/admin/AdminWorkspace.tsx`.
  - Di chuyen `AdminModeration` state, effects, actions va JSX tu `App.tsx` sang module moi.
  - Tach shared `KnowledgeUploadPanel` va `DocumentStatusList` tu `App.tsx` sang module dung chung, vi Teacher/Admin deu dung.
  - `App.tsx` chi import va render `AdminWorkspace` cho role admin.
- Khong lam:
  - Khong doi CSS theme/design trong feature nay, tru khi can sua import/class sau split.
  - Khong doi API contract, backend routes, response schema hoac env.
  - Khong tach Teacher workspace trong feature nay.
  - Khong them fake data.
- Dependencies da xong: `V4-002`, `V4-004`.
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
- Backend/frontend local dev servers. Neu can, dung port khac neu 5173 ban.

Steps:
1. Login Admin.
2. Xac nhan Admin review hero/metrics/queue/detail render khong console error.
3. Chon lesson/block, citation panel hien dung.
4. Xac nhan knowledge panel va invite panel render tren desktop/mobile.

Expected:
- Console warning/error rong cho luong Admin.
- Khong co failed `/api/v1` response bat thuong.
- Text khong overlap tren desktop 1440x1100 va mobile 390x900.

## Implementation Plan

1. Tao shared knowledge components module.
2. Tao `features/admin/AdminWorkspace.tsx`, import API/helper/labels/shared components.
3. Xoa `AdminModeration` va unused imports khoi `App.tsx`.
4. Chay frontend checks/build.
5. Chay rendered Admin smoke.
6. Chay `./init.sh`, cap nhat evidence va move exec plan completed.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline truoc feature: `./init.sh` -> pass frontend 13 files / 57 tests + build, backend 103 tests, 1 Starlette/httpx deprecation warning.
- `pnpm --dir frontend typecheck` -> pass.
- `pnpm --dir frontend lint` -> pass.
- `pnpm --dir frontend test -- --run` -> pass 13 files / 57 tests.
- `pnpm --dir frontend run build` -> pass.
- Playwright fallback Admin desktop/mobile mocked API smoke -> pass, console issues va bad responses empty. Screenshots: `/tmp/teachflow-v4-005-admin-desktop.png`, `/tmp/teachflow-v4-005-admin-mobile.png`.
- `./init.sh` -> pass frontend 13 files / 57 tests + build, backend 103 tests, 1 Starlette/httpx deprecation warning.
- `git diff --check` -> pass.

Ket qua:
- Da tach `AdminWorkspace` sang `frontend/src/features/admin/AdminWorkspace.tsx`.
- Da tach shared knowledge controls sang `frontend/src/features/knowledge/KnowledgeControls.tsx`.
- Da tach knowledge helper sang `frontend/src/features/knowledge/knowledgeHelpers.ts`.
- `App.tsx` giam tu 3334 xuong 2561 lines va khong con `AdminModeration`/Admin-specific API state.

Manual validation da huong dan user:
- Dang nhap Admin, xem review queue, chon block/citation, nhap feedback.
- Kiem tra Admin knowledge upload/source list va invite panel.
- Xac nhan UI/behavior khong doi so voi V4-002.

## Files Changed

- `feature_list.json`
- `frontend/src/App.tsx`
- `frontend/src/features/admin/AdminWorkspace.tsx`
- `frontend/src/features/knowledge/KnowledgeControls.tsx`
- `frontend/src/features/knowledge/knowledgeHelpers.ts`
- `docs/harness/exec-plans/active/V4-005-split-frontend-admin-workspace.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`

## Blockers / Next Step

- Khong co blocker.
- Next V4-P2 slice nen tach Teacher workspace/module lon khoi `App.tsx` hoac bat dau backend app factory slice theo `docs/version4/BACKEND_MODULARIZATION_PLAN.md`.

## Quality Gate

- [x] Khong vuot V4-P2 scope.
- [x] Co test plan truoc code.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
