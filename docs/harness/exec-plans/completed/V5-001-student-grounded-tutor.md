# Exec Plan - V5-001 Student Grounded Tutor

## Muc Tieu

- Feature: Student hoi AI Tutor trong lesson da publish, cau tra loi grounded theo block/citation cua lesson.
- Ket qua user can validate: Student dang hoc co the dat cau hoi, nhan cau tra loi ngan co citations, backend khong cho lesson draft/non-member/role sai.
- Vertical slice: backend API + frontend Student UI + tests + docs/evidence.

## Scope

- Lam:
  - `POST /api/v1/student/lessons/{lesson_id}/tutor`.
  - Backend guard Student role, lesson `published`, class membership, organization scope.
  - Prompt chi dung lesson block context va citation excerpts da sanitize.
  - Return answer, citations, cited block ids, warning neu thieu grounding.
  - Frontend Student reader co panel `AI Tutor có citation`.
  - API client + tests.
- Khong lam:
  - Multi-turn chat history persistence.
  - Teacher analytics tu tutor questions.
  - Grading/rubric answer-key.
  - Free-form tutor ngoai lesson/context.

## Source Da Doc

- `AGENTS.md`
- `docs/version4/README.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `docs/version4/PRODUCTION_GAP_ANALYSIS.md`
- `docs/harness/SOP.md`
- `docs/harness/ARCHITECTURE.md`
- `docs/harness/QUALITY_SCORE.md`
- `docs/harness/RELIABILITY_SECURITY.md`
- `progress.md`
- `session-handoff.md`
- `docs/version5/PRODUCT_MARKET_REVIEW.md`

## Test Plan Truoc Khi Code

### Automated tests

- Backend `backend/tests/test_student_study.py`:
  - Student member hoi tutor tren published lesson nhan answer + citations.
  - Tutor prompt co source policy va citation context da sanitize.
  - Draft lesson va non-member bi 404.
  - Lesson khong co citation khong goi AI tu do, tra warning khong du evidence.
- Frontend `frontend/src/api/learning.test.ts`:
  - `askStudentLessonTutor` POST dung endpoint, bearer token, JSON payload.
- Frontend helper/UI:
  - Future tutor slot khong con disabled trong summary helper.

### Validation commands

- Targeted backend tests.
- Targeted frontend API/helper tests.
- `pnpm --dir frontend typecheck`
- `pnpm --dir frontend lint`
- `./init.sh`

## Manual Validation

Prerequisite:
- Student co membership trong class va lesson da `published` co citation.

Steps:
1. Dang nhap Student.
2. Mo lesson published.
3. Chon mot block co citation.
4. Dat cau hoi trong panel `AI Tutor co citation`.
5. Xem cau tra loi va citations.

Expected:
- Cau tra loi ngan, dung lesson context, co danh sach citations.
- Neu block/lesson thieu citation, UI noi ro chua du bang chung.

Negative check:
- Teacher/Admin khong goi duoc endpoint Student tutor.
- Student ngoai class hoac lesson draft bi 404/403.
- Prompt injection trong citation khong duoc dua nguyen vao prompt AI.

## Evidence Sau Khi Lam

- Baseline truoc code: `./init.sh` pass frontend 15 files/71 tests + build, backend 196 tests.
- Fail-first:
  - `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_student_study.py::test_student_grounded_tutor_answers_with_citations_and_sanitized_context tests/test_student_study.py::test_student_grounded_tutor_requires_published_membership tests/test_student_study.py::test_student_grounded_tutor_without_citations_returns_warning_without_ai -q`: fail import `LessonTutorQuestionRequest`, dung ky vong.
  - `pnpm --dir frontend exec vitest run src/api/learning.test.ts src/features/adminStudentWorkspace.test.ts`: fail `askStudentLessonTutor is not a function` va future slot van disabled, dung ky vong.
- Sau fix:
  - `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_student_study.py::test_student_grounded_tutor_answers_with_citations_and_sanitized_context tests/test_student_study.py::test_student_grounded_tutor_requires_published_membership tests/test_student_study.py::test_student_grounded_tutor_without_citations_returns_warning_without_ai -q`: 3 pass.
  - `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_student_study.py tests/test_student_progress.py tests/test_openapi_contract.py tests/test_generation_jobs.py -q`: 32 pass.
  - `pnpm --dir frontend exec vitest run src/api/learning.test.ts src/features/adminStudentWorkspace.test.ts`: 28 pass.
  - `pnpm --dir frontend typecheck`: pass.
  - `pnpm --dir frontend lint`: pass.
  - `pnpm --dir frontend test -- --run`: 15 files/72 tests pass.
  - Playwright fallback rendered QA (Browser plugin khong co trong active tools): `pnpm --dir frontend exec node /tmp/v5-001-student-tutor-qa.mjs`: pass desktop/mobile Student login -> open published lesson -> ask tutor -> answer + citation visible, console issues empty. Screenshots:
    - `/tmp/v5-001-student-tutor-desktop.png`
    - `/tmp/v5-001-student-tutor-mobile.png`
  - `python3 -c 'import json; json.load(open("feature_list.json")); print("feature_list.json ok")'`: pass.
  - `git diff --check`: pass.
  - `./init.sh`: pass frontend 15 files/72 tests + build, backend 199 tests.

Ket qua:
- Backend `POST /api/v1/student/lessons/{lesson_id}/tutor` enforce Student/published/membership/org scope.
- Tutor prompt chi dung lesson block context va citation context da sanitize; source policy co trong prompt.
- Lesson khong co citation tra warning, khong goi AI.
- Frontend Student reader co tutor panel that, khong con future disabled tutor slot.

## Quality Gate

- [x] Co fail-first tests.
- [x] Backend enforce permission/status/membership.
- [x] Frontend co loading/error/empty state.
- [x] Khong hardcode secret/backend URL.
- [x] `./init.sh` pass.
- [x] Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`.
