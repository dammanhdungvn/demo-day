# Exec Plan - V4-019 Backend progress schemas and ports extraction

## Muc Tieu

- Feature: `V4-019 Backend progress schemas and ports extraction`
- User stories: `US-413 Backend modularization plan`
- Ket qua user can validate: Student progress API va Teacher class progress aggregate tiep tuc dung nhu V2-013, nhung progress schemas/protocol da co module boundary ro trong `backend/app/progress/`.
- Vertical slice: backend architecture cleanup nho, behavior-preserving; khong doi frontend, DB schema, env, API path hay response payload.

## Scope P0

- Lam:
  - Tao `backend/app/progress/__init__.py`, `backend/app/progress/schemas.py`, `backend/app/progress/ports.py`.
  - Move `LessonProgressUpdateRequest`, `LessonProgressRecord`, `LessonProgressResponse`, `TeacherLessonProgressSummary` ra progress schema module.
  - Move `ProgressRepository` protocol ra progress ports module.
  - Import/re-export compatibility names trong `backend/app/main.py`.
  - Them backend boundary tests va chay regression Student progress.
- Khong lam:
  - Chua tach progress repositories/services/routes trong feature nay.
  - Khong doi `lesson_progress` schema SQL, `LEARNING_REPOSITORY`, auth, membership, org-scope, content repository hay frontend API.
  - Khong them UI moi hoac route moi.
- Dependencies da xong: `V4-018`, `V2-013`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Them `backend/tests/test_progress_module_boundaries.py`.
  - Test import progress schemas tu `app.progress.schemas` va compatibility export tu `main`.
  - Test `ProgressRepository` protocol expose `get_progress`, `upsert_progress`, `list_progress_for_lessons`, `ensure_schema`.
  - Test `LessonProgressUpdateRequest` validation giu `current_slide_index >= 0`.
- Frontend:
  - Khong co frontend change; final `./init.sh` van chay frontend typecheck/lint/test/build.
- Integration/e2e:
  - Chay `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_progress_module_boundaries.py tests/test_student_progress.py -q`.
  - Chay targeted learning/content regression lien quan: `tests/test_learning_module_boundaries.py tests/test_learning.py tests/test_lesson_blocks.py`.
  - Chay backend full pytest va final `./init.sh`.
- Security/access:
  - `tests/test_student_progress.py` tiep tuc cover published lesson, membership guard, Teacher owned class guard.

### Manual validation

Prerequisite:
- Backend dang chay voi demo data hoac local in-memory default.
- Co Teacher, Student demo account va lesson da publish cho class co Student.

Steps:
1. Student goi `GET /api/v1/student/lessons/{lesson_id}/progress`.
2. Student goi `PUT /api/v1/student/lessons/{lesson_id}/progress` voi `current_block_id`, `current_slide_index`, `completed`.
3. Teacher goi `GET /api/v1/teacher/classes/{class_id}/progress`.

Expected:
- Response schema/status khong doi so voi V2-013.
- Student progress percent/current block/current slide/completed state dung.
- Teacher aggregate progress tinh tu published lesson va enrolled students.

Negative check:
- Student ngoai class hoac lesson chua `published` van nhan 404.
- Teacher khong owned class van nhan 404.

## Implementation Plan Theo Vertical Slice

Backend:
- Them progress package va move schemas/protocol ra module moi.
- Import progress schemas/ports vao `backend/app/main.py` de cac repository/service/route hien co tiep tuc dung.
- Cap nhat `backend/app/progress/__init__.py` export public names.

Frontend:
- Khong thay doi.

Tests:
- Viet boundary test truoc, chay de fail do chua co `app.progress`.
- Implement module split.
- Chay targeted va full verification.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/version4/PRODUCT_REVIEW.md`.
- Move exec plan sang completed neu done.
- Khong doi env.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` truoc code: pass frontend 13 files/57 tests + build, backend 122 tests.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_progress_module_boundaries.py -q` test-first: fail dung ky vong vi thieu `app.progress`.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_progress_module_boundaries.py -q`: pass 4.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_student_progress.py -q`: pass 5.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_progress_module_boundaries.py tests/test_student_progress.py tests/test_learning_module_boundaries.py tests/test_learning.py tests/test_lesson_blocks.py -q`: pass 49.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest -q`: pass 126.
- `./init.sh`: pass frontend 13 files/57 tests + build, backend 126 tests.
- `python3 -c "import json; json.load(open('feature_list.json')); print('feature_list_json_ok')"`: pass.
- `git diff --check`: pass.

Ket qua:
- `backend/app/progress/` da co schema va port boundary.
- `backend/app/main.py` khong con dinh nghia truc tiep progress schemas/protocol da tach, nhung compatibility exports van giu.
- API `/api/v1/student/lessons/{lesson_id}/progress` va `/api/v1/teacher/classes/{class_id}/progress` khong doi behavior.

Manual validation da huong dan user:
- Student doc/update progress va Teacher xem aggregate progress theo steps trong plan.
- Negative check: Student ngoai class/lesson chua publish va Teacher khong owned class tiep tuc bi chan theo automated tests.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V4-019-backend-progress-schemas-ports.md`
- `backend/app/progress/__init__.py`
- `backend/app/progress/schemas.py`
- `backend/app/progress/ports.py`
- `backend/app/main.py`
- `backend/tests/test_progress_module_boundaries.py`
- `progress.md`
- `session-handoff.md`
- `docs/version4/PRODUCT_REVIEW.md`

## Blockers / Next Step

- Khong co blocker.
- Next sau khi done: V4 progress repositories/services extraction theo Slice 3, neu baseline con pass.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
