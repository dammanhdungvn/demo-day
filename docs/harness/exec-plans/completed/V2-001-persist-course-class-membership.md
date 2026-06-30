# Exec Plan - V2-001 Persist courses, classes, and membership

## Muc Tieu

- Feature: `V2-001 Persist courses, classes, and membership`
- User stories: `US-204`, `US-207`, `US-208`
- Ket qua user can validate: Teacher tao course/class va add Student demo; sau khi restart backend, Teacher van list duoc course/class va Student demo van thay class membership.
- Vertical slice: backend persistence/repository + tests + manual validation bang UI hien co. Frontend khong doi contract neu API giu response cu.

## Scope V2-P0

- Lam:
  - Them repository boundary cho learning core: courses, classes, class_students.
  - Them Supabase/Postgres repository va idempotent schema setup helper cho 3 bang tren.
  - Cho backend chon repository qua env `LEARNING_REPOSITORY=memory|postgres`; mac dinh `memory` de giu demo local hien co, production dung `postgres`.
  - Giu role/ownership/membership guard backend cho Teacher/Student.
  - Them automated tests cho repository selection, persistence contract va negative permission.
- Khong lam:
  - Supabase Auth/password reset/invite flow (`US-201`, `US-203`) trong slice nay.
  - Persist outlines/lessons/audit (`US-205`, `US-206`) trong slice nay.
  - V3 adaptive/tutor/practice.
- Dependencies da xong:
  - `P0-003`, `P0-004`, `P0-009`, `P1-006`
- Source-of-truth da doc:
  - `docs/version1/MVP.md`
  - `docs/version1/PRD_MVP.md`
  - `docs/version1/USER_STORIES_MVP.md`
  - `docs/version2/README.md`
  - `docs/version2/PRD_V2_PRODUCTION.md`
  - `docs/version2/USER_STORIES_V2.md`
  - `docs/version2/V1_P2_MIGRATION.md`
  - `docs/version3/README.md`
  - `docs/version3/PRD_V3_GROWTH.md`
  - `docs/version3/USER_STORIES_V3.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker business rule cho slice nay. Auth production/invite/organization se la feature V2 rieng.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Test `LearningRepository` memory contract: create/list course, create/list class, add/list membership.
  - Test repository selection: env `LEARNING_REPOSITORY=memory` tra memory repository, `postgres` tra Postgres repository.
  - Test idempotent schema SQL co cac bang `courses`, `classes`, `class_students`.
- Frontend:
  - Khong doi frontend trong slice nay; chay typecheck/lint/test/build qua `./init.sh`.
- Integration/e2e:
  - HTTP smoke sau implement neu server local chay: Teacher tao/list course/class/add Student; restart backend neu feasible.
- Security/access:
  - Giu va mo rong tests hien co: Student bi chan khoi teacher course endpoint, Teacher khac khong tao class trong course khong so huu, Student ngoai class khong thay membership.

### Manual validation

Prerequisite:
- `.env` co `LEARNING_REPOSITORY=postgres` va DB connection hop le neu muon validate restart persistence production path.
- Backend chay port `3000`, frontend chay Vite qua `URL_BACKEND=/api/v1`.

Steps:
1. Dang nhap Teacher demo.
2. Tao course va class, add Student demo vao class.
3. Restart backend.
4. Dang nhap lai Teacher va Student demo.
5. Teacher list lai course/class; Student mo dashboard class.

Expected:
- Course/class/membership van ton tai sau restart khi `LEARNING_REPOSITORY=postgres`.
- UI Teacher/Student khong doi workflow so voi V1.

Negative check:
- Student goi `/api/v1/courses` bi 403.
- Teacher khac khong tao class vao course khong so huu.
- Student ngoai class khong thay class membership.

## Implementation Plan Theo Vertical Slice

Backend:
- Tao protocol/repository cho learning core.
- Chuyen service functions course/class/membership sang repository thay global dict truc tiep.
- Them `PostgresLearningRepository` dung `psycopg` va schema setup helper idempotent.
- Giu memory repository cho tests/local demo default.

Frontend:
- Khong doi UI/API contract trong feature nay.

Tests:
- Them targeted backend tests cho repository contract/selection/schema helper.
- Chay full backend pytest va `./init.sh`.

Docs / Env:
- Them `LEARNING_REPOSITORY` vao `.env.example`.
- Cap nhat progress/handoff/tech debt neu con fallback memory.

## Evidence Sau Khi Lam

Commands da chay:
- `uv run pytest tests/test_learning_persistence.py -q`
- `uv run pytest tests/test_learning.py tests/test_lesson_blocks.py -q`
- `LEARNING_REPOSITORY=postgres uv run python -c "<postgres smoke>"`
- `./init.sh`

Ket qua:
- Targeted persistence tests pass 5/5.
- Targeted learning/lesson tests pass 30/30.
- Supabase/Postgres smoke pass: tao course/class/membership tam, doc lai bang repository instance moi, cleanup course tam thanh cong.
- Final `./init.sh` pass: frontend 11 files/43 tests + build, backend 63 tests.

Manual validation da huong dan user:
- Prerequisite: dat `LEARNING_REPOSITORY=postgres` trong `.env` va dung DB connection hop le.
- Steps: Teacher tao course/class/add Student demo, restart backend, Teacher list lai course/class va Student demo mo dashboard class.
- Negative: Student `/api/v1/courses` 403; Teacher khac khong tao class vao course khong so huu; Student ngoai class khong thay class.

## Files Changed

- `.env.example`
- `backend/main.py`
- `backend/tests/test_learning_persistence.py`
- `feature_list.json`
- `docs/harness/exec-plans/completed/V2-001-persist-course-class-membership.md`

## Blockers / Next Step

- V2-P0 tiep theo nen persist outlines/lesson blocks/generation jobs hoac production auth/organization. V3 chua nen bat dau vi V2 foundation chua xong.

## Quality Gate

- [x] Khong vuot V2-P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
