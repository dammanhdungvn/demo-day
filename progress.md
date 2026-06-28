# Progress - TeachFlow AI Harness

## Trang Thai Hien Tai

**Last updated:** 2026-06-28  
**Active feature tiep theo:** Khong con P0 active; dung lai cho user testing MVP.
**Muc tieu:** Dung harness de AI agent trien khai MVP theo P0 Critical, khong mo rong sang P1/P2.
**Source-of-truth:** chi doc `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`; khong dung `README.md`.

## Da Hoan Thanh Trong Session Harness

- Tao `AGENTS.md` lam instruction file goc cho agent.
- Tao `feature_list.json` voi danh sach vertical slices P0, dependencies, tests va manual validation.
- Tao `init.sh` lam verification entrypoint.
- Tao `session-handoff.md` de tiep tuc session sau.
- Tao `docs/harness/SOP.md` va `docs/harness/TASK_NOTE_TEMPLATE.md`.
- Tao harness nang cao vua du cho du an nho: `ARCHITECTURE.md`, `QUALITY_SCORE.md`, `RELIABILITY_SECURITY.md`, va `exec-plans`.
- Chuan hoa `.env.example` theo bien moi truong TeachFlow AI.
- Hoan thanh `P0-001`: tao `backend/` FastAPI + uv, `frontend/` Vite React TSX, health endpoint `/api/v1/health`, frontend health card, test/build baseline.
- Doi frontend env convention ve mot nguon duy nhat: root `.env` dung `URL_BACKEND`; `vite.config.ts` expose co kiem soat cho browser.
- Audit lai `.env`: `.env.example`, `init.sh`, docs va frontend config da dung dung key names hien co trong `.env`.
- Fix restartability: `init.sh` dat `UV_CACHE_DIR`/`XDG_CACHE_HOME` trong workspace va `.env.example` khai bao `BACKEND_CORS_ORIGINS` cho deploy.
- Fix backend baseline test: health pytest khong dung `TestClient.get()` de tranh treo trong `./init.sh`.
- Hoan thanh `P0-002`: demo auth noi bo backend cho Admin/Teacher/Student, login/logout/me, protected role dashboards, frontend login/dashboard/session, role routing va tests.
- Hoan thanh `P0-003`: Teacher tao course/class profile, add Student demo vao class; Student xem class membership; backend enforce teacher ownership/student membership.
- Hoan thanh `P0-004`: tao schema Supabase `documents`, `document_chunks`, `generation_jobs` voi pgvector/RLS; pre-ingest 5 completed PDF documents thanh 4,256 chunks/embeddings; backend Teacher-only documents/RAG retrieval; frontend source picker + retrieval preview/citations.
- Hoan thanh `P0-005`: OpenAI-backed structured outline generation tu course/class/source docs, schema validation, outline review/edit UI va live smoke pass.
- Hoan thanh `P0-006`: OpenAI-backed lesson blocks tu outline session, 5 demo block types bat buoc, citations/warnings va UI preview.
- Hoan thanh `P0-007`: Teacher Lesson Studio review flow voi edit/regenerate/approve/reject blocks va submit lesson cho Admin review.
- Hoan thanh `P0-008`: Admin moderation queue, xem blocks/citations/warnings, approve & publish, request changes kem feedback.
- Hoan thanh `P0-009`: Student chi xem published lessons thuoc class membership, co reading view blocks/citations va direct access guard.
- Hoan thanh `P0-010`: Web presentation mode va PDF export bang browser print cho Teacher/Student lesson duoc phep xem.
- Hoan thanh `P0-011`: demo/deploy runbook va final verification cho user testing.
- Fix local demo startup `Failed to fetch`: local `.env` dung `URL_BACKEND=/api/v1`, Vite dev proxy `/api` ve backend `127.0.0.1:3000`, va frontend dev server da restart tren port `5173`.
- Redesign frontend cho demo MVP: app shell/login/workspace Teacher/Admin/Student theo UI tieng Viet co dau, bo cuc gon hon, icon/button/panel/status nhat quan, responsive mobile da QA bang Playwright.

## Dang Cho Lam

- Khong con P0 Critical active. Dung lai de user testing MVP truoc deploy.
- Khong lam P1/P2 cho den khi user confirm MVP testing/deploy xong.

## Blockers / Rui Ro

- Demo auth noi bo backend la shortcut cua `P0-002`; da ghi debt `TD-002`. Neu sau nay can Supabase Auth production thi lam theo scope rieng.
- P0-003 dung in-memory demo store; da ghi debt `TD-003`. Can Supabase persistence truoc deploy production.
- P0-004 dung deterministic local hash embedding 384 chieu va moi ingest 5/10 PDF local; debt `TD-004`. Khi P0-005/P0-006 bat AI provider, can thay bang embedding provider that hoac ingest tiep `uv run python scripts/ingest_books.py --start-index 5`.
- P0-005/P0-006 da dung OpenAI key backend theo user approval; khong dua key ra frontend.
- P0-007 lesson review flow van dung in-memory lesson store; can persistence truoc deploy production dai han.
- P0-008 admin moderation state/admin feedback van dung in-memory lesson store; debt `TD-008`.
- P0-009 student published lesson access doc tu in-memory membership/lesson store; debt `TD-009`.
- P0-010 PDF export dung browser print, chua co backend export record; debt `TD-010`.
- In-memory state la rui ro lon nhat khi deploy demo: backend restart se mat course/class/outline/lesson/moderation state.
- `README.md` dang khong phai tai lieu cua du an nay va khong duoc dung lam harness source.
- `data/books/` phai duoc giu local-only, khong commit raw PDFs/books.

## Decision Log

- **Chi P0 Critical:** P1/P2 bi khoa trong `feature_list.json` cho den khi full P0 demo pass.
- **Vertical slice bat buoc:** Moi feature phai co backend + frontend + test/test plan + manual validation.
- **Env convention:** Root `.env` dung `URL_BACKEND`. Frontend khong doc `.env` truc tiep; `vite.config.ts` chi expose backend URL can thiet qua build constant. Khong dua AI/Supabase service keys vao frontend.
- **Env required keys:** `URL_BACKEND`, `URL_SUPABASE`, `PUBLIC_API_KEY_SUPABASE`, `SECRET_API_KEY_SUPABASE`, `OPENAI_API_KEY`, `OPENAI_MODEL`.
- **Env optional deploy key:** `BACKEND_CORS_ORIGINS` de khai bao frontend origins duoc phep goi backend.
- **Test truoc code:** Neu test framework chua ton tai, exec plan phai ghi test plan truoc, sau do feature setup tao test framework phu hop.

## Evidence

- 2026-06-28 P0-002 startup: doc startup workflow, `feature_list.json` xac nhan `P0-002` la active feature hop le va `P0-001` da done; `./init.sh` pass truoc khi code.
- 2026-06-28 P0-002 planning: exec plan active `P0-002-auth-role-routing.md` xac nhan dung demo auth noi bo backend cho P0; bat dau implementation theo test-first.
- 2026-06-28 P0-002 done: `./init.sh` pass sau implementation; frontend typecheck/lint/test/build pass voi 5 test files, 16 tests; backend pytest pass 8 tests; HTTP smoke tren local dev server pass login va role guard 200/403/401; review findings da fix.
- 2026-06-28 P0-003 done: `./init.sh` pass; frontend 6 test files/20 tests pass; backend pytest 14 pass; HTTP smoke pass Teacher create course/class/add Student va Student membership 200, wrong-role calls 403.
- 2026-06-28 P0-004 blocker: Supabase REST check khong in secret; `documents` HTTP 404 va `document_chunks` HTTP 404; REST OpenAPI status 200 path_count 2 khong co document/chunk paths; Accept-Profile public/graphql_public van 404, storage/extensions 406. Local PDFs ton tai trong `data/books/`. DB direct string user bo sung khong parse do password co `@`; connect bang tham so rieng den direct host fail vi IPv6 `Network is unreachable`; pooler pattern pho bien fail `tenant/user not found`. Can pooler string chinh xac hoac IPv6-capable environment.
- 2026-06-28 P0-004 done: User cung cap pooler, agent fix URL-encode trong `.env`; DB connect ok. `uv run python scripts/ingest_books.py --schema-only` tao schema; `uv run python scripts/ingest_books.py --reset` ingest 5 completed docs/4,256 chunks truoc khi dung do output buffering. DB verification: 5 completed docs, 4,256 chunks, retrieval_jobs completed. Backend tests `19 passed`; frontend tests 6 files/22 tests; HTTP smoke Teacher `GET /documents` 200 count 5, `POST /rag/retrieve` 200 count 3 va co job id, Student `/documents` 403. `./init.sh` pass.
- 2026-06-28 P0-005 done: User cho phep dung existing `OPENAI_API_KEY`. Backend AIProvider/OpenAI structured output + outline endpoints implemented; frontend AI course outline panel implemented. Tests: backend targeted 4 pass, backend full 23 pass, frontend API 8 pass, frontend typecheck/lint/build pass. Live smoke: Teacher create course/class, generate outline 2 sessions via OpenAI, update session all 200.
- 2026-06-28 P0-006 done: Backend lesson generation endpoint + schema validation + citations/warnings; frontend generate/render lesson blocks. Tests: backend targeted 3 pass, backend full 26 pass, frontend API 9 pass, frontend typecheck/lint/build pass. Live smoke: generate lesson 200 voi 5 required block types va citations.
- 2026-06-28 P0-007 done: Backend Teacher-only edit/regenerate/status/submit lesson block routes, frontend Lesson Studio editor/actions, backend full pytest 28 pass, frontend API tests 10 pass, frontend typecheck/lint/build pass, live smoke edit/regenerate/submit-before-review/approve-all/submit-after-review pass.
- 2026-06-28 post P0-007 baseline: `./init.sh` pass voi frontend 6 files/26 tests, build pass, backend 28 tests pass.
- 2026-06-28 P0-008 done: Backend Admin-only review queue/publish/request-changes routes, frontend Admin moderation panel. Backend full pytest 32 pass, frontend 6 files/27 tests pass, frontend typecheck/lint/build pass, `git diff --check` pass. Live HTTP smoke: queue 200 count 1, publish 200 `published`, request changes 200 `changes_requested`, Teacher goi Admin publish 403.
- 2026-06-28 P0-009 done: Backend Student-only published lesson list/detail theo membership, frontend Student reading view. Backend full pytest 35 pass, frontend 6 files/28 tests pass, frontend typecheck/lint/build pass, `git diff --check` pass. Live HTTP smoke: before publish count 0, after publish count 1, detail 200 voi 5 blocks, Teacher goi Student lessons 403.
- 2026-06-28 P0-010 done: Frontend presentation component cho Teacher/Student, next/previous, keyboard arrows, fullscreen, progress, Export PDF bang print layout. Frontend 7 files/30 tests pass, typecheck/lint/build pass, backend full pytest 35 pass, `git diff --check` pass.
- 2026-06-28 P0-011 done: Them `docs/harness/DEMO_RUNBOOK.md` voi run commands, demo accounts, manual validation flow va deploy notes. Final `./init.sh` pass: frontend 7 files/30 tests, build pass, backend 35 tests pass, frontend secret/backend URL guard pass.
- 2026-06-28 post-review moderation fix: Fix 4 findings review ve lesson status boundary. Teacher khong the resubmit lesson da `published`, khong mutate block khi lesson `submitted_for_admin_review`/`published`, edit changed block reset status ve `needs_review`, Teacher co `GET /api/v1/teacher/lessons?class_id=...` va UI Existing lesson de xem `changes_requested` + `admin_feedback`. Tests: backend targeted lesson tests 16 pass, backend full 39 pass, frontend API tests 12 pass, frontend 7 files/30 tests pass, typecheck/lint/build pass, `git diff --check` pass.
- 2026-06-28 local API proxy fix: Nguyen nhan `Failed to fetch` khi mo frontend lan dau la `URL_BACKEND` local dang sai/thieu protocol va phu thuoc browser `localhost`. Da doi local/template sang `URL_BACKEND=/api/v1`, them Vite dev proxy `/api -> http://127.0.0.1:3000`, restart frontend `0.0.0.0:5173`. Evidence: proxy smoke `GET http://127.0.0.1:5173/api/v1/auth/demo-accounts` 200, `GET /api/v1/health` 200, `git diff --check` pass, `./init.sh` pass voi frontend 7 files/31 tests va backend 39 tests.
- 2026-06-28 frontend Vietnamese redesign: Tao Image Gen concept cho TeachFlow AI app shell, them `lucide-react` cho icons va `playwright` devDependency cho rendered QA, tao `frontend/src/labels.ts` de hien thi role/status/block type tieng Viet. Redesign `App.css`, login, workspace shell, Teacher/Admin/Student panels, presentation labels. Evidence: `./init.sh` pass voi frontend 7 files/31 tests va backend 39 tests; Playwright screenshots desktop/mobile login, Teacher desktop/mobile, Admin desktop, Student desktop; role smoke Teacher/Admin/Student console warning/error empty.
- Harness files da duoc tao moi, khong ghi de artifact harness cu vi repo chua co.
- Source docs da doc: `MVP.md`, `PRD_MVP.md`, `USER_STORIES_MVP.md`.
- `./init.sh` pass: verify harness files, `feature_list.json`, `.env.example`, frontend typecheck/lint/test/build, backend pytest/compile.
- `python3 -m json.tool feature_list.json` pass.
- `git diff --check` pass.
- `node .agents/skills/harness-creator/scripts/validate-harness.mjs --target .` pass voi score `100/100`.
- Review fix: dong bo startup order giua `AGENTS.md` va `docs/harness/SOP.md`.
- Review fix: sua command path vendored skill tu `skills/harness-creator/...` sang `.agents/skills/harness-creator/...`.
- Review fix: command backend dev trong SOP dung `main.py`, khop output mac dinh cua `uv init --app`.
- Review fix: `.gitignore` ignore `data/books/` de raw source books khong vao git/deploy.
- Ap dung triết lý harness engineering theo huong lightweight: repo la system-of-record, AGENTS.md ngan, docs/harness la tai lieu sau, mechanical checks qua `init.sh`, exec plans/debt nam canh code.
- P0-001 evidence: `./init.sh` pass, frontend `typecheck/lint/test/build` pass, backend `pytest` pass, `git diff --check` pass, manual curl `/api/v1/health` tra `status: ok`.
- Env audit evidence: `.env.example` va `.env` co cung required keys; `BACKEND_CORS_ORIGINS` la deploy key optional trong `.env.example`; `./init.sh` pass sau khi them check ten bien trong `.env` that.
- Health test evidence: `timeout 30s uv run pytest -q` trong `backend/` pass `2 passed`, khong con `TestClient` trong backend tests.

## Next Session Startup

1. Doc `AGENTS.md`.
2. Chay `./init.sh`.
3. User testing theo `docs/harness/DEMO_RUNBOOK.md`, gom ca Manual Revision Flow.
4. Sau deploy/testing, chon scope tiep theo theo user feedback; khong tu mo P1/P2.
