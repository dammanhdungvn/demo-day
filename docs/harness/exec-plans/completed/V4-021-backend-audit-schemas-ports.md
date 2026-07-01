# Exec Plan - V4-021 Backend audit schemas and ports extraction

## Muc Tieu

- Feature: `V4-021 Backend audit schemas and ports extraction`
- User stories: `US-413 Backend modularization plan`
- Ket qua user can validate: Lesson audit event API va persistence tiep tuc dung nhu hien tai, nhung audit schema/protocol da co module boundary trong `backend/app/audit/`.
- Vertical slice: backend architecture cleanup nho, behavior-preserving; khong doi frontend, DB schema, env, API path hay response payload.

## Scope P0

- Lam:
  - Tao `backend/app/audit/__init__.py`, `backend/app/audit/schemas.py`, `backend/app/audit/ports.py`.
  - Move `LessonAuditEventResponse` ra audit schema module.
  - Move `AuditRepository` protocol ra audit ports module.
  - Import/re-export compatibility names trong `backend/app/main.py`.
  - Them backend boundary tests va chay audit/lesson regression.
- Khong lam:
  - Chua tach audit repositories, services hoac routes.
  - Khong doi `audit_events` schema SQL, env var `LEARNING_REPOSITORY`, role guard, content status transition hay frontend API.
  - Khong them UI moi hoac route moi.
- Dependencies da xong: `V4-020`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Them `backend/tests/test_audit_module_boundaries.py`.
  - Test import `LessonAuditEventResponse` tu `app.audit.schemas` va compatibility export tu `main`.
  - Test `AuditRepository` protocol expose `ensure_schema`, `save_event`, `list_events_for_lesson`.
  - Test schema giu role literal `admin|teacher|student` qua `Role` da tach trong auth module.
- Frontend:
  - Khong co frontend change; final `./init.sh` van chay frontend typecheck/lint/test/build.
- Integration/e2e:
  - Chay `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_audit_module_boundaries.py tests/test_audit_persistence.py -q`.
  - Chay `tests/test_lesson_blocks.py` de cover audit record/list route behavior.
  - Chay backend full pytest va final `./init.sh`.
- Security/access:
  - Existing lesson/audit tests tiep tuc cover Teacher/Admin status transition va route role guard.

### Manual validation

Prerequisite:
- Backend dang chay voi demo data hoac local in-memory default.
- Co Teacher/Admin demo account va lesson da duoc Teacher thao tac.

Steps:
1. Teacher edit/approve/submit lesson block de tao audit events.
2. Goi `GET /api/v1/lessons/{lesson_id}/audit-events`.
3. Admin publish/request changes/reject va doc lai audit events.

Expected:
- Audit response fields `id`, `lesson_id`, `block_id`, `actor_id`, `actor_role`, `action`, `details`, `created_at` khong doi.
- Event order/role/action van dung behavior hien tai.

Negative check:
- Role khong duoc phep hoac lesson khong thuoc scope hien co van bi chan theo route/service guard hien tai.

## Implementation Plan Theo Vertical Slice

Backend:
- Them audit package va move schema/protocol ra module moi.
- Import audit schema/port vao `backend/app/main.py` de repositories/services/routes hien co tiep tuc dung.
- Cap nhat `backend/app/audit/__init__.py` export public names.

Frontend:
- Khong thay doi.

Tests:
- Viet boundary test truoc, chay de fail do chua co `app.audit`.
- Implement module split.
- Chay targeted va full verification.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/version4/PRODUCT_REVIEW.md`.
- Move exec plan sang completed neu done.
- Khong doi env.

## Evidence Sau Khi Lam

Commands da chay:
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_audit_module_boundaries.py -q` test-first: fail dung ky vong vi thieu `app.audit`.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_audit_module_boundaries.py -q`: pass 2.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_audit_persistence.py -q`: pass 3.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_audit_module_boundaries.py tests/test_audit_persistence.py tests/test_lesson_blocks.py -q`: pass 31.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest -q`: pass 129.
- `./init.sh`: pass frontend 13 files/57 tests + build, backend 129 tests.
- `python3 -c "import json; json.load(open('feature_list.json')); print('feature_list_json_ok')"`: pass.
- `git diff --check`: pass.

Ket qua:
- `backend/app/audit/` da co schema va port boundary.
- `backend/app/main.py` khong con dinh nghia truc tiep audit schema/protocol da tach, nhung compatibility exports van giu.
- Audit API/persistence/lesson status transition behavior khong doi.

Manual validation da huong dan user:
- Teacher/Admin tao va doc audit events theo steps trong plan.
- Negative check: role/scope guard hien co tiep tuc duoc cover trong automated tests.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V4-021-backend-audit-schemas-ports.md`
- `backend/app/audit/__init__.py`
- `backend/app/audit/schemas.py`
- `backend/app/audit/ports.py`
- `backend/app/main.py`
- `backend/tests/test_audit_module_boundaries.py`
- `progress.md`
- `session-handoff.md`
- `docs/version4/PRODUCT_REVIEW.md`

## Blockers / Next Step

- Khong co blocker.
- Next sau khi done: audit repositories extraction hoac content shared schema extraction, tuy theo dependency risk.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
