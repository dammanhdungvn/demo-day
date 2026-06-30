# Exec Plan - P1-004 Audit events day du hon

## Muc Tieu

- Feature: P1-004 Audit events day du hon
- User stories: US-035 Audit events đầy đủ hơn
- Ket qua user can validate: Teacher/Admin xem duoc history toi thieu cho lesson; backend luu event chi tiet cho edit/regenerate/approve/submit/publish/request changes/reject.
- Vertical slice: backend audit event store + protected endpoint + frontend history panel + tests + manual validation.

## Scope P1

- Lam:
  - In-memory audit events theo lesson trong MVP/debt hien co.
  - Event co actor_id, actor_role, action, lesson_id, optional block_id, details, created_at.
  - Record events cho edit block, regenerate block, approve/reject block, submit, publish, request changes, reject lesson.
  - Protected endpoint Teacher owner/Admin doc events cua lesson.
  - Teacher Lesson Studio hien audit history cua lesson dang chon/load.
- Khong lam:
  - Supabase persistence/audit table production.
  - Full audit UI filter/search/export.
  - Student xem audit events.
  - Audit cho auth/course/class/upload.
- Dependencies da xong: P0-007, P0-008, P1-001.
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md` de suy luan nghiep vu.

## Cau Hoi / Context Chua Ro

- [x] Khong co. Story chi yeu cau luu event chi tiet cho edit/regenerate/approve/publish; P1-001 reject da co nen them reject event.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Edit/regenerate/status/submit/publish/request changes/reject tao audit event.
  - Teacher owner doc events cua lesson minh.
  - Student hoac Teacher khac khong doc duoc events.
  - Reset test clear audit events.
- Frontend:
  - API client `fetchLessonAuditEvents` goi dung endpoint.
  - UI type/labels khong loi typecheck.
- Integration/e2e:
  - Manual validation Teacher xem history sau thao tac.
- Security/access:
  - Endpoint audit check Teacher ownership/Admin role, chan Student.

### Manual validation

Prerequisite:
- Backend/frontend chay local.
- Teacher co lesson trong Lesson Studio.

Steps:
1. Login Teacher, generate lesson.
2. Edit block, approve block, submit lesson.
3. Login Admin, publish/request changes/reject lesson.
4. Login Teacher va reload lesson.

Expected:
- Teacher thay Audit history co action, actor, timestamp va details co ban.

Negative check:
- Student khong goi duoc audit events endpoint.
- Teacher khong so huu lesson khong xem duoc audit events.

## Implementation Plan Theo Vertical Slice

Backend:
- Them `LessonAuditEventResponse`, store `LESSON_AUDIT_EVENTS`.
- Them helper `_record_lesson_audit_event`.
- Goi helper trong lesson block edit/regenerate/status, submit, publish, request changes, reject.
- Them service/route `GET /lessons/{lesson_id}/audit-events`.

Frontend:
- Them type/API `fetchLessonAuditEvents`.
- TeacherManagement load audit events khi lessonResult thay doi.
- Hien Audit history panel trong Lesson Studio.

Tests:
- Backend service tests.
- Frontend API test.
- `./init.sh`.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`.
- Ghi debt neu audit van in-memory.

## Evidence Sau Khi Lam

Commands da chay:
- `cd backend && uv run pytest tests/test_lesson_blocks.py -q`
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts`
- `pnpm --dir frontend typecheck`
- `./init.sh`

Ket qua:
- Pass: backend targeted lesson/audit tests 24 passed.
- Pass: frontend API audit test 13 passed; typecheck pass.
- Full `./init.sh` pass: frontend 9 files/36 tests + build, backend 47 tests.

Manual validation da huong dan user:
- Prerequisite/Steps/Expected/Negative check nam trong exec plan nay.

## Files Changed

- `backend/main.py`
- `backend/tests/test_lesson_blocks.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/App.tsx`
- `docs/harness/exec-plans/tech-debt-tracker.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Khong co blocker. Next: P1-005 Upload books UI.

## Quality Gate

- [x] Khong vuot P1 scope da chon.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
