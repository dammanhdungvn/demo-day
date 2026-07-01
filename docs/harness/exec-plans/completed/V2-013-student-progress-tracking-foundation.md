# Exec Plan - V2-013 Student progress tracking foundation

## Muc Tieu

- Feature: Student progress tracking foundation.
- User stories: `US-218`.
- Ket qua user can validate: Student mo published lesson, app luu last opened/current block/current slide/completed; Student dashboard resume dung lesson; Teacher thay aggregate started/completed cho lesson published cua class.
- Vertical slice: backend progress repository + API guards, frontend Student/Teacher UI, tests va handoff.

## Scope V2-P1

- Lam:
  - Luu progress theo `student_id`, `lesson_id`, `class_id`, `current_block_id`, `current_slide_index`, `started_at`, `last_opened_at`, `completed_at`.
  - Student chi doc/cap nhat progress lesson `published` thuoc class membership/org cua minh.
  - Student UI cap nhat progress khi mo lesson/chon block/chuyen slide hoac bam hoan thanh.
  - Teacher xem aggregate per lesson/class minh so huu: enrolled, started, completed, average progress percent.
  - Memory fallback + Postgres schema idempotent co RLS enabled/revoke grants.
- Khong lam:
  - Khong lam notes/bookmarks `US-219`.
  - Khong lam grounded tutor `US-220`.
  - Khong lam predictive/adaptive V3.
  - Khong fake progress neu backend chua co record.
- Dependencies da xong: `V2-011`, `V2-003`, `P0-009`, `P0-010`, `V4-002`.
- Source-of-truth da doc: `docs/version1/`, `docs/version2/`, `docs/version3/`, `feature_list.json`, harness docs, `/goal` pasted file.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker. Business rule hẹp: completion do Student bam manual; auto-complete theo slide cuoi se lam sau neu can.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Viet tests fail truoc trong `backend/tests/test_student_progress.py`.
  - Student can create/update/get progress for published lesson in membership.
  - Student cannot progress unpublished lesson, non-member lesson, or cross-org lesson.
  - Teacher can list aggregate for owned class/lesson; other teacher/student forbidden.
  - Postgres smoke neu feasible sau memory pass.
- Frontend:
  - API tests cho progress endpoints trong `frontend/src/api/learning.test.ts`.
  - Helper/UI tests neu them pure helper progress summary.
  - Full typecheck/lint/test/build.
- Integration/e2e:
  - Playwright rendered smoke Student progress mocked sau implementation neu UI surface thay doi lon.
- Security/access:
  - Backend guards la source-of-truth, frontend chi an control.

### Manual validation

Prerequisite:
- Co Teacher course/class, Student membership, lesson da publish.

Steps:
1. Dang nhap Student, mo published lesson.
2. Chon block khac hoac slide khac; reload Student workspace.
3. Bam `Hoàn thành lesson`.
4. Dang nhap Teacher, xem progress aggregate cho class/lesson.

Expected:
- Student resume dung lesson/block/slide.
- Completed state hien ro va khong bien thanh fake data.
- Teacher thay started/completed/average progress tinh tu records that.

Negative check:
- Student khong cap nhat progress cho draft/submitted/rejected lesson.
- Student ngoai class/cross-org bi backend reject.
- Teacher khac khong xem aggregate class/lesson khong so huu.

## Implementation Plan Theo Vertical Slice

Backend:
- Them Pydantic models progress request/response/aggregate.
- Them `ProgressRepository` protocol, memory/Postgres implementation, schema helper.
- Them service functions with membership/status/org guards.
- Them routes `/student/lessons/{lesson_id}/progress` GET/PUT va `/teacher/classes/{class_id}/progress`.

Frontend:
- Them API types/functions.
- Student surface load/update progress va mark complete; dùng progress để chọn continue/current block.
- Teacher workspace them aggregate panel nhe gan class/lesson context.

Tests:
- Backend test-first, frontend API/helper tests, full init.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/OVERNIGHT_HANDOFF.md`.
- Khong them env moi.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline truoc feature: `./init.sh` -> pass frontend 13 files / 56 tests + build, backend 98 tests.
- Backend targeted: `uv run pytest tests/test_student_progress.py -q` -> pass 5 tests, co 1 warning dependency Starlette TestClient/httpx.
- Backend regression/full: `uv run pytest tests/test_student_progress.py tests/test_lesson_blocks.py tests/test_learning.py -q` -> pass 39 tests; `uv run pytest -q` -> pass 103 tests, co 1 warning dependency Starlette TestClient/httpx.
- Postgres smoke: `LEARNING_REPOSITORY=postgres uv run python - <<'PY' ...` -> `student_progress_postgres_smoke_ok`, tao/doc/update/aggregate progress tam va cleanup.
- Frontend targeted: `pnpm --dir frontend exec vitest run src/api/learning.test.ts src/features/adminStudentWorkspace.test.ts` -> pass 2 files / 22 tests.
- Frontend full: `pnpm --dir frontend typecheck`, `pnpm --dir frontend lint`, `pnpm --dir frontend test -- --run` -> pass 13 files / 57 tests, `pnpm --dir frontend run build` -> pass.
- Rendered QA fallback vi Browser plugin khong co: Playwright mock API tren `http://127.0.0.1:5174/teacher` va `/student`, desktop 1440x1100 + mobile 390x900, Teacher aggregate visible, Student open lesson -> next slide -> complete visible, console issues empty va bad responses empty.
- Final quality gate: `./init.sh` -> pass frontend 13 files / 57 tests + build, backend 103 tests.

Ket qua:
- Done. Backend co progress repository/API + membership/status/org guards; frontend Student co resume/complete/current slide-block updates; Teacher co aggregate progress panel.

Manual validation da huong dan user:
- Student: dang nhap Student, bam `Tiếp tục học`, chuyen slide/block, bam `Hoàn thành`, xac nhan header/chip hien `Đã hoàn thành`/`Xong`.
- Teacher: dang nhap Teacher, xem panel `Tiến độ lớp`, xac nhan average/started/completed va row lesson published.
- Screenshots QA: `/tmp/teachflow-v2-013-teacher-progress-desktop.png`, `/tmp/teachflow-v2-013-teacher-progress-mobile.png`, `/tmp/teachflow-v2-013-student-progress-desktop.png`, `/tmp/teachflow-v2-013-student-progress-mobile.png`.

## Files Changed

- `feature_list.json`
- `backend/main.py`
- `backend/tests/test_student_progress.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/features/adminStudentWorkspace.ts`
- `frontend/src/features/adminStudentWorkspace.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`
- `docs/harness/exec-plans/completed/V2-013-student-progress-tracking-foundation.md`

## Blockers / Next Step

- Khong co blocker. Next feature nen chon tu `feature_list.json` sau khi doc V2/V3/V4 docs; V3 chua nen lam neu user muon tiep tuc harden V2.

## Quality Gate

- [x] Khong vuot V2-P1 scope.
- [x] Co test plan truoc code.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
