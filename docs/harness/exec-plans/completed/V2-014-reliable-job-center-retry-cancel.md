# Exec Plan - V2-014 Reliable job center with retry and cancel

## Muc Tieu

- Feature: `V2-014 Reliable job center with retry and cancel`.
- User goal: tiep tuc hoan thien production reliability cho AI/RAG/document jobs, giam job ket `processing`, user biet loi o dau va co retry/cancel thay vi phai doan.
- Product problem: V2 da co generation job lifecycle va async ingestion toi thieu, nhung TD-013/TD-015/TD-016 van con: job dai chua co retry/cancel UI day du, in-process background task co the ket khi restart, re-index/generation job chua co recovery workflow tot.
- Visual concept approved by user: `images/job-center-design-approval-v1.png`.

## Scope P0

- Lam theo concept da duoc user duyet:
  - Backend retry/cancel endpoints cho generation jobs co role/actor/organization guard.
  - Best-effort cancel cho queued/processing/retrying jobs; khong cho cancel completed/failed theo cach lam sai history.
  - Retry failed document ingestion/re-index/AI jobs khi metadata/input con du; neu thieu raw file durable thi tra failure guidance ro, khong fake retry.
  - Frontend Job Center page theo concept duyet: table-first, status chips, search/filter, detail panel, icon-only retry/cancel.
  - Poll/refresh job status cho Teacher/Admin, khong cho Student access.
- Khong lam trong slice nay:
  - Khong build worker queue enterprise moi neu can migration lon.
  - Khong hard-delete generation job.
  - Khong luu raw PDF vao repo.
  - Khong mo UI surface moi ngoai concept Job Center neu chua co concept duyet.

## Concept Gate

- User da duyet concept `images/job-center-design-approval-v1.png`.
- UI implementation phai bam sat concept: page `Tac vu`, table-first, status chips, search/filter, detail panel, nut icon-only co `aria-label`/`title`.

## Pause Gate

- 2026-06-30: User yeu cau tam dung frontend Job Center dang lam va quay lai uu tien login + backend API connection.
- Trang thai khi pause:
  - Backend retry/cancel service/repository/routes da implement.
  - Backend targeted tests va OpenAPI tests pass 17.
  - Frontend API client + initial Job Center scaffold da bat dau nhung chua rendered QA/final DoD.
- Khi resume V2-014: doc lai file nay, tiep tuc tu frontend Job Center hoac cleanup theo yeu cau moi; khong coi feature done cho den khi rendered QA + final `./init.sh` pass.
- 2026-07-01: Da resume theo goal user va hoan thanh DoD; file nay duoc chuyen sang completed.

## Test Plan Truoc Khi Code

- Backend fail-first:
  - Student retry/cancel job bi 403.
  - Teacher khong retry/cancel job cua actor/org khac.
  - Admin chi thao tac job trong organization.
  - Completed job khong bi cancel.
  - Failed job retry tao lifecycle ro hoac tra guidance neu thieu durable input.
- Frontend sau khi duyet:
  - API tests cho retry/cancel clients.
  - UI contract test cho Job Center co table headers, status chips, retry/cancel icon labels.
  - Rendered QA desktop/mobile theo concept.
- Final:
  - `python3 -m json.tool feature_list.json`
  - `git diff --check`
  - `./init.sh`

## Implementation Plan

1. Doc lai `backend/app/jobs/*`, upload/re-index/generation job writers va Teacher job queue UI hien co.
2. Viet backend fail-first tests cho retry/cancel permission/status transitions.
3. Implement service/repository endpoints.
4. Implement frontend API client + Job Center UI theo concept duyet.
5. Rendered QA va concept-to-screenshot comparison.
6. Cap nhat feature evidence, progress, session handoff, debt tracker.

## Evidence Hien Tai

- 2026-06-30: Generated concept with built-in Image Gen and saved to `images/job-center-design-approval-v1.png`.
- 2026-06-30: User approved concept and implementation started.
- 2026-06-30: Planning/docs verification pass: `python3 -m json.tool feature_list.json`, `git diff --check`, and `./init.sh` with frontend 19 files/95 tests + build and backend 215 tests.
- 2026-06-30: Backend retry/cancel slice implemented and tested: `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_generation_jobs.py tests/test_jobs_module_boundaries.py tests/test_openapi_contract.py -q` pass 17.
- 2026-06-30: Frontend Job Center paused by user request before rendered QA/final DoD; login/API hotfix handled in `docs/harness/exec-plans/completed/BUG-006-login-backend-api-readiness.md`.
- 2026-07-01: Resume V2-014. Baseline `./init.sh` pass truoc khi code voi frontend 21 files/104 tests/build va backend 219 tests.
- 2026-07-01: Frontend Job Center/API/workspace targeted pass: `pnpm --dir frontend exec vitest run src/features/jobs/jobCenterSurface.test.ts src/api/learning.test.ts src/workspacePages.test.ts` = 3 files/38 tests.
- 2026-07-01: Backend jobs targeted pass truoc khi mo retry worker: `uv run pytest tests/test_generation_jobs.py tests/test_jobs_module_boundaries.py tests/test_openapi_contract.py -q` = 17 pass.
- 2026-07-01: Fail-first backend re-index retry test `test_retry_embedding_reindex_job_reprocesses_same_generation_job` fail import `retry_embedding_reindex_job`; sau implementation pass.
- 2026-07-01: Backend retry implementation bo sung dispatcher cho `retry_generation_job`, route retry nhan `BackgroundTasks`, `embedding_reindex` retry chay lai re-index tren cung job, AI outline/lesson/block retry re-run service hien co va cap nhat job goc voi ket qua retry.
- 2026-07-01: Regression pass: backend targeted retry 2 pass; backend jobs/OpenAPI 17 pass; backend AI/lesson/knowledge/jobs 92 pass; frontend targeted 3 files/38 tests pass.
- 2026-07-01: Rendered QA Playwright desktop 1440x1000 voi backend/frontend local: Teacher/Admin Job Center fullstack pass issues `[]`, horizontalOverflow false, screenshots `/tmp/v2-014-teacher-jobs-final-2.png`, `/tmp/v2-014-admin-jobs-final-2.png`.
- 2026-07-01: Mocked action QA de co failed/running rows pass: retry/cancel calls dung endpoint, UI doi status `Thu lai`/`Da huy`, URL/secret trong error duoc sanitize, screenshot `/tmp/v2-014-teacher-jobs-actions.png`.
- 2026-07-01: Final `./init.sh` pass voi frontend typecheck/lint, 21 files/104 tests, build va backend 221 tests.

## Files Planned

- `feature_list.json`
- `docs/harness/exec-plans/active/V2-014-reliable-job-center-retry-cancel.md`
- `images/job-center-design-approval-v1.png`
- Backend likely: `backend/app/jobs/*`, `backend/tests/test_generation_jobs.py`, `backend/tests/test_jobs_module_boundaries.py`, upload/reindex helpers in `backend/app/main.py` if needed.
- Frontend likely after approval: `frontend/src/api/learning.ts`, `frontend/src/features/teacher/TeacherWorkspace.tsx`, shared UI helpers/tests.

## Quality Gate

- [x] Concept generated and saved in `images/`.
- [x] User approved concept.
- [x] Backend retry/cancel tests pass.
- [x] Frontend UI/API tests pass.
- [x] Rendered QA pass.
- [x] `./init.sh` pass.

## Manual Validation

Prerequisite:
- Backend chay `cd backend && ../.local/bin/uv run fastapi dev main.py --host 127.0.0.1 --port 3000`.
- Frontend chay `pnpm --dir frontend run dev --host 127.0.0.1 --port 5173`.

Steps:
1. Login Teacher demo, mo sidebar `Hang doi xu ly`.
2. Login Admin demo, mo sidebar `Tac vu`.
3. Kiem tra summary status, search/filter, table, detail panel va nut refresh.
4. Tao mot job failed/running trong workflow upload/re-index/generate, thu retry/cancel tu Job Center.

Expected:
- Teacher thay job cua minh; Admin thay job trong organization.
- Retry failed job doi sang retrying/processing hoac completed/failed theo worker.
- Cancel job queued/processing/retrying doi sang cancelled theo best-effort.
- UI khong hien secret/API URL raw trong loi.

Negative check:
- Student khong co page Job Center va API `/api/v1/generation-jobs`/retry/cancel bi backend chan.
- Teacher khong thao tac duoc job cua actor/org khac; Admin khong thao tac job ngoai organization.
