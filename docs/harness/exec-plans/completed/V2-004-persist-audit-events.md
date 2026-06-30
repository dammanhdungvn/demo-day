# Exec Plan - V2-004 Persist audit events

## Muc Tieu

- Feature: Persist audit events
- User stories: `US-206`, `US-207`, `US-208`
- Ket qua user can validate: Teacher/Admin xem audit history khong mat sau backend restart khi dung `LEARNING_REPOSITORY=postgres`.
- Vertical slice: backend repository/schema + regression tests; frontend giu endpoint/UI hien co.

## Scope P0

- Lam:
  - Them `AuditRepository` memory/Postgres.
  - Them schema `audit_events` idempotent co RLS enabled va revoke Data API grants.
  - Wire `_record_lesson_audit_event` va `list_lesson_audit_events` qua repository.
  - Giu permission guard backend: Admin/Teacher owner duoc xem, Student bi chan.
- Khong lam:
  - Khong them audit filter/search UI moi.
  - Khong lam organization auth production day du trong slice nay.
  - Khong doi frontend API contract.
- Dependencies da xong: `V2-003`
- Source-of-truth da doc: `docs/version2/README.md`, `docs/version2/PRD_V2_PRODUCTION.md`, `docs/version2/USER_STORIES_V2.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - `tests/test_audit_persistence.py` kiem tra memory repository save/list theo lesson va giu order.
  - `tests/test_audit_persistence.py` kiem tra `audit_schema_sql()` co table/columns/index/RLS/revoke.
  - Regression `tests/test_lesson_blocks.py` giu audit action events va role guard hien co.
- Frontend:
  - Khong doi frontend; full frontend tests/build trong `./init.sh`.
- Integration/e2e:
  - Supabase/Postgres smoke voi `LEARNING_REPOSITORY=postgres`: save audit event, doc lai bang repository instance moi, cleanup.
- Security/access:
  - Regression audit endpoint/service: Teacher owner/Admin duoc xem; Student bi 403; Teacher khac bi not found qua tests hien co.

### Manual validation

Prerequisite:
- Backend chay voi `.env` co `LEARNING_REPOSITORY=postgres` va Supabase/Postgres conninfo hop le.

Steps:
1. Dang nhap Teacher, tao lesson, edit/approve blocks va submit Admin.
2. Dang nhap Admin, publish/request changes/reject mot lesson submitted.
3. Restart backend, dang nhap Teacher va mo Audit history cua lesson vua thao tac.

Expected:
- Audit history van co cac action `lesson_generated`, `block_edited`, `block_status_changed`, `lesson_submitted`, `lesson_published`/`changes_requested`/`lesson_rejected`.
- Event co actor, role, action, lesson/block id, details va timestamp.

Negative check:
- Student goi audit history bi 403.
- Teacher khac goi audit lesson khong so huu bi `Lesson not found`.

## Implementation Plan Theo Vertical Slice

Backend:
- Them `AuditRepository` protocol, `InMemoryAuditEventRepository`, `PostgresAuditEventRepository`.
- Them `audit_schema_sql()` theo chien luoc backend authorization + RLS enabled + revoke Data API grants.
- Doi `_record_lesson_audit_event` va `list_lesson_audit_events` sang repository dependency.

Frontend:
- Khong doi UI/API.

Tests:
- Them repository/schema tests truoc.
- Chay targeted audit/lesson/content tests va `./init.sh`.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/OVERNIGHT_HANDOFF.md`.
- Cap nhat debt `TD-011` neu production path da persistent.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline truoc code: `./init.sh` -> pass frontend 45 tests/build va backend 66 tests.
- `uv run pytest tests/test_audit_persistence.py -q` -> pass 3 tests.
- `uv run pytest tests/test_lesson_blocks.py tests/test_content_persistence.py tests/test_audit_persistence.py -q` -> pass 30 tests.
- `uv run python -m compileall main.py` -> pass.
- `LEARNING_REPOSITORY=postgres uv run python - <<'PY' ...` -> `audit_persistence_smoke_ok`, tao/doc lai/cleanup audit event tam.
- `./init.sh` -> pass frontend 12 files/45 tests + build va backend 69 tests.

Ket qua:
- Backend co `AuditRepository`, `InMemoryAuditEventRepository`, `PostgresAuditEventRepository`, `audit_schema_sql()`.
- `audit_events` co actor/action/lesson/block/details/timestamp, index theo lesson/created_at, RLS enabled va revoke grants tu `anon/authenticated`.
- `_record_lesson_audit_event` va `list_lesson_audit_events` dung repository; permission guard Teacher owner/Admin/Student tiep tuc pass.

Manual validation da huong dan user:
- Huong dan trong phan Manual validation cua plan nay va `docs/OVERNIGHT_HANDOFF.md`.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V2-004-persist-audit-events.md`
- `backend/tests/test_audit_persistence.py`
- `backend/main.py`
- `docs/harness/exec-plans/tech-debt-tracker.md`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`

## Blockers / Next Step

- Khong co blocker hien tai.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
