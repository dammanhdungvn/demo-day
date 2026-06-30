# Exec Plan - V4-016 Backend learning repositories extraction

## Muc Tieu

- Feature: `V4-016 Backend learning repositories extraction`
- User stories: `US-413 Backend modularization plan`
- Ket qua user can validate: course/class/membership API behavior khong doi, learning persistence adapters co module boundary rieng.
- Vertical slice: backend architecture cleanup nho; khong doi frontend vi API contract khong doi.

## Scope P0

- Lam:
  - Tao `backend/app/learning/repositories.py`.
  - Move `learning_schema_sql`, `InMemoryLearningRepository`, `PostgresLearningRepository`, `MEMORY_LEARNING_REPOSITORY`, `get_learning_repository`.
  - Import lai cac name trong `backend/app/main.py` de giu compatibility exports.
  - Them/cap nhat backend boundary tests cho learning repository module.
- Khong lam:
  - Khong tach learning service functions/routes trong slice nay.
  - Khong tach progress module trong slice nay.
  - Khong doi DB schema SQL, env var, API path, status code, response payload.
  - Khong chinh frontend.
- Dependencies da xong: `V4-015`.
- Source-of-truth da doc: `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Cap nhat `backend/tests/test_learning_module_boundaries.py` de assert `app.learning.repositories` expose schema SQL, memory/Postgres adapters, repository factory va `main` compatibility exports.
  - Chay `uv run pytest tests/test_learning_module_boundaries.py -q` truoc implementation de thay fail vi module chua co/can export.
  - Chay `uv run pytest tests/test_learning_module_boundaries.py tests/test_learning_persistence.py tests/test_learning.py tests/test_student_progress.py -q`.
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
- Tao learning repositories module.
- Update imports trong `backend/app/learning/__init__.py` va `backend/app/main.py`.
- Xoa definitions da move khoi `backend/app/main.py`.

Frontend:
- Khong co.

Tests:
- Cap nhat `backend/tests/test_learning_module_boundaries.py`.
- Chay targeted backend tests, full backend tests, final `./init.sh`.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/OVERNIGHT_HANDOFF.md`, `docs/version4/PRODUCT_REVIEW.md`.
- Move exec plan sang `completed/` khi done.

## Evidence Sau Khi Lam

Commands da chay:
- `cd backend && uv run pytest tests/test_learning_module_boundaries.py -q` truoc implementation
- `cd backend && uv run pytest tests/test_learning_module_boundaries.py -q` sau implementation
- `cd backend && uv run pytest tests/test_learning_module_boundaries.py tests/test_learning_persistence.py tests/test_learning.py tests/test_student_progress.py -q`
- `cd backend && uv run pytest tests/test_lesson_blocks.py -q`
- `cd backend && uv run pytest -q`
- `./init.sh`
- `python3 -m json.tool feature_list.json`
- `git diff --check`

Ket qua:
- Test-first fail dung ky vong: `ModuleNotFoundError: No module named 'app.learning.repositories'`.
- Boundary test sau implementation pass 4.
- Learning persistence/learning/progress targeted pass 22 voi 1 Starlette/httpx deprecation warning.
- Lesson block regression pass 26.
- Backend full pytest pass 120 voi 1 Starlette/httpx deprecation warning.
- Final `./init.sh` pass frontend 13 files/57 tests + build va backend 120 tests.
- JSON/diff checks pass.

Manual validation da huong dan user:
- Teacher tao course/class va add Student.
- Student thay class membership qua `/api/v1/student/classes`.
- Neu can production smoke, set `LEARNING_REPOSITORY=postgres` va chay Teacher/Student flow sau restart backend.

## Files Changed

- `backend/app/learning/repositories.py`
- `backend/app/learning/__init__.py`
- `backend/app/main.py`
- `backend/tests/test_learning_module_boundaries.py`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`
- `docs/version4/PRODUCT_REVIEW.md`

## Blockers / Next Step

- Khong co blocker hien tai.
- Next nen tach learning service functions hoac progress schemas/ports theo `docs/version4/BACKEND_MODULARIZATION_PLAN.md`.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
