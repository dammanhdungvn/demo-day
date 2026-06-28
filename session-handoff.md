# Session Handoff - TeachFlow AI

## Current Objective

- **Goal:** Dung harness de trien khai MVP TeachFlow AI theo P0 Critical.
- **Current status:** Harness da duoc tao; P0-001 den P0-011 da hoan thanh. MVP dung lai cho user testing.
- **Next active feature:** Khong con P0 active.
- **Source-of-truth:** chi `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`. Khong dung `README.md`.

## Completed This Session

- Tao root instruction file `AGENTS.md` bang tieng Viet.
- Tao `feature_list.json` tu PRD/User Stories P0 Critical.
- Tao `progress.md` voi trang thai ban dau va decision log.
- Tao `init.sh` de verify harness, env example, frontend/backend khi ton tai.
- Tao SOP va exec plan template trong `docs/harness/`.
- Tao docs harness nang cao vua du cho du an ca nhan: `ARCHITECTURE.md`, `QUALITY_SCORE.md`, `RELIABILITY_SECURITY.md`, va `docs/harness/exec-plans/`.
- Chuan hoa `.env.example` theo TeachFlow AI.
- Hoan thanh `P0-001`: backend FastAPI + uv, frontend Vite React TSX, health endpoint `/api/v1/health`, frontend health card, tests/build baseline.
- Chuan hoa frontend env: root `.env` dung `URL_BACKEND`; `vite.config.ts` expose chi backend URL can thiet cho browser.
- Audit lai env names: harness/code/docs dung key names hien co trong `.env`, va `init.sh` kiem tra `.env` theo ten bien ma khong in value.
- Fix restartability: `init.sh` dung workspace uv cache; `.env.example` co `BACKEND_CORS_ORIGINS` cho deploy frontend origin.
- Fix backend health test: baseline pytest khong dung `TestClient.get()` vi co the treo voi lock hien tai.
- Hoan thanh `P0-002`: demo accounts Admin/Teacher/Student, login/logout/me, protected role dashboards, frontend login/dashboard/session, role routing, backend role guard tests va frontend auth/session/workspace tests.
- Hoan thanh `P0-003`: Teacher create/list course, create class profile, list/add demo Student, Student list membership, frontend Teacher/Student UI, backend ownership/membership tests.
- Hoan thanh `P0-004`: Supabase schema `documents`/`document_chunks`/`generation_jobs` voi pgvector va RLS, local pre-ingest 5 completed PDF documents thanh 4,256 chunks/embeddings, backend Teacher-only documents/RAG retrieval, frontend source picker va retrieval preview/citations.
- Hoan thanh `P0-005`: AIProvider/OpenAI structured outline generation, schema validation, outline review/edit UI, live smoke OpenAI pass.
- Hoan thanh `P0-006`: AI lesson block generation tu outline session, 5 required demo block types, citations/warnings va UI preview.
- Hoan thanh `P0-007`: Teacher Lesson Studio review flow, edit/regenerate/approve/reject blocks va submit lesson cho Admin review.
- Hoan thanh `P0-008`: Admin moderation queue, block/citation/warning review, approve & publish, request changes feedback, role guard.
- Hoan thanh `P0-009`: Student published lessons theo class membership, reading view blocks/citations va direct access guard.
- Hoan thanh `P0-010`: Web presentation mode va PDF export bang browser print cho Teacher/Student lesson duoc phep xem.
- Hoan thanh `P0-011`: demo/deploy runbook va final verification.
- Fix local demo startup `Failed to fetch`: frontend local dung `URL_BACKEND=/api/v1`, Vite proxy `/api` sang backend `127.0.0.1:3000`, docs/runbook da cap nhat.
- Redesign frontend: login/workspace/Teacher/Admin/Student UI chuyen sang tieng Viet co dau, app shell gon hon, co icons/panels/status nhat quan va Playwright QA.

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| P0-002 startup baseline | `./init.sh` | Pass | Chay ngay 2026-06-28 truoc khi code P0-002; frontend typecheck/lint/test/build pass, backend pytest pass. |
| P0-002 final verification | `./init.sh` | Pass | Frontend typecheck/lint/test/build pass; Vitest 5 files/16 tests pass; backend pytest 8 pass. |
| P0-002 HTTP smoke | Local Python urllib against `http://127.0.0.1:3000/api/v1` | Pass | Demo accounts 200 count 3; teacher login 200; teacher dashboard 200; teacher -> admin 403; invalid token /me 401. |
| P0-003 final verification | `./init.sh` | Pass | Frontend typecheck/lint/test/build pass; Vitest 6 files/20 tests pass; backend pytest 14 pass. |
| P0-003 HTTP smoke | Local Python urllib against `http://127.0.0.1:3000/api/v1` | Pass | Teacher create course/class/add Student 200; Student class membership 200 count 1; wrong-role calls 403. |
| P0-004 Supabase readiness | Pooler connection + schema/DB verification | Pass | Pooler URI fixed with URL-encoded password; connection ok to Postgres 17.6. Tables `documents`, `document_chunks`, `generation_jobs` created with RLS enabled. |
| P0-004 pre-ingest | `uv run python scripts/ingest_books.py --schema-only`; `uv run python scripts/ingest_books.py --reset` | Partial pass | 5 completed documents and 4,256 chunks inserted before interrupting long run after output buffering. Script now has flush and `--start-index` for resume. |
| P0-004 DB smoke | Direct service script with Supabase repository | Pass | `list_source_documents` returned 5 docs; `retrieve_relevant_chunks` for `Transformer Architecture` returned chunks with document title/page/excerpt and saved generation job. |
| P0-004 HTTP smoke | Local Python urllib against `http://127.0.0.1:3000/api/v1` | Pass | Teacher login 200; `GET /documents` 200 count 5; `POST /rag/retrieve` 200 count 3 with `generation_job_id`; Student `GET /documents` 403. |
| P0-004 final verification | `./init.sh` | Pass | Frontend typecheck/lint/test/build pass; Vitest 6 files/22 tests pass; backend pytest 19 pass. |
| P0-005 final verification | Targeted tests + live HTTP smoke | Pass | Backend full pytest 23 pass; frontend API tests 8 pass; frontend typecheck/lint/build pass; OpenAI live outline generate 200 with 2 sessions and edit session 200. |
| P0-006 final verification | Targeted tests + live HTTP smoke | Pass | Backend full pytest 26 pass; frontend API tests 9 pass; frontend typecheck/lint/build pass; OpenAI live lesson generate 200 with 5 required block types and citations. |
| P0-007 final verification | Targeted tests + live HTTP smoke | Pass | Backend full pytest 28 pass; frontend API tests 10 pass; frontend typecheck/lint/build pass; live smoke edit block 200, regenerate 200, submit before review 400, approve all 200, submit after review 200. |
| Post P0-007 baseline | `./init.sh` | Pass | Frontend typecheck/lint/test/build pass with 6 files/26 tests; backend pytest 28 pass. |
| P0-008 final verification | Full tests + live HTTP smoke | Pass | Backend full pytest 32 pass; frontend 6 files/27 tests pass; frontend typecheck/lint/build pass; queue 200 count 1, publish 200 `published`, request changes 200 `changes_requested`, Teacher admin publish attempt 403. |
| P0-009 final verification | Full tests + live HTTP smoke | Pass | Backend full pytest 35 pass; frontend 6 files/28 tests pass; frontend typecheck/lint/build pass; before publish count 0, after publish count 1, detail 200 with 5 blocks, Teacher student endpoint 403. |
| P0-010 final verification | Full tests/build | Pass | Backend full pytest 35 pass; frontend 7 files/30 tests pass; frontend typecheck/lint/build pass; presentation slide unit tests pass; `git diff --check` pass. |
| P0-011 final verification | `./init.sh` | Pass | Frontend 7 files/30 tests pass, build pass, backend pytest 35 pass, frontend secret/backend URL guard pass. |
| Post-review moderation fix | Full tests/build | Pass | Backend targeted lesson tests 16 pass; backend full pytest 39 pass; frontend API tests 12 pass; frontend 7 files/30 tests pass; typecheck/lint/build pass; `git diff --check` pass. |
| Local API proxy fix | Proxy smoke + full verification | Pass | `GET http://127.0.0.1:5173/api/v1/auth/demo-accounts` 200, `GET /api/v1/health` 200, `git diff --check` pass, `./init.sh` pass voi frontend 31 tests va backend 39 tests. |
| Frontend Vietnamese redesign | `./init.sh` + Playwright screenshots/role smoke | Pass | Frontend 31 tests, backend 39 tests. Screenshots: login desktop/mobile, Teacher desktop/mobile, Admin desktop, Student desktop. Teacher/Admin/Student console warning/error empty. |
| Harness scaffold | `node .agents/skills/harness-creator/scripts/create-harness.mjs --target . --package-manager pnpm` | Pass | Tao file harness moi vi repo chua co artifact cu. |
| Init verification | `./init.sh` | Pass | Chay frontend typecheck/lint/test/build va backend pytest. |
| JSON validation | `python3 -m json.tool feature_list.json` | Pass | `feature_list.json` hop le. |
| Diff whitespace | `git diff --check` | Pass | Khong co whitespace error. |
| Harness validation | `node .agents/skills/harness-creator/scripts/validate-harness.mjs --target .` | Pass | Score `100/100`. |
| P0-001 baseline | `git diff --check` | Pass | Pass sau khi doi env convention ve `URL_BACKEND`. |
| Env names | `./init.sh` | Pass | `.env.example` va `.env` deu co required keys: `URL_BACKEND`, `URL_SUPABASE`, `PUBLIC_API_KEY_SUPABASE`, `SECRET_API_KEY_SUPABASE`, `OPENAI_API_KEY`, `OPENAI_MODEL`. |
| Restartability | `./init.sh` | Pass | `UV_CACHE_DIR`/`XDG_CACHE_HOME` dat trong workspace, khong phu thuoc `$HOME/.cache/uv`. |
| Backend pytest | `timeout 30s uv run pytest -q` | Pass | `2 passed`; health test dung route registration + handler payload, khong dung `TestClient`. |

## Files Changed

- `docs/harness/exec-plans/completed/P0-002-auth-role-routing.md`
- `docs/harness/exec-plans/completed/P0-003-course-class-membership.md`
- `docs/harness/exec-plans/completed/P0-004-knowledge-rag.md`
- `docs/harness/exec-plans/completed/P0-005-ai-outline.md`
- `docs/harness/exec-plans/completed/P0-006-lesson-blocks.md`
- `docs/harness/exec-plans/completed/P0-007-teacher-lesson-studio.md`
- `docs/harness/exec-plans/completed/P0-008-admin-moderation-publish.md`
- `docs/harness/exec-plans/completed/P0-009-student-published-lesson-access.md`
- `docs/harness/exec-plans/completed/P0-010-presentation-pdf.md`
- `docs/harness/exec-plans/completed/P0-011-deployment-readiness.md`
- `docs/harness/exec-plans/completed/P0-review-moderation-status-fix.md`
- `docs/harness/DEMO_RUNBOOK.md`
- `docs/harness/exec-plans/tech-debt-tracker.md`
- `backend/main.py`
- `backend/scripts/ingest_books.py`
- `backend/tests/test_auth.py`
- `backend/tests/test_knowledge_rag.py`
- `backend/tests/test_ai_outline.py`
- `backend/tests/test_lesson_blocks.py`
- `backend/tests/test_learning.py`
- `frontend/src/api/auth.ts`
- `frontend/src/api/auth.test.ts`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/auth/session.ts`
- `frontend/src/auth/session.test.ts`
- `frontend/src/auth/workspaces.ts`
- `frontend/src/auth/workspaces.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/index.html`
- `progress.md`
- `session-handoff.md`
- `AGENTS.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `init.sh`
- `.env.example`
- `docs/harness/SOP.md`
- `docs/harness/TASK_NOTE_TEMPLATE.md`
- `backend/`
- `frontend/`
- `docs/harness/exec-plans/completed/P0-001-project-setup.md`

## Decisions Made

- Dung mot bien env duy nhat `URL_BACKEND=http://localhost:3000/api/v1` o root `.env`; frontend nhan gia tri qua `vite.config.ts`, khong doc secret env truc tiep.
- Env canonical names theo `.env` hien tai: `URL_BACKEND`, `URL_SUPABASE`, `PUBLIC_API_KEY_SUPABASE`, `SECRET_API_KEY_SUPABASE`, `OPENAI_API_KEY`, `OPENAI_MODEL`; khong dung lai cac alias cu.
- `BACKEND_CORS_ORIGINS` la optional deploy env trong `.env.example`; cap nhat bang frontend production origin khi deploy.
- Backend dung FastAPI + `uv`, port `3000`, base path `/api/v1`.
- P0-001 scaffold phai dung docs chinh thuc: `pnpm create vite frontend --template react-ts`; backend dung `uv init --app`, `uv add fastapi --extra standard`, sau do chay `uv run fastapi dev main.py --host 0.0.0.0 --port 3000` neu giu file root `main.py`.
- P1/P2 khong duoc lam truoc khi P0 Critical pass end-to-end.
- Moi task can test/test plan truoc code va manual validation cho user.
- `data/books/` chi la local pre-ingest, khong commit/deploy raw PDFs/books.
- Repo la system-of-record: exec plans, debt, evidence phai nam trong repo thay vi chat history.
- P0-002 dung demo auth noi bo backend de dat MVP demo accounts/role guard ma khong can Supabase Auth production trong slice nay; debt ghi tai `TD-002`.
- P0-003 dung in-memory demo store de dat course/class/membership flow local; debt ghi tai `TD-003`.
- P0-004 tao Supabase schema qua local pre-ingest script, khong dung Data API tu frontend. Backend doc pooler/DATABASE_URL tu env/root `.env`.
- P0-004 dung deterministic local hash embedding 384 chieu de khong keo AI provider vao feature nay; debt ghi tai `TD-004`.
- P0-004 moi ingest 5/10 PDF local dau tien de du demo RAG; co the resume phan con lai bang `cd backend && uv run python scripts/ingest_books.py --start-index 5`.
- P0-005 dung OpenAI key hien co theo user approval; AI key chi doc backend tu `.env`.
- P0-005 outline store van in-memory cho demo; debt ghi tai `TD-005`.
- P0-006 lesson session/block store van in-memory cho demo; debt ghi tai `TD-006`.
- P0-007 Teacher review actions van dung in-memory lesson store de giu MVP nhanh; Admin publish/Student view se noi vao cung store trong P0 tiep theo.
- P0-008 Admin moderation state/admin feedback van dung in-memory lesson store; debt ghi tai `TD-008`.
- P0-009 Student published lesson access van dung in-memory membership/lesson store; debt ghi tai `TD-009`.
- P0-010 PDF export dung browser print, chua co backend export record; debt ghi tai `TD-010`.

## Blockers / Risks

- P0-002 demo auth noi bo backend la debt co kiem soat; Supabase Auth production neu bat buoc can scope rieng va credentials/Supabase setup.
- P0-003 in-memory store mat data khi backend restart; can Supabase/Postgres persistence truoc deploy production.
- P0-004 RAG khong con blocker DB, nhung local hash embedding va partial ingest la debt `TD-004`.
- Toan bo P0 Critical da xong. User nen testing theo `docs/harness/DEMO_RUNBOOK.md` truoc deploy, gom Manual Revision Flow sau post-review fix.

## Next Session Startup

1. Read `AGENTS.md`.
2. Run `./init.sh`.
3. Run `./init.sh`.
4. User testing theo `docs/harness/DEMO_RUNBOOK.md`, gom Manual Revision Flow.
5. Neu user feedback loi demo/deploy, fix theo bug scope cu the.

## Recommended Next Step

- Dung lai cho user testing/deploy. Khong tu mo P1/P2.
