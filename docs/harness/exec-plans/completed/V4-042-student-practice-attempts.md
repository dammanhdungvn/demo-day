# Exec Plan - V4-042 Student self-check practice attempts

## Muc Tieu

- Feature: Student self-check practice attempts.
- User stories: `US-411`, `US-416`, `US-417`.
- Ket qua user can validate: Student co the click mot item `Luyen tap`, nhap cau tra loi/nghi chu, chon `Can on lai` hoac `Da hieu`, luu lai va thay trang thai/attempt count tren practice deck.
- Vertical slice: backend persistent attempt endpoint + frontend practice attempt UI + tests + rendered QA.

## Scope P0

- Lam:
  - Backend Student-only `GET/PUT /api/v1/student/lessons/{lesson_id}/practice-attempts/{block_id}`.
  - Persistent attempt state qua memory/Postgres repository.
  - Validate Student role, class membership, organization scope, lesson status `published`, block id thuoc lesson va block type thuoc `quiz`/`assignment`/`common_misconception`.
  - Frontend practice panel hien attempt status, attempt count, updated_at va form self-check cho item dang chon.
- Khong lam:
  - AI tutor, AI grading, dap an dung/sai tu dong, scoring rubrics, spaced repetition scheduler.
  - Teacher/Admin analytics tu attempt.
  - Shared/public Student answer.
- Dependencies da xong: `V4-041`.
- Source-of-truth da doc: `AGENTS.md`, `docs/version1/MVP.md`, `docs/version2/README.md`, `docs/version3/README.md`, `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`, `feature_list.json`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong hoi user. Product rule ro: khong fake AI/auto-grading khi practice block chua co answer schema; dung self-check cua Student.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - `test_student_practice_attempt_saves_and_loads_self_check`
  - `test_student_practice_attempt_requires_practice_block`
  - `test_student_practice_attempt_filters_unpublished_and_non_member_lessons`
  - `test_teacher_cannot_read_or_update_student_practice_attempt`
- Frontend:
  - API client tests cho `fetchStudentPracticeAttempt` va `updateStudentPracticeAttempt`.
  - Student workspace helper/UI test neu can tach logic attempt summary.
- Integration/e2e:
  - Playwright fallback: quick Student login mocked API, practice deck hien pending item, click item, nhap answer, chon `Da hieu`, save, item hien attempted/got_it desktop/mobile.

### Manual validation

Prerequisite:
- Co Student demo thuoc class co lesson published chua block `quiz` hoac `assignment`.

Steps:
1. Login quick role Student.
2. Mo workspace Student va vao panel `Luyen tap`.
3. Click mot item practice.
4. Nhap cau tra loi/nghi chu va chon `Da hieu` hoac `Can on lai`.
5. Luu self-check, reload workspace neu can.

Expected:
- Item practice hien trang thai vua luu, attempt count va thoi gian cap nhat.
- Reader van mo dung lesson/block neu Student can xem lai context.
- UI copy ro day la tu danh gia cua Student, khong phai AI cham diem.

Negative check:
- Teacher/Admin token bi 403 khi goi attempt endpoint.
- Student ngoai class khong doc/sua attempt.
- Lesson draft/unpublished, block khong thuoc lesson hoac block khong phai practice type bi reject.

## Implementation Plan Theo Vertical Slice

Backend:
- Them schema `LessonPracticeAttempt*` trong `backend/app/study/schemas.py`.
- Mo rong `StudyRepository` voi get/upsert/list attempts can thiet.
- Them memory/Postgres persistence va schema SQL cho `lesson_practice_attempts`.
- Them service `get_student_practice_attempt`, `update_student_practice_attempt` trong `backend/app/main.py`.
- Them route GET/PUT attempt endpoint.

Frontend:
- Them type/API client attempt trong `frontend/src/api/learning.ts`.
- Student workspace load attempts cho practice items sau khi load deck.
- Hien attempt status/count trong panel `Luyen tap`.
- Them form self-check cho practice item dang chon, co saving/error state.

Tests:
- Viet fail-first backend/frontend API tests truoc implementation.
- Chay targeted, full init va rendered QA.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/version4/README.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/API_CONTRACT_INVENTORY.md`.
- Khong them env moi.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` truoc khi code: pass frontend 15 files/70 tests + build va backend 187 tests.
- Fail-first backend: `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_student_study.py -q` fail do chua co `LessonPracticeAttemptUpdateRequest`.
- Fail-first frontend: `pnpm --dir frontend exec vitest run src/api/learning.test.ts` fail do chua co `fetchStudentPracticeAttempt`.
- `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_student_study.py -q`: 17 pass.
- `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_student_study.py tests/test_student_progress.py tests/test_openapi_contract.py -q`: 26 pass.
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts`: 25 pass.
- `pnpm --dir frontend typecheck`: pass.
- `pnpm --dir frontend lint`: pass.
- `pnpm --dir frontend test -- --run`: 15 files / 71 tests pass.
- Playwright fallback `node /tmp/v4-042-student-practice-attempts-qa.mjs`: pass desktop/mobile, console/page issues empty.
- `python3 -m json.tool feature_list.json`: pass.
- `git diff --check`: pass.
- Final `./init.sh`: pass frontend 15 files / 71 tests + build va backend 191 tests.

Ket qua:
- Backend co `lesson_practice_attempts` memory/Postgres repository, `GET/PUT /api/v1/student/lessons/{lesson_id}/practice-attempts/{block_id}` va permission guard Student/published/membership/org/block type.
- `GET /api/v1/student/practice-items` enrich item bang `self_check_status`, `attempt_count`, `attempt_updated_at`.
- Frontend Student workspace co form `Self-check luyen tap`, answer textarea, status `Chua lam/Can on lai/Da hieu`, saving/error state va practice deck hien attempt summary tu API.
- Screenshot QA: `/tmp/v4-042-practice-attempt-desktop.png`, `/tmp/v4-042-practice-attempt-mobile.png`.

Manual validation da huong dan user:
- Login quick role Student.
- Vao `Luyen tap`, click quiz/assignment/common misconception item.
- Nhap cau tra loi, chon `Can on lai` hoac `Da hieu`, bam `Luu self-check`.
- Reload workspace va xac minh item practice hien dung trang thai/attempt count.
- Negative: Teacher/Admin hoac Student ngoai class khong doc/sua duoc attempt.

## Files Changed

- `backend/app/study/schemas.py`
- `backend/app/study/ports.py`
- `backend/app/study/repositories.py`
- `backend/app/study/__init__.py`
- `backend/app/main.py`
- `backend/tests/test_student_study.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/features/student/StudentWorkspace.tsx`
- `frontend/src/App.css`
- `docs/version4/README.md`
- `docs/version4/USER_STORIES_V4.md`
- `docs/version4/API_CONTRACT_INVENTORY.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Khong co blocker.
- Feature tiep theo neu can: filter practice theo status/lesson, answer schema/rubric, grounded AI feedback hoac spaced repetition scheduler.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
