# Exec Plan - V2-003 Persist outlines, lessons, and lesson blocks

## Muc Tieu

- Feature: `V2-003 Persist outlines, lessons, and lesson blocks`
- User stories: `US-205`, `US-207`, `US-208`
- Ket qua user can validate: Teacher generate outline/lesson, review/submit, Admin publish, Student xem lesson; khi chay production repository va restart backend, outline/lesson/block/status van ton tai.
- Vertical slice: backend repository/schema + tests + manual validation bang UI hien co.

## Scope V2-P0

- Lam:
  - Them `ContentRepository` boundary cho `course_outlines`, `outline_sessions`, `lesson_sessions`, `lesson_blocks`.
  - Them in-memory fallback va Postgres production repository, chon theo `LEARNING_REPOSITORY` nhu V2-001.
  - Luu block citations JSON theo schema response hien co.
  - Chuyen service functions outline/lesson/status/admin/student reads sang repository.
  - Giu audit events in-memory trong slice nay, vi US-206 se la feature rieng.
- Khong lam:
  - Supabase Auth/organization.
  - Full async job lifecycle/retry/cancel.
  - Persistent audit events (`US-206`).
  - V3 features.
- Dependencies da xong:
  - `V2-001`, `V2-002`
- Source-of-truth da doc:
  - `docs/version1/*`
  - `docs/version2/README.md`
  - `docs/version2/PRD_V2_PRODUCTION.md`
  - `docs/version2/USER_STORIES_V2.md`
  - `docs/version2/V1_P2_MIGRATION.md`
  - `docs/version3/*`
  - Supabase changelog + securing API docs
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker business rule cho slice nay.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Content repository memory contract: save/list/update outline, save/update lesson, find lesson by block.
  - Schema SQL includes `course_outlines`, `outline_sessions`, `lesson_sessions`, `lesson_blocks`, RLS enable va revoke Data API grants.
  - Regression: `tests/test_ai_outline.py`, `tests/test_lesson_blocks.py`.
- Frontend:
  - Khong doi frontend; chay qua `./init.sh`.
- Integration/e2e:
  - Supabase/Postgres smoke tao outline/lesson tam, doc lai bang repository instance moi, update status, cleanup.
- Security/access:
  - Existing tests cover Teacher ownership, Admin moderation, Student direct lesson access published + membership.

### Manual validation

Prerequisite:
- `.env` co `LEARNING_REPOSITORY=postgres` va DB connection hop le.

Steps:
1. Teacher generate outline va lesson.
2. Approve blocks va submit Admin.
3. Restart backend.
4. Admin publish submitted lesson.
5. Student trong class mo published lesson.

Expected:
- Outline/lesson/blocks/status van ton tai sau restart production repository.
- Student ngoai class/direct URL sai van bi chan.

Negative check:
- Student khong xem lesson chua published.
- Teacher khac khong xem/sua lesson khong so huu.
- Frontend khong co secret/backend URL hardcode.

## Implementation Plan Theo Vertical Slice

Backend:
- Tao `content_schema_sql()`, `InMemoryContentRepository`, `PostgresContentRepository`.
- Dung JSONB cho list fields/citations/source references, text IDs de tuong thich memory va Postgres.
- Chuyen outline/lesson service functions sang repository.

Frontend:
- Khong doi API contract.

Tests:
- Them `backend/tests/test_content_persistence.py`.
- Chay targeted tests va `./init.sh`.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/OVERNIGHT_HANDOFF.md`.

## Evidence Sau Khi Lam

Commands da chay:
- `uv run pytest tests/test_content_persistence.py -q` -> pass 3.
- `uv run pytest tests/test_ai_outline.py tests/test_lesson_blocks.py tests/test_learning.py -q` -> pass 34.
- `uv run python -m compileall main.py` -> pass.
- `LEARNING_REPOSITORY=postgres uv run python - <<'PY' ...` -> `content_persistence_smoke_ok`, tao/doc lai/update published/list/cleanup outline-lesson-block tam.

Ket qua:
- Da them `ContentRepository`, `InMemoryContentRepository`, `PostgresContentRepository` va `content_schema_sql()`.
- Schema Postgres idempotent tao `course_outlines`, `outline_sessions`, `lesson_sessions`, `lesson_blocks`, enable RLS va revoke Data API grants tu `anon/authenticated`.
- Service functions outline/lesson/block/admin/student reads dung content repository thay vi global dict direct.
- Local/test default van memory; production path chon bang `LEARNING_REPOSITORY=postgres`.
- Audit events van in-memory dung scope, de US-206 persistence rieng.

Manual validation da huong dan user:
- Chay backend voi `LEARNING_REPOSITORY=postgres`.
- Teacher generate outline/lesson, approve blocks, submit Admin.
- Restart backend.
- Admin publish lesson.
- Student trong class mo published lesson va direct URL sai van bi chan.

## Files Changed

- `backend/main.py`
- `backend/tests/test_content_persistence.py`
- `feature_list.json`
- `docs/harness/exec-plans/active/V2-003-persist-outlines-lessons.md`

## Blockers / Next Step

- Khong co blocker cho V2-003.
- Next V2-P0 nen lam persistent audit events `US-206`, production auth/organization hoac async job lifecycle.

## Quality Gate

- [x] Khong vuot V2-P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md` hoac xac nhan khong co shortcut moi.
