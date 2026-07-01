# Exec Plan - V4-015 Backend learning schemas and ports extraction

## Muc Tieu

- Feature: `V4-015 Backend learning schemas and ports extraction`
- User stories: `US-413 Backend modularization plan`
- Ket qua user can validate: course/class/membership API behavior khong doi, learning schemas/ports co module boundary rieng.
- Vertical slice: backend architecture cleanup nho; khong doi frontend vi API contract khong doi.

## Scope P0

- Lam:
  - Tao `backend/app/learning/__init__.py`, `backend/app/learning/schemas.py`, `backend/app/learning/ports.py`.
  - Move `StudentLevel`, `CourseCreateRequest`, `CourseResponse`, `ClassCreateRequest`, `ClassProfileResponse`, `AddStudentRequest`, `ClassStudentResponse`, `StudentClassSummary`.
  - Move `LearningRepository` protocol.
  - Import lai cac name trong `backend/app/main.py` de giu compatibility exports.
  - Them backend boundary tests cho learning module.
- Khong lam:
  - Khong tach learning repositories/services/routes trong slice nay.
  - Khong tach progress module trong slice nay.
  - Khong doi DB schema, env var, API path, status code, response payload.
  - Khong chinh frontend.
- Dependencies da xong: `V4-014`.
- Source-of-truth da doc: `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Them `backend/tests/test_learning_module_boundaries.py` de assert schemas/ports import tu `app.learning.*`, `StudentLevel` literals, schema validation va `main` compatibility exports.
  - Chay `uv run pytest tests/test_learning_module_boundaries.py tests/test_learning.py tests/test_learning_persistence.py tests/test_student_progress.py -q`.
  - Chay `uv run pytest tests/test_lesson_blocks.py -q` vi lesson flow dung course/class/membership.
  - Chay `uv run pytest -q`.
- Frontend:
  - Khong co frontend change; final `./init.sh` van chay frontend typecheck/lint/test/build.
- Integration/e2e:
  - `./init.sh` sau implementation.
- Security/access:
  - Learning/student-progress/lesson tests cover teacher ownership, student membership, org-scope va status guard.

### Manual validation

Prerequisite:
- Backend dev server chay bang `cd backend && uv run fastapi dev main.py --host 0.0.0.0 --port 3000`.

Steps:
1. Dang nhap Teacher demo.
2. Tao course va class.
3. Add Student vao class.
4. Dang nhap Student va goi `/api/v1/student/classes`.

Expected:
- Teacher flow tra 200 voi payload course/class/membership nhu truoc.
- Student thay class membership.

Negative check:
- Student tao course/class hoac Teacher xem class khong owned van bi chan theo tests hien co.

## Implementation Plan Theo Vertical Slice

Backend:
- Tao learning schema/ports module.
- Update imports trong `backend/app/main.py`.
- Xoa definitions da move khoi `backend/app/main.py`.

Frontend:
- Khong co.

Tests:
- Them `backend/tests/test_learning_module_boundaries.py`.
- Chay targeted backend tests, full backend tests, final `./init.sh`.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/OVERNIGHT_HANDOFF.md`, `docs/version4/PRODUCT_REVIEW.md`.
- Move exec plan sang `completed/` khi done.

## Evidence Sau Khi Lam

Commands da chay:
- `cd backend && uv run pytest tests/test_learning_module_boundaries.py -q`
- `cd backend && uv run pytest tests/test_learning_module_boundaries.py tests/test_learning.py tests/test_learning_persistence.py tests/test_student_progress.py -q`
- `cd backend && uv run pytest tests/test_lesson_blocks.py -q`
- `cd backend && uv run pytest -q`
- `./init.sh`
- `python3 -m json.tool feature_list.json`
- `git diff --check`

Ket qua:
- Boundary test pass 3.
- Learning/progress targeted pass 21 voi 1 Starlette/httpx deprecation warning.
- Lesson block regression pass 26.
- Backend full pytest pass 119 voi 1 Starlette/httpx deprecation warning.
- Final `./init.sh` pass frontend 13 files/57 tests + build va backend 119 tests.
- JSON/diff checks pass.

Manual validation da huong dan user:
- Teacher tao course/class va add Student.
- Student thay class membership qua `/api/v1/student/classes`.
- Negative check: Student tao course/class hoac Teacher xem class khong owned van bi chan theo tests hien co.

## Files Changed

- `backend/app/learning/__init__.py`
- `backend/app/learning/schemas.py`
- `backend/app/learning/ports.py`
- `backend/app/main.py`
- `backend/tests/test_learning_module_boundaries.py`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`
- `docs/version4/PRODUCT_REVIEW.md`

## Blockers / Next Step

- Khong co blocker hien tai.
- Next nen tach learning repository/service hoac progress schemas/ports theo `docs/version4/BACKEND_MODULARIZATION_PLAN.md`.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
