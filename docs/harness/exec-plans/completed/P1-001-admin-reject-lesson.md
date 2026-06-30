# Exec Plan - P1-001 Admin reject lesson

## Muc Tieu

- Feature: P1-001 Admin reject lesson
- User stories: US-032 Reject lesson
- Ket qua user can validate: Admin reject lesson submitted voi ly do; Teacher thay feedback rejected; Student khong thay lesson rejected.
- Vertical slice: backend endpoint + frontend Admin action + Teacher feedback state + tests + manual validation.

## Scope P1

- Lam:
  - Admin-only reject lesson action voi reason/feedback bat buoc.
  - Status transition `submitted_for_admin_review` -> `admin_rejected`.
  - Teacher co the reload lesson rejected va xem feedback.
  - Student tiep tuc khong thay lesson non-published.
- Khong lam:
  - Audit/history day du hon cua US-035.
  - Supabase persistence thay cho in-memory store.
  - Markdown/PPTX export.
  - Upload books / incremental ingestion.
- Dependencies da xong: P0-008 Admin moderation, P0-009 Student access, P0-011 deployment readiness.
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md` de suy luan nghiep vu.

## Cau Hoi / Context Chua Ro

- [x] Khong co. PRD da co status `admin_rejected`; US-032 yeu cau Admin reject lesson voi ly do.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Admin reject submitted lesson thanh `admin_rejected` va luu `admin_feedback`.
  - Reject voi reason rong bi 400.
  - Reject lesson khong o `submitted_for_admin_review` bi 400.
  - Teacher/Admin khac role: Teacher goi reject bi 403.
  - Student list/detail khong tra lesson `admin_rejected`.
- Frontend:
  - API client co `rejectLesson` goi dung endpoint/body.
  - Admin moderation UI co reject action va refresh queue/detail state.
  - Teacher lesson list/view hien feedback khi status `admin_rejected`.
- Integration/e2e:
  - Dung backend tests cho transition va permission; manual validation cho full UI.
- Security/access:
  - Admin endpoint check role admin.
  - Student endpoints van check published + membership.

### Manual validation

Prerequisite:
- Backend/frontend chay local, demo accounts dung password `teachflow-demo`.
- Co lesson da submit cho Admin qua Teacher flow.

Steps:
1. Login Admin, mo review queue va chon lesson submitted.
2. Nhap ly do reject, bam Reject lesson.
3. Login Teacher, reload lesson cua class va xem status rejected/feedback.
4. Login Student va xem published lessons cua class.

Expected:
- Admin action thanh cong, lesson khong con trong submitted queue.
- Teacher thay status `admin_rejected` va feedback vua nhap.
- Student khong thay lesson rejected.

Negative check:
- Teacher goi endpoint reject bi 403.
- Admin reject lesson published/draft/rejected hoac reason rong bi chan.

## Implementation Plan Theo Vertical Slice

Backend:
- Them route Admin-only `POST /api/v1/admin/lessons/{lesson_id}/reject`.
- Them service transition reject lesson, validate status va feedback.
- Dam bao Student lesson list/detail chi published nhu hien tai.

Frontend:
- Them API client `rejectLesson`.
- Them textarea/nut Reject lesson trong Admin moderation panel.
- Dam bao Teacher existing lesson panel hien rejected feedback.

Tests:
- Them backend tests vao `backend/tests/test_lesson_blocks.py` hoac file lien quan moderation.
- Them frontend API/UI tests phu hop trong `frontend/src/api/learning.test.ts`.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`.
- Khong them env moi.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh`
- `cd backend && uv run pytest tests/test_lesson_blocks.py -q`
- `pnpm --dir frontend test -- --run src/api/learning.test.ts`
- HTTP smoke local backend: login Admin/Teacher, Admin reject route missing lesson -> 404, Teacher reject route -> 403.

Ket qua:
- Pass: frontend 7 files/31 tests, typecheck/lint/build pass; backend 44 tests pass.
- Targeted backend moderation tests: 21 passed.
- Targeted frontend API test suite: 31 passed.

Manual validation da huong dan user:
- Prerequisite/Steps/Expected/Negative check nam trong exec plan nay.

## Files Changed

- `backend/main.py`
- `backend/tests/test_lesson_blocks.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/labels.ts`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Khong co blocker. Next: P1-002 Markdown export.

## Quality Gate

- [x] Khong vuot P1 scope da chon.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
