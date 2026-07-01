# Exec Plan - V4-039 Student notes and bookmarks

## Muc Tieu

- Feature: Student notes and bookmarks.
- User stories: `US-411`, `US-414`.
- Ket qua user can validate: Student mo lesson published, bookmark block quan trong, luu ghi chu rieng theo block, chuyen qua lai van thay state duoc backend luu.
- Vertical slice: backend study state API + repository memory/Postgres, frontend Student reader UI, automated tests va rendered QA.

## Scope P0

- Lam:
  - Backend Student-only read/update study state cho lesson published co class membership.
  - Luu `bookmarked_block_ids` va `notes_by_block_id` owner-scoped theo `(student_id, lesson_id)`.
  - Validate block ids thuoc lesson; trim note text va xoa note neu blank.
  - Frontend Student reader co bookmark toggle va note editor cho block dang doc.
  - Loading/saving/error state co text ro.
- Khong lam:
  - AI tutor chat, practice question generation, teacher/admin xem note cua Student.
  - Notification/reminder, analytics dashboard, sharing note.
  - Route-level IA moi hoac redesign toan bo Student workspace.
- Dependencies da xong: `V2-013`, `V4-036`, `V4-038`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`, `feature_list.json`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co. User da yeu cau agent tu quyet va khong hoi lai.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - `test_student_reads_empty_study_state_for_published_lesson`
  - `test_student_updates_bookmarks_and_notes_for_published_lesson`
  - `test_student_study_state_requires_published_membership`
  - `test_student_study_state_rejects_unknown_block_ids`
  - `test_teacher_cannot_read_student_study_state`
- Frontend:
  - API client test cho `fetchStudentLessonStudyState` va `updateStudentLessonStudyState`.
  - Student helper/UI test neu logic tinh label/summary duoc tach thanh helper.
- Integration/e2e:
  - Playwright fallback rendered QA: quick Student login/open lesson/mock API hoac seed local API, click bookmark, type/save note, desktop + mobile.
- Security/access:
  - Backend negative tests role sai, Student ngoai class, lesson draft/unpublished, block id khong thuoc lesson.

### Manual validation

Prerequisite:
- Backend/frontend local chay voi `ENABLE_DEMO_LOGIN=true`, co Student demo duoc enroll vao class co lesson published.

Steps:
1. Login quick role Student.
2. Mo mot lesson published.
3. Chon mot block, bam bookmark, nhap ghi chu va luu.
4. Chuyen sang block khac, quay lai block da ghi chu.
5. Reload workspace, mo lai lesson.

Expected:
- Block da bookmark hien trang thai da danh dau.
- Note da luu hien lai dung block.
- Lesson list/reader hien summary bookmark/note tu API.
- Status message bao dang luu/da luu/loi ro rang.

Negative check:
- Teacher/Admin token goi endpoint Student study state bi 403.
- Student ngoai class hoac lesson draft/unpublished nhan 404.
- Block id khong thuoc lesson nhan 400.

## Implementation Plan Theo Vertical Slice

Backend:
- Them module `backend/app/study` gom `schemas.py`, `ports.py`, `repositories.py`.
- Them service functions vao `backend/app/main.py` gan voi existing Student lesson/progress permission helper de tranh duplicate rule.
- Them routes `GET/PUT /api/v1/student/lessons/{lesson_id}/study-state`.
- Them reset helper cho tests va include OpenAPI protected route metadata neu can.

Frontend:
- Them types/API client trong `frontend/src/api/learning.ts`.
- Student workspace load study states song song voi progress khi co lessons; open lesson load detail/progress/study state song song.
- Them state `studyStateByLessonId`, bookmark toggle, note textarea/save button gan voi selected block.
- CSS nho cho study panel trong Student reading grid, khong redesign toan bo.

Tests:
- Backend fail-first tests trong `backend/tests/test_student_study.py`.
- Frontend API tests trong `frontend/src/api/learning.test.ts`.
- Rendered QA bang Playwright fallback vi Browser plugin khong co trong session.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/version4/README.md`, `docs/version4/PRODUCT_REVIEW.md`.
- Khong them env moi.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` baseline truoc code: pass frontend 15 files/67 tests + build, backend 174 tests.
- Fail-first: `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_student_study.py -q` loi import `LessonStudyStateUpdateRequest`; `pnpm --dir frontend exec vitest run src/api/learning.test.ts` loi `fetchStudentLessonStudyState is not a function`.
- `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_student_study.py -q`: 5 pass.
- `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_student_study.py tests/test_student_progress.py -q`: 10 pass.
- `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_student_study.py tests/test_student_progress.py tests/test_openapi_contract.py -q`: 14 pass.
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts`: 22 pass.
- `pnpm --dir frontend typecheck`: pass.
- `pnpm --dir frontend lint`: pass.
- `pnpm --dir frontend test -- --run`: 15 files/68 tests pass.
- `pnpm --dir frontend build`: pass.
- `UV_CACHE_DIR=.uv-cache uv run pytest -q`: 179 pass.
- Playwright fallback `pnpm --dir frontend exec node /tmp/v4-039-student-qa.mjs`: pass desktop 1440x1100/mobile 390x900, screenshots `/tmp/v4-039-student-study-desktop.png`, `/tmp/v4-039-student-study-mobile.png`.
- `python3 -m json.tool feature_list.json`: pass.
- `git diff --check`: pass.

Ket qua:
- Backend co `backend/app/study` voi schema/ports/repositories memory + Postgres `lesson_study_state`, RLS enabled va revoke `anon/authenticated`.
- API `GET/PUT /api/v1/student/lessons/{lesson_id}/study-state` enforce Student role, lesson published, membership/org scope va block id thuoc lesson.
- Frontend Student reader co bookmark toggle, note editor theo block, summary so danh dau/ghi chu, saving/error state va timestamp than thien.
- API inventory, V4 README, Product Review, progress va handoff da cap nhat.

Manual validation da huong dan user:
- Login Student, mo lesson published, bookmark block, nhap ghi chu va luu.
- Chuyen block/lesson roi quay lai thay bookmark/note van con.
- Negative: Teacher/Admin token bi 403, Student ngoai class/draft lesson bi 404, block id khong thuoc lesson bi 400.

## Files Changed

- `backend/app/study/__init__.py`
- `backend/app/study/schemas.py`
- `backend/app/study/ports.py`
- `backend/app/study/repositories.py`
- `backend/app/main.py`
- `backend/tests/test_student_study.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/features/student/StudentWorkspace.tsx`
- `frontend/src/App.css`
- `docs/version4/API_CONTRACT_INVENTORY.md`
- `docs/version4/README.md`
- `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`
- `docs/version4/USER_STORIES_V4.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/harness/exec-plans/completed/V4-039-student-notes-bookmarks.md`

## Blockers / Next Step

- Khong co blocker. Future feature rieng: AI Tutor grounded, practice questions, review hub cho bookmark/notes tren nhieu lesson.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md` hoac xac nhan khong co debt moi.
