# Exec Plan - V4-022 Backend audit repositories extraction

## Muc Tieu

- Feature: `V4-022 Backend audit repositories extraction`
- User stories: `US-413 Backend modularization plan`
- Ket qua user can validate: Lesson audit event API va persistence tiep tuc dung nhu hien tai, nhung audit persistence adapters da co module boundary trong `backend/app/audit/repositories.py`.
- Vertical slice: backend architecture cleanup nho, behavior-preserving; khong doi frontend, DB schema, env, API path hay response payload.

## Scope P0

- Lam:
  - Tao `backend/app/audit/repositories.py`.
  - Move `audit_schema_sql`, `InMemoryAuditEventRepository`, `PostgresAuditEventRepository`, `MEMORY_AUDIT_REPOSITORY`, `get_audit_repository`.
  - Them `reset()` cho memory audit repository va cho reset lesson store reset audit qua module boundary.
  - Import/re-export compatibility names trong `backend/app/main.py`.
  - Cap nhat backend boundary tests va chay audit/lesson regression.
- Khong lam:
  - Chua tach audit service functions hoac FastAPI routes.
  - Khong doi SQL, table name, env var `LEARNING_REPOSITORY`, role guard, content status transition hay frontend API.
  - Khong them UI moi hoac route moi.
- Dependencies da xong: `V4-021`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Cap nhat `backend/tests/test_audit_module_boundaries.py`.
  - Test import `InMemoryAuditEventRepository`, `PostgresAuditEventRepository`, `audit_schema_sql`, `get_audit_repository` tu `app.audit.repositories`.
  - Test schema SQL co `audit_events`, index va revoke guard.
  - Test memory repository save/list/reset behavior.
  - Test factory default memory va postgres mode khong ensure schema khi `ensure_schema=False`.
- Frontend:
  - Khong co frontend change; final `./init.sh` van chay frontend typecheck/lint/test/build.
- Integration/e2e:
  - Chay `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_audit_module_boundaries.py tests/test_audit_persistence.py -q`.
  - Chay `tests/test_lesson_blocks.py` de cover audit route/status transition behavior.
  - Chay backend full pytest va final `./init.sh`.
- Security/access:
  - Existing lesson/audit tests tiep tuc cover Teacher/Admin status transition va route role guard.

### Manual validation

Prerequisite:
- Backend dang chay voi demo data hoac local in-memory default.
- Co Teacher/Admin demo account va lesson da duoc Teacher/Admin thao tac.

Steps:
1. Teacher edit/approve/submit lesson block de tao audit events.
2. Goi `GET /api/v1/lessons/{lesson_id}/audit-events`.
3. Admin publish/request changes/reject va doc lai audit events.

Expected:
- Audit response schema/status khong doi.
- Event order/role/action van dung behavior hien tai.

Negative check:
- Role khong duoc phep hoac lesson khong thuoc scope hien co van bi chan theo route/service guard hien tai.

## Implementation Plan Theo Vertical Slice

Backend:
- Them audit repository module theo pattern progress/learning repositories.
- Import audit repository adapters/factory vao `backend/app/main.py`.
- Doi reset helper sang memory repository reset method.

Frontend:
- Khong thay doi.

Tests:
- Cap nhat boundary test truoc, chay de fail do thieu `app.audit.repositories`.
- Implement module split.
- Chay targeted va full verification.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/version4/PRODUCT_REVIEW.md`.
- Move exec plan sang completed neu done.
- Khong doi env.

## Evidence Sau Khi Lam

Commands da chay:
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_audit_module_boundaries.py -q` test-first: fail dung ky vong vi thieu `app.audit.repositories`.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_audit_module_boundaries.py -q`: pass 3.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_audit_persistence.py -q`: pass 3.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_audit_module_boundaries.py tests/test_audit_persistence.py tests/test_lesson_blocks.py -q`: pass 32.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest -q`: pass 130.
- `./init.sh`: pass frontend 13 files/57 tests + build, backend 130 tests.
- `python3 -c "import json; json.load(open('feature_list.json')); print('feature_list_json_ok')"`: pass.
- `git diff --check`: pass.

Ket qua:
- `backend/app/audit/repositories.py` da expose schema SQL, memory/Postgres adapters va factory.
- `backend/app/main.py` khong con dinh nghia truc tiep audit repository adapters/factory da tach, nhung compatibility exports van giu.
- Reset audit test/demo di qua memory repository `reset()` method.
- Audit API/persistence/lesson status transition behavior khong doi.

Manual validation da huong dan user:
- Teacher/Admin tao va doc audit events theo steps trong plan.
- Negative check: role/scope guard hien co tiep tuc duoc cover trong automated tests.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V4-022-backend-audit-repositories.md`
- `backend/app/audit/__init__.py`
- `backend/app/audit/repositories.py`
- `backend/app/main.py`
- `backend/tests/test_audit_module_boundaries.py`
- `progress.md`
- `session-handoff.md`
- `docs/version4/PRODUCT_REVIEW.md`

## Blockers / Next Step

- Khong co blocker.
- Next sau khi done: audit services/routes extraction hoac content/shared citation boundary, tuy theo dependency risk.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
