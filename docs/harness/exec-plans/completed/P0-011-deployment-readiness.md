# Exec Plan - P0-011 UX states, demo seed, deployment readiness

## Muc Tieu

- Feature: `P0-011 - UX states, demo seed, deployment readiness`
- User stories: `US-029`, `US-030`
- Ket qua user can validate: Co runbook testing/deploy, verification pass, demo flow end-to-end ro rang de user testing truoc deploy.
- Vertical slice: docs/runbook + final verification + handoff state.

## Scope P0

- Lam:
  - Demo/deploy runbook bang tieng Viet.
  - Checklist manual validation end-to-end.
  - Ghi ro env/deploy commands va known MVP debt.
  - Chay final `./init.sh`.
- Khong lam:
  - Seed script production moi.
  - P1/P2.
  - Refactor persistence.
- Dependencies da xong: `P0-001` den `P0-010`.
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Final `./init.sh` chay backend pytest.
- Frontend:
  - Final `./init.sh` chay typecheck/lint/test/build va secret/backend URL guard.
- Integration/e2e:
  - Runbook manual flow ghi du cac buoc Teacher -> Admin -> Student -> Presentation/PDF.
- Security/access:
  - `init.sh` guard frontend khong hardcode secret/backend URL.

### Manual validation

Prerequisite:
- `.env` local co key hop le, Supabase KB da ingest 5 docs, backend/frontend dev servers chay.

Steps:
1. Lam theo `docs/harness/DEMO_RUNBOOK.md`.
2. Chay full manual demo flow.
3. Neu pass, user deploy.

Expected:
- `./init.sh` pass.
- User co checklist testing/deploy restartable.

Negative check:
- Khong co secret trong docs/runbook.

## Implementation Plan Theo Vertical Slice

Backend:
- Khong doi code.

Frontend:
- Khong doi code.

Tests:
- Chay final `./init.sh`.

Docs / Env:
- Them `docs/harness/DEMO_RUNBOOK.md`.
- Cap nhat state files.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh`

Ket qua:
- Final verification pass.
- Frontend typecheck/lint/test/build pass voi 7 files/30 tests.
- Backend pytest 35 pass.
- Frontend guard khong hardcode backend URL hoac secret key names pass.

Manual validation da huong dan user:
- `docs/harness/DEMO_RUNBOOK.md` co full checklist Teacher -> RAG -> Lesson Studio -> Admin Publish -> Student View -> Presentation/PDF.

## Files Changed

- `docs/harness/DEMO_RUNBOOK.md`
- `docs/harness/exec-plans/active/P0-011-deployment-readiness.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Khong con blocker cho P0-011.
- Toan bo P0 Critical da xong; dung lai cho user testing/deploy.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
