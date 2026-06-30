# Exec Plan - V4-004 Backend modularization plan

## Muc Tieu

- Feature: Backend modularization plan.
- User stories: `US-413`.
- Ket qua user can validate: Co tai lieu clean architecture de tach `backend/main.py` theo boundary ro, co migration slices nho va verification gate truoc khi tach code that.
- Vertical slice: architecture plan + harness evidence; backend runtime behavior khong doi.

## Scope V4-P2

- Lam:
  - Tao `docs/version4/BACKEND_MODULARIZATION_PLAN.md`.
  - Map current `backend/main.py` groups vao target modules: auth, learning, content, knowledge, AI/jobs, audit/progress, export/presentation, API routes.
  - Dinh nghia dependency direction: API -> service/use case -> repository/provider -> infrastructure.
  - Dinh nghia migration slices nho, rollback, verification commands.
  - Cap nhat `docs/version4/PRODUCT_REVIEW.md` va handoff.
- Khong lam:
  - Khong tach code backend trong feature nay.
  - Khong doi API path/contract `/api/v1`.
  - Khong doi DB schema/behavior.
  - Khong them framework backend moi.
- Dependencies da xong: `V2-013`, `V4-003`.
- Source-of-truth da doc: `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version2/*`, `docs/version3/*`, harness docs.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker. `US-413` acceptance cho phep plan truoc, khong can tach toan bo trong mot PR.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated/doc checks

- Baseline truoc feature: `./init.sh` da pass frontend 13 files / 57 tests + build, backend 103 tests.
- Sau khi viet plan:
  - `rg -n "auth|learning|content|knowledge|AI|audit|export|Migration Slice|Verification" docs/version4/BACKEND_MODULARIZATION_PLAN.md`
  - `python3 -m json.tool feature_list.json`
  - `./init.sh`
  - `git diff --check`

### Manual validation

Prerequisite:
- Doc `docs/version4/BACKEND_MODULARIZATION_PLAN.md`.

Steps:
1. Xac nhan plan co target module map cho auth/learning/content/knowledge/ai/audit/export.
2. Xac nhan moi slice co verification command.
3. Xac nhan plan khong yeu cau doi API contract trong mot lan.

Expected:
- Agent sau co the chon slice dau tien va code theo plan ma khong phai suy doan boundary.

## Implementation Plan

1. Inspect `backend/main.py` current section/function layout bang `rg`.
2. Viet plan trong `docs/version4/BACKEND_MODULARIZATION_PLAN.md`.
3. Cap nhat `docs/version4/PRODUCT_REVIEW.md`.
4. Chay doc checks va `./init.sh`.
5. Cap nhat feature/handoff/progress va move exec plan completed.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline truoc feature: `./init.sh` -> pass frontend 13 files / 57 tests + build, backend 103 tests.
- `rg -n "auth|learning|content|knowledge|AI|audit|export|Migration Slice|Verification" docs/version4/BACKEND_MODULARIZATION_PLAN.md` -> pass, plan co module/domain va verification references.
- `python3 -m json.tool feature_list.json` -> pass.
- `./init.sh` -> pass frontend 13 files / 57 tests + build, backend 103 tests, 1 Starlette/httpx deprecation warning.
- `git diff --check` -> pass.

Ket qua:
- Da tao `docs/version4/BACKEND_MODULARIZATION_PLAN.md` voi current-state map, target module layout, 6 migration slices, rollback/verification, API compatibility rules va test gate matrix.
- Da cap nhat `docs/version4/PRODUCT_REVIEW.md` va `docs/harness/ARCHITECTURE.md` de tro den plan moi.
- Chua tach code backend trong feature nay, dung scope V4-P2 planning.

Manual validation da huong dan user:
- Review `docs/version4/BACKEND_MODULARIZATION_PLAN.md`.
- Xac nhan module map co auth/learning/content/knowledge/AI/audit/export.
- Xac nhan slice tiep theo giu `/api/v1` compatibility va chay targeted tests + `./init.sh`.

## Files Changed

- `feature_list.json`
- `docs/version4/BACKEND_MODULARIZATION_PLAN.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `docs/harness/ARCHITECTURE.md`
- `docs/harness/exec-plans/active/V4-004-backend-modularization-plan.md`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`

## Blockers / Next Step

- Khong co blocker.
- Next coding slice nen la app factory/core config hoac learning/progress module split theo `docs/version4/BACKEND_MODULARIZATION_PLAN.md`.

## Quality Gate

- [x] Khong vuot V4-P2 scope.
- [x] Co test plan truoc code.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
