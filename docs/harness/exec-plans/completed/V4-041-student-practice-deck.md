# Exec Plan - V4-041 Student practice deck from published lessons

## Muc Tieu

- Feature: Student practice deck from published lessons.
- User stories: `US-411`, `US-416`.
- Ket qua user can validate: Student thay mot panel `Luyen tap` gom cac block quiz/assignment/common misconception tu lesson published, click item de mo dung lesson/block.
- Vertical slice: backend practice endpoint + frontend practice deck UI + tests + rendered QA.

## Scope P0

- Lam:
  - Backend Student-only `GET /api/v1/student/practice-items`.
  - Tong hop assessment blocks tu lesson `published` ma Student co class membership/org scope.
  - Tra item gom lesson/block metadata, prompt/content, citation count va updated_at.
  - Frontend Student workspace load practice items, hien empty/loading/error state, click item mo dung lesson/block.
- Khong lam:
  - AI tutor, AI-generated practice moi, grading/attempt scoring, spaced repetition scheduler.
  - Teacher/Admin insight tu practice behavior.
  - Persistent attempt state trong slice nay.
- Dependencies da xong: `V4-040`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`, `feature_list.json`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong hoi user. Goal yeu cau tiep tuc nang chat luong san pham; practice deck tu lesson da publish la feature user-facing ro va khong can API key moi.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - `test_student_practice_lists_assessment_blocks_from_published_lessons`
  - `test_student_practice_filters_unpublished_and_non_member_lessons`
  - `test_teacher_cannot_read_student_practice`
- Frontend:
  - API client test cho `fetchStudentPracticeItems`.
- Integration/e2e:
  - Playwright fallback: quick Student login mocked API, practice deck hien item, click item mo lesson va selected block dung desktop/mobile.

### Manual validation

Prerequisite:
- Co Student demo thuoc class co lesson published chua block `quiz` hoac `assignment`.

Steps:
1. Login quick role Student.
2. Mo workspace Student va tim panel `Luyen tap`.
3. Click mot item practice.
4. Kiem tra reader mo dung lesson va block duoc focus/chon.

Expected:
- Panel hien lesson/block/prompt/type/citation count tu backend.
- Item click mo dung block trong reader.
- Empty state ro neu lesson published chua co quiz/assignment/common misconception.

Negative check:
- Teacher/Admin token bi 403 khi goi `/student/practice-items`.
- Student ngoai class khong thay practice item cua lesson do.
- Lesson draft/unpublished khong xuat hien.

## Implementation Plan Theo Vertical Slice

Backend:
- Them schema `LessonPracticeItem`.
- Them service `list_student_practice_items` trong `backend/app/main.py` dung content/learning repositories va `_class_ids_for_student`.
- Them route `GET /api/v1/student/practice-items`.

Frontend:
- Them type/API `LessonPracticeItem` va `fetchStudentPracticeItems`.
- Student workspace load practice items song song voi class/lesson/document/review data.
- Them panel `Luyen tap` trong Student first surface; item click goi `handleOpenLesson(lesson, blockId)`.
- CSS dung chung style review item khi phu hop, mobile-safe.

Tests:
- Fail-first backend/frontend API tests.
- Rendered QA fallback bang Playwright.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/version4/README.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/API_CONTRACT_INVENTORY.md`.
- Khong them env moi.

## Evidence Sau Khi Lam

Commands da chay:
- Startup baseline:
  - `./init.sh` pass truoc khi code: frontend 15 files/69 tests + build, backend 184 tests.
- Fail-first:
  - `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_student_study.py -q` fail dung ky vong do chua co `list_student_practice_items`.
  - `pnpm --dir frontend exec vitest run src/api/learning.test.ts` fail dung ky vong do chua co `fetchStudentPracticeItems`.
- Backend:
  - `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_student_study.py -q` pass 13 tests.
  - `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_student_study.py tests/test_student_progress.py tests/test_openapi_contract.py -q` pass 22 tests.
  - `UV_CACHE_DIR=.uv-cache uv run pytest -q` pass 187 tests.
- Frontend:
  - `pnpm --dir frontend exec vitest run src/api/learning.test.ts src/workspaceActionTargets.test.ts` pass 2 files / 29 tests.
  - `pnpm --dir frontend test -- --run` pass 15 files / 70 tests.
  - `pnpm --dir frontend typecheck` pass.
  - `pnpm --dir frontend lint` pass.
  - `pnpm --dir frontend build` pass.
- Rendered QA:
  - `node /tmp/v4-041-student-practice-qa.mjs` pass voi Chromium escalation vi sandbox khong cho browser launch.
  - Screenshots: `/tmp/v4-041-student-practice-desktop.png`, `/tmp/v4-041-student-practice-mobile.png`.
- Harness closeout:
  - `python3 -m json.tool feature_list.json /tmp/v4-041-feature-list-json-check.json` pass.
  - `git diff --check` pass.
  - `./init.sh` pass sau closeout: frontend 15 files/70 tests + build, backend 187 tests.

Ket qua:
- Backend da them `LessonPracticeItem` va endpoint Student-only `GET /api/v1/student/practice-items`.
- Service chi lay block `quiz`, `assignment`, `common_misconception` tu lesson `published` ma Student co class membership va organization scope.
- Teacher/Admin bi 403, Student ngoai class khong thay item, lesson draft/unpublished khong leak.
- Frontend Student workspace co panel `Luyen tap`, load tu API that, co empty/status message, item click mo dung lesson/block.
- Them shortcut `Luyen tap` vao Student taskbar/action target.
- Sua bug UX phat hien qua rendered QA: khi mo target block tu review/practice, `current_slide_index` phai offset +1 vi presentation co title slide o index 0; block nav Student cung luu slide index dung.

Manual validation da huong dan user:
- Chay backend/frontend local.
- Login quick role Student.
- Mo workspace Student, bam shortcut `Luyen tap` hoac keo den panel `Luyen tap`.
- Click mot item quiz/assignment.
- Kiem tra reader mo dung lesson va focus/chon dung block, presentation slide khop voi block.
- Dung Teacher/Admin token goi `/api/v1/student/practice-items` phai 403.

## Files Changed

- `backend/app/main.py`
- `backend/app/study/schemas.py`
- `backend/app/study/__init__.py`
- `backend/tests/test_student_study.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/features/student/StudentWorkspace.tsx`
- `frontend/src/workspaceActionTargets.ts`
- `frontend/src/workspaceActionTargets.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `docs/version4/README.md`
- `docs/version4/USER_STORIES_V4.md`
- `docs/version4/API_CONTRACT_INVENTORY.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/harness/exec-plans/completed/V4-041-student-practice-deck.md`

## Blockers / Next Step

- Khong co blocker.
- Neu tiep tuc nang Student retention, nen mo feature moi cho practice attempts/scoring hoac grounded AI Tutor co citation, nhung khong nam trong slice V4-041.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
