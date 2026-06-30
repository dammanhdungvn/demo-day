# Exec Plan - V4-040 Student personal review hub

## Muc Tieu

- Feature: Student personal review hub.
- User stories: `US-411`, `US-414`, `US-415`.
- Ket qua user can validate: Student nhin thay mot panel on tap ca nhan gom cac block da bookmark/ghi chu tren lesson published, click vao item de mo dung lesson/block.
- Vertical slice: backend review endpoint + repository query, frontend review hub UI, tests va rendered QA.

## Scope P0

- Lam:
  - Backend Student-only `GET /api/v1/student/study-review`.
  - Tong hop study state cua Student hien tai tren lesson published co membership/org scope.
  - Tra review items theo block voi lesson/block metadata, note, bookmark flag, citation count, updated_at.
  - Frontend Student workspace load review items, hien empty/loading/error state, click item mo dung lesson/block.
- Khong lam:
  - AI tutor/practice generation, smart ranking bang LLM, Teacher/Admin insight tu private note.
  - Search/filter nang cao, pagination, notification/reminder.
  - Route-level navigation moi.
- Dependencies da xong: `V4-039`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/PRODUCT_REVIEW.md`, `feature_list.json`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co. User da yeu cau agent tu quyet va khong hoi lai.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - `test_student_review_lists_bookmarked_and_noted_blocks`
  - `test_student_review_filters_unpublished_and_non_member_lessons`
  - `test_teacher_cannot_read_student_review`
  - `test_student_review_ignores_stale_block_ids`
- Frontend:
  - API client test cho `fetchStudentStudyReview`.
  - Render/helper test neu tach summary logic.
- Integration/e2e:
  - Playwright fallback: quick Student login mocked API, review hub hien item, click item mo lesson va selected block dung desktop/mobile.
- Security/access:
  - Backend negative tests role sai, Student ngoai class, draft lesson.

### Manual validation

Prerequisite:
- Co Student demo thuoc class co lesson published va da bookmark/ghi chu it nhat mot block.

Steps:
1. Login quick role Student.
2. Mo workspace Student va tim panel `On tap ca nhan`.
3. Click mot item co note/bookmark.
4. Kiem tra reader mo dung lesson va block duoc focus/chon.

Expected:
- Panel hien lesson/block/note/bookmark/citation count tu backend.
- Item click mo dung block trong reader.
- Empty state ro neu chua co bookmark/ghi chu.

Negative check:
- Teacher/Admin token bi 403 khi goi `/student/study-review`.
- Student ngoai class khong thay note/bookmark cua lesson do.
- Lesson draft/unpublished khong xuat hien.

## Implementation Plan Theo Vertical Slice

Backend:
- Them schema `LessonStudyReviewItem`.
- Them repository method `list_states_for_student`.
- Them service `list_student_study_review` tai `backend/app/main.py` dung content/learning/study repositories va `_class_ids_for_student`.
- Them route `GET /api/v1/student/study-review`.

Frontend:
- Them type/API `LessonStudyReviewItem` va `fetchStudentStudyReview`.
- Student workspace load review items song song voi class/lesson/document data.
- Them panel `On tap ca nhan` trong Student first surface; item click goi `handleOpenLesson(lesson, blockId)`.
- Them CSS scoped cho list item, mobile-safe.

Tests:
- Fail-first backend/frontend API tests.
- Rendered QA fallback bang Playwright.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/version4/README.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/API_CONTRACT_INVENTORY.md`.
- Khong them env moi.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` baseline truoc code: pass.
- Fail-first: `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_student_study.py -q` fail dung ky vong khi chua co `list_student_study_review`.
- Fail-first: `pnpm --dir frontend exec vitest run src/api/learning.test.ts` fail dung ky vong khi chua co `fetchStudentStudyReview`.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_student_study.py -q`: pass 10.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_student_study.py tests/test_student_progress.py tests/test_openapi_contract.py -q`: pass 18.
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts`: pass 23.
- `pnpm --dir frontend test -- --run`: pass 15 files/69 tests.
- `pnpm --dir frontend typecheck`: pass.
- `pnpm --dir frontend lint`: pass.
- `pnpm --dir frontend build`: pass.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest -q`: pass 184.
- `node /tmp/v4-040-student-review-qa.mjs`: pass sau khi chay Chromium Playwright ngoai sandbox do sandbox mac dinh chan launch.
- `python3 -m json.tool feature_list.json`: pass.
- `git diff --check`: pass.
- `./init.sh` final: pass frontend 15 files/69 tests + build va backend 184 tests.

Ket qua:
- Backend co `GET /api/v1/student/study-review` Student-only, tong hop bookmark/ghi chu tren lesson published co membership/org scope, khong leak draft/non-member/role sai va bo stale block ids.
- Frontend Student workspace co panel `On tap ca nhan`, load data tu API that, hien empty/loading/error state va click review item mo dung lesson/block.
- Screenshot QA: `/tmp/v4-040-student-review-desktop.png`, `/tmp/v4-040-student-review-mobile.png`.

Manual validation da huong dan user:
- Login quick role Student.
- Mo workspace Student va xem panel `On tap ca nhan`.
- Click item bookmark/ghi chu va xac nhan reader mo dung lesson/block.
- Thu Teacher/Admin token voi `/student/study-review` va xac nhan 403; Student ngoai class/draft lesson khong thay item.

## Files Changed

- `backend/app/main.py`
- `backend/app/study/__init__.py`
- `backend/app/study/ports.py`
- `backend/app/study/repositories.py`
- `backend/app/study/schemas.py`
- `backend/tests/test_student_study.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/features/student/StudentWorkspace.tsx`
- `frontend/src/App.css`
- `feature_list.json`
- `docs/version4/README.md`
- `docs/version4/API_CONTRACT_INVENTORY.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Khong con blocker. Neu tiep tuc tang Student retention thi mo feature moi cho AI Tutor grounded/practice questions hoac search/filter review hub.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md` hoac xac nhan khong co debt moi.
