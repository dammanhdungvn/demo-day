# Overnight Handoff - TeachFlow AI

## 1. Da doc tai lieu version nao

- Da doc `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`.
- Da doc `docs/version2/README.md`, `docs/version2/PRD_V2_PRODUCTION.md`, `docs/version2/USER_STORIES_V2.md`, `docs/version2/V1_P2_MIGRATION.md`.
- Da doc `docs/version3/README.md`, `docs/version3/PRD_V3_GROWTH.md`, `docs/version3/USER_STORIES_V3.md`.
- Da doc/tao `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`.
- Da doc harness: `docs/harness/SOP.md`, `ARCHITECTURE.md`, `QUALITY_SCORE.md`, `RELIABILITY_SECURITY.md`, `TASK_NOTE_TEMPLATE.md`, `progress.md`, `session-handoff.md`.
- Khong dung `README.md` lam source-of-truth nghiep vu.

## 2. Da hoan thanh gi o version1

- V1 MVP/P0 da co demo flow end-to-end: Teacher -> RAG -> Lesson Studio -> Admin Publish -> Student View -> Web Presentation/PDF.
- P1 polish hien tai da xong: Admin reject, Markdown export, PPTX basic export, audit events, upload books UI, incremental ingestion.
- BUG-001 den BUG-003 da xong, gom fix shortcut frontend, PDF `DependencyError`, va crash upload form reset.

## 3. Da hoan thanh gi o version2

- Da bat dau V2-P0 production conversion.
- Hoan thanh `V2-001 Persist courses, classes, and membership`.
- Backend co `LearningRepository`, `InMemoryLearningRepository`, `PostgresLearningRepository`.
- Production path bat bang `.env`: `LEARNING_REPOSITORY=postgres`.
- Schema Supabase/Postgres idempotent tao `courses`, `classes`, `class_students`, enable RLS va revoke Data API grants tu `anon/authenticated`.
- Supabase smoke pass: tao course/class/membership tam, doc lai bang repository instance moi, cleanup thanh cong.
- Hoan thanh `V2-002 Backup/restore/export/delete runbook`: `docs/harness/OPERATIONS_RUNBOOK.md` co backup process, restore smoke, user data export/delete, secret safety va incident handling; `init.sh` check cac section nay.
- Hoan thanh `V2-003 Persist outlines, lessons, and lesson blocks`: backend co `ContentRepository`, `InMemoryContentRepository`, `PostgresContentRepository`; schema helper tao `course_outlines`, `outline_sessions`, `lesson_sessions`, `lesson_blocks`; service outline/lesson/block/admin/student reads dung repository. Production path bat bang `.env`: `LEARNING_REPOSITORY=postgres`.
- Supabase/Postgres smoke pass: tao outline/lesson/block tam, doc lai bang repository instance moi, update status published, list published theo class, cleanup thanh cong.
- Hoan thanh `V2-004 Persist audit events`: backend co `AuditRepository`, `InMemoryAuditEventRepository`, `PostgresAuditEventRepository`; schema helper tao `audit_events` voi actor/action/lesson/block/details/timestamp, index theo lesson/created_at, RLS enabled va revoke Data API grants tu `anon/authenticated`; service audit record/list dung repository. Production path bat bang `.env`: `LEARNING_REPOSITORY=postgres`.
- Supabase/Postgres smoke pass: tao audit event tam, doc lai bang repository instance moi, cleanup thanh cong.
- Hoan thanh `V2-005 AI generation job lifecycle`: backend co `GenerationJobRepository`, `InMemoryGenerationJobRepository`, `PostgresGenerationJobRepository`; schema helper tao/nang cap `generation_jobs` voi actor/output/error, index actor/created_at, RLS enabled va revoke Data API grants tu `anon/authenticated`; outline/lesson/block regeneration tao/update job lifecycle. Frontend Teacher Job Queue doc API job records that.
- Supabase/Postgres smoke pass: tao/update/list generation job tam, cleanup thanh cong.
- Hoan thanh `V2-006 AI rate and cost guard`: backend doc `AI_ACTION_RATE_LIMIT_*` tu env, chan per-user outline/lesson/block regeneration truoc khi goi AI provider neu vuot limit, tra 429 structured cooldown va `Retry-After`; frontend parse detail de hien message ro.
- Hoan thanh `V2-007 Async document ingestion jobs`: upload PDF cho file moi/re-ingest tao document `processing` va generation job `processing`, response nhanh; background task extract/chunk/embed va update document/job sang `completed` hoac `failed`; skip unchanged van tra `skipped`; frontend upload panel/status helper hien processing va failed retry guidance bang re-upload.
- Hoan thanh `V2-008 Document lifecycle management`: documents co `is_active`, Teacher/Admin archive soft-deactivate, retrieval chi cho active completed documents, failed/inactive same-hash re-upload retry ingestion thay vi skip; frontend Teacher/Admin co archive icon va inactive/archived status.
- Hoan thanh `V2-009 Production embeddings and re-index`: backend co embedding provider local/OpenAI qua env, retrieval/upload/script ingest/re-index dung provider chung, chunk metadata co provider/model/dimensions, route/UI re-index va job `embedding_reindex`.
- Hoan thanh `V2-010 Production auth provider and invite profile foundation`: backend co `AUTH_PROVIDER=demo|supabase`, `AUTH_REPOSITORY=memory|postgres`, Supabase Auth REST bridge password login/refresh/get-user/logout, auth profile/org/invite repository memory/Postgres, schema `organizations`/`profiles`/`organization_invites` co RLS enabled/revoke grants; frontend co refresh token session handling va Admin invite panel.
- Hoan thanh `V2-011 Organization-scoped service authorization`: course/class/document co `organization_id`, repository/service filter theo org, Admin moderation/audit khong thay org khac, Student membership/published lesson loc theo org, Teacher/Admin documents/RAG selected sources loc theo org.
- Hoan thanh `V2-012 Trusted web page source ingestion`: Teacher/Admin ingest URL HTML/text trusted vao knowledge base, backend safety guard va source `web`, citation co `source_url`, frontend co URL ingest form va citation URL.
- Hoan thanh `V2-013 Student progress tracking foundation`: Student progress luu opened/current block/current slide/completed cho lesson published trong membership/org; Student UI resume/update/complete; Teacher xem aggregate `Tiến độ lớp`.

## 4. Da hoan thanh gi o version3

- Chua implement V3.
- V3 chi nen bat dau sau khi V2-P0 production foundation on dinh: auth production, persistence cho core objects, job lifecycle, monitoring/backup va basic usage data.

## 4b. Da hoan thanh gi o version4

- Tao Version 4 product excellence docs va concept UI.
- Hoan thanh `V4-001 Premium Teacher workspace and Lesson Studio redesign`.
- Frontend co helper metric/workflow tu state that, UI primitives, Teacher workspace timeline/metrics/source strip/job queue, Lesson Studio 3 cot va citation inspector.
- Hoan thanh `V4-002 Admin review and Student learning surface polish`: Admin queue/detail/citation evidence/action feedback; Student continue learning, reading canvas, block nav, citation panel, presentation/PDF controls va future progress/tutor disabled slots khong fake data.
- Hoan thanh `V4-003 Split frontend monolith - Student workspace module`: Student workspace tach khoi `App.tsx`, shared presentation component va error helper co module rieng, Student progress rendered QA pass.
- Hoan thanh `V4-004 Backend modularization plan`: tao `docs/version4/BACKEND_MODULARIZATION_PLAN.md` de tach `backend/main.py` theo auth/learning/progress/content/audit/jobs/knowledge/AI/admin/export/API modules, co dependency direction, migration slices, rollback/verification va API compatibility rules.
- Hoan thanh `V4-005 Split frontend monolith - Admin workspace module`: Admin workspace tach sang `frontend/src/features/admin/AdminWorkspace.tsx`, shared knowledge controls/helper tach sang `frontend/src/features/knowledge/`, `App.tsx` con 2561 lines.
- Hoan thanh `V4-006 Split frontend monolith - Teacher workspace module`: Teacher workflow/Lesson Studio tach sang `frontend/src/features/teacher/TeacherWorkspace.tsx`, `App.tsx` con 627 lines va chi compose role modules.
- Hoan thanh `V4-007 Backend app package entrypoint slice`: current backend monolith nam trong `backend/app/main.py`, root `backend/main.py` re-export compatibility, dev command cu health ok.
- Hoan thanh `V4-008 Backend core config extraction`: config/env/CORS/database conninfo nam trong `backend/app/core/config.py`.
- Hoan thanh `V4-009 Backend core time/errors/security helper extraction`: `_now_iso`, HTTP auth/not-found helpers, Bearer token parser, generation job error sanitization va organization fallback/scope helpers nam trong `backend/app/core/time.py`, `errors.py`, `security.py`.
- Hoan thanh `V4-010 Backend auth schemas and ports extraction`: `Role`, `UserProfile`, login/session/profile/invite/Supabase auth schemas va auth provider/repository protocols nam trong `backend/app/auth/schemas.py` va `ports.py`.
- Hoan thanh `V4-011 Backend auth repositories and Supabase client extraction`: demo auth seed, auth schema SQL, memory/Postgres auth repositories va Supabase Auth REST client nam trong `backend/app/auth/demo.py`, `repositories.py`, `supabase_client.py`.
- Hoan thanh `V4-012 Backend auth services and session extraction`: demo session store, auth factories, login/refresh/current-user/logout/invite services va `require_role` nam trong `backend/app/auth/services.py`.
- Hoan thanh `V4-013 Backend auth FastAPI dependency extraction`: `get_current_user` va `require_roles` nam trong `backend/app/auth/dependencies.py`.
- Hoan thanh `V4-014 Backend auth route extraction`: auth routes `/auth/*` va `/me` nam trong `backend/app/auth/routes.py`, app main include router moi.
- Hoan thanh `V4-015 Backend learning schemas and ports extraction`: `StudentLevel`, course/class/membership schemas va `LearningRepository` protocol nam trong `backend/app/learning/`, app main import lai de giu compatibility exports.
- Hoan thanh `V4-016 Backend learning repositories extraction`: learning schema SQL, memory/Postgres adapters, memory singleton va repository factory nam trong `backend/app/learning/repositories.py`, app main import lai de giu compatibility exports.
- Hoan thanh `V4-017 Backend learning services extraction`: ownership guards, course/class/membership services va `_class_ids_for_student` nam trong `backend/app/learning/services.py`, app main import lai de giu routes/content compatibility.
- Hoan thanh `V4-018 Backend learning route extraction`: learning routes nam trong `backend/app/learning/routes.py`, app main include router moi.
- Motion CSS co `prefers-reduced-motion`; khong them fake metrics/hardcoded backend URL/secrets.

## 5. Da sua loi gi

- `BUG-001`: shortcut/dashboard controls co handler that, khong con UI nhin nhu button nhung khong bam duoc.
- `BUG-002`: them `cryptography` va map loi PDF extraction than thien, khong lo raw `DependencyError`.
- `BUG-003`: fix crash `Cannot read properties of null (reading 'reset')` khi Teacher upload PDF.
- V2-001 cung harden Supabase schema: RLS enabled, revoke grants tu `anon/authenticated`.
- V2-003 fix data-loss risk cho outline/lesson/block khi dung Postgres repository.
- V2-004 fix data-loss risk cho audit history khi dung Postgres repository.
- V2-005 them observability/persistence cho outline/lesson/block AI generation jobs.
- V2-006 them guard ngan spam generate gay ton chi phi AI.
- V2-007 giam rui ro request upload PDF treo lau bang background ingestion toi thieu va status processing/failed ro hon.
- V2-008 ngan archived/failed/processing documents bi dung cho generation moi va cho Admin/Teacher don kho tri thuc khong xoa citations cu.
- V2-009 thay local-only RAG embedding path bang provider abstraction co OpenAI production option va duong re-index tai lieu cu.
- V2-010 giam debt demo auth bang production auth provider foundation, profile role/organization va invite flow; Supabase service role/secret khong dua ra frontend.
- V2-011 giam rui ro multi-tenant data leak bang service-layer org boundary cho course/class/document/lesson moderation.
- V2-012 tang chat luong source RAG bang URL ingestion an toan va citation URL.
- V2-013 bien Student reader tinh thanh learning surface co resume va tao usage data nen tang cho V3 adaptive learning.
- V4-003 giam frontend monolith risk, tao boundary Student de V3 adaptive/tutor co noi chen ro hon.
- V4-001 fix route audit events dependency sai (`current_user_from_token` -> `get_current_user`) gay console 422 khi Teacher workspace load audit history.
- V4-002 giam lech UX giua Teacher va Admin/Student, lam ro evidence/status cho human-in-the-loop va reading surface cho Student.
- V4-009 giam rui ro backend monolith bang core helper boundary co test, giu nguyen auth/role/org-scope behavior truoc khi tach auth hoac learning/progress module lon hon.
- V4-010 tao auth module boundary dau tien, giu compatibility exports tu `main` de route/tests cu khong bi pha truoc khi tach auth repository/service/client.
- V4-011 tach auth adapters/Supabase client khoi monolith, giu compatibility exports va behavior demo auth/invite hien co.
- V4-012 tach auth service/session logic khoi monolith, giu FastAPI routes/dependency wrappers trong `main.py` de giam rui ro.
- V4-013 tach auth FastAPI dependency wrappers khoi monolith, chuan bi cho auth route split neu tiep tuc.
- V4-014 hoan tat auth route split, giu dashboard routes trong main vi chung thuoc workspace shell.
- V4-015 bat dau learning module boundary, giu repository/service/routes learning trong main de slice nho va khong doi contract.
- V4-016 tach learning persistence adapters/factory khoi monolith, memory singleton da nam trong learning module va reset test dung repository method.
- V4-017 tach learning service layer khoi monolith, giu FastAPI learning routes trong main de route split sau it rui ro hon.
- V4-018 hoan tat learning module boundary o muc routes, giu student lesson/progress routes trong main cho progress slice sau.

## 6. Test/build/lint da chay

- `uv run pytest tests/test_learning_persistence.py -q` -> pass 5 tests.
- `uv run pytest tests/test_learning.py tests/test_lesson_blocks.py -q` -> pass 30 tests.
- `LEARNING_REPOSITORY=postgres uv run python -c "<postgres smoke>"` -> pass, tao/doc lai/cleanup data tam.
- `./init.sh` -> pass: frontend 11 files/43 tests + build, backend 63 tests.
- `git diff --check` -> pass.
- `uv run pytest tests/test_content_persistence.py -q` -> pass 3 tests.
- `uv run pytest tests/test_ai_outline.py tests/test_lesson_blocks.py tests/test_learning.py -q` -> pass 34 tests.
- `LEARNING_REPOSITORY=postgres uv run python - <<'PY' ...` -> `content_persistence_smoke_ok`.
- `uv run pytest tests/test_audit_persistence.py -q` -> pass 3 tests.
- `uv run pytest tests/test_lesson_blocks.py tests/test_content_persistence.py tests/test_audit_persistence.py -q` -> pass 30 tests.
- `uv run python -m compileall main.py` -> pass sau V2-004.
- `LEARNING_REPOSITORY=postgres uv run python - <<'PY' ...` -> `audit_persistence_smoke_ok`.
- `uv run pytest tests/test_generation_jobs.py -q` -> pass 3 tests.
- `uv run pytest tests/test_ai_outline.py tests/test_lesson_blocks.py tests/test_generation_jobs.py -q` -> pass 31 tests.
- `LEARNING_REPOSITORY=postgres uv run python - <<'PY' ...` -> `generation_job_smoke_ok`.
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts` -> pass 15 tests.
- `pnpm --dir frontend test -- --run` -> pass 12 files / 46 tests.
- `pnpm --dir frontend build` -> pass.
- `uv run pytest tests/test_ai_rate_guard.py -q` -> pass 3 tests.
- `uv run pytest tests/test_ai_rate_guard.py tests/test_ai_outline.py tests/test_lesson_blocks.py tests/test_generation_jobs.py -q` -> pass 34 tests.
- `uv run pytest -q` -> pass 75 tests.
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts` -> pass 16 tests.
- `pnpm --dir frontend exec vitest run src/features/teacherWorkspace.test.ts` -> pass 2 tests.
- `pnpm --dir frontend test -- --run` -> pass 12 files / 45 tests.
- `pnpm --dir frontend build` -> pass.
- `uv run pytest tests/test_lesson_blocks.py -q` -> pass 24 tests sau fix audit route.
- Final `./init.sh` -> pass: frontend 12 files/47 tests + build, backend 75 tests.
- `uv run pytest tests/test_knowledge_rag.py -q` -> pass 17 tests sau V2-007.
- `uv run pytest tests/test_knowledge_rag.py tests/test_ai_rate_guard.py tests/test_generation_jobs.py -q` -> pass 23 tests sau V2-007.
- `pnpm --dir frontend exec vitest run src/uploadStatus.test.ts` -> pass 5 tests.
- Final `./init.sh` sau V2-007 -> pass: frontend 12 files/49 tests + build, backend 76 tests.
- HTTP smoke upload PDF payload gia -> initial status `processing`, background final status `failed`, cleanup document/job tam thanh cong.
- `uv run pytest tests/test_knowledge_rag.py -q` -> pass 20 tests sau V2-008.
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts src/features/teacherWorkspace.test.ts src/uploadStatus.test.ts` -> pass 3 files / 24 tests.
- Final `./init.sh` sau V2-008 -> pass: frontend 12 files/50 tests + build, backend 79 tests.
- Postgres smoke `document_lifecycle_smoke_ok` -> archive document tam, retrieval inactive reject 400, cleanup thanh cong.
- `uv run pytest tests/test_knowledge_rag.py -q` -> pass 23 tests sau V2-009.
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts` -> pass 18 tests.
- Final `./init.sh` sau V2-009 -> pass: frontend 12 files/51 tests + build, backend 82 tests.
- Postgres smoke `embedding_reindex_smoke_ok` -> re-index document/chunk tam, metadata embedding duoc ghi, cleanup thanh cong.
- `uv run pytest tests/test_auth.py -q` -> pass 12 tests sau V2-010.
- `pnpm exec vitest run src/api/auth.test.ts src/auth/session.test.ts` -> pass 2 files / 9 tests sau V2-010.
- Final `./init.sh` sau V2-010 -> pass: frontend 12 files/53 tests + build, backend 88 tests.
- Postgres smoke `auth_repository_smoke_ok pending_invites=1 duplicate_idempotent=true` -> tao/doc/cleanup org/profile/invite tam.
- Playwright Admin invite QA V2-010 fallback vi Browser plugin khong co: `http://127.0.0.1:5173/admin`, desktop/mobile, tao invite demo, console issues empty.
- `uv run pytest tests/test_learning.py tests/test_lesson_blocks.py tests/test_knowledge_rag.py -q` -> pass 59 tests sau V2-011.
- `uv run pytest -q` -> pass 94 tests sau V2-011.
- Frontend `pnpm run typecheck && pnpm run lint && pnpm test -- --run` -> pass 12 files / 53 tests sau V2-011.
- Postgres smoke `organization_scope_smoke_ok learning_filter=true document_filter=true cross_org_retrieval=blocked`.
- Final `./init.sh` sau V2-011 -> pass: frontend 12 files/53 tests + build, backend 94 tests.
- `uv run pytest tests/test_knowledge_rag.py -q` -> pass 29 tests sau V2-012.
- `uv run pytest -q` -> pass 98 tests sau V2-012.
- Frontend full typecheck/lint/test/build -> pass 12 files / 54 tests sau V2-012.
- Postgres smoke `web_ingestion_smoke_ok source_type=web citation_source_url=true cleanup=true`.
- Final `./init.sh` sau V2-012 -> pass: frontend 12 files/54 tests + build, backend 98 tests.
- `uv run pytest tests/test_student_progress.py -q` -> pass 5 tests sau V2-013, co 1 Starlette TestClient warning.
- `uv run pytest -q` -> pass 103 tests sau V2-013, co 1 Starlette TestClient warning.
- Postgres smoke `student_progress_postgres_smoke_ok` -> tao/doc/update/aggregate progress tam va cleanup thanh cong.
- Frontend full typecheck/lint/test/build -> pass 13 files / 57 tests sau V2-013.
- Playwright fallback vi Browser plugin khong co: Teacher/Student progress desktop 1440x1100 va mobile 390x900, console issues va bad responses empty.
- Final `./init.sh` sau V2-013 -> pass: frontend 13 files/57 tests + build, backend 103 tests.
- `pnpm --dir frontend typecheck` -> pass sau V4-003.
- `pnpm --dir frontend lint` -> pass sau V4-003.
- `pnpm --dir frontend test -- --run` -> pass 13 files / 57 tests sau V4-003.
- `pnpm --dir frontend run build` -> pass sau V4-003.
- Playwright fallback vi Browser plugin khong co: Student progress flow desktop/mobile, console issues va bad responses empty, screenshots `/tmp/teachflow-v4-003-student-desktop.png`, `/tmp/teachflow-v4-003-student-mobile.png`.
- Final `./init.sh` sau V4-003 -> pass: frontend 13 files/57 tests + build, backend 103 tests.
- V4-004 doc check `rg -n "auth|learning|content|knowledge|AI|audit|export|Migration Slice|Verification" docs/version4/BACKEND_MODULARIZATION_PLAN.md` -> pass.
- `python3 -m json.tool feature_list.json` -> pass sau V4-004.
- Final `./init.sh` sau V4-004 -> pass: frontend 13 files/57 tests + build, backend 103 tests voi 1 Starlette/httpx deprecation warning.
- `git diff --check` -> pass sau V4-004.
- `pnpm --dir frontend typecheck`, `pnpm --dir frontend lint`, `pnpm --dir frontend test -- --run`, `pnpm --dir frontend run build` -> pass sau V4-005.
- Playwright fallback vi Browser plugin khong co: Admin desktop/mobile mocked review queue/documents/invites, console issues va bad responses empty, screenshots `/tmp/teachflow-v4-005-admin-desktop.png`, `/tmp/teachflow-v4-005-admin-mobile.png`.
- Final `./init.sh` sau V4-005 -> pass: frontend 13 files/57 tests + build, backend 103 tests voi 1 Starlette/httpx deprecation warning.
- `git diff --check` -> pass sau V4-005.
- `pnpm --dir frontend typecheck`, `pnpm --dir frontend lint`, `pnpm --dir frontend test -- --run`, `pnpm --dir frontend run build` -> pass sau V4-006.
- Playwright fallback vi Browser plugin khong co: Teacher desktop/mobile mocked course/class/documents/outlines/lesson/progress, console issues va bad responses empty, screenshots `/tmp/teachflow-v4-006-teacher-desktop.png`, `/tmp/teachflow-v4-006-teacher-mobile.png`.
- Final `./init.sh` sau V4-006 -> pass: frontend 13 files/57 tests + build, backend 103 tests voi 1 Starlette/httpx deprecation warning.
- `git diff --check` -> pass sau V4-006.
- `uv run pytest tests/test_health.py -q` -> pass 2 sau V4-007.
- `uv run pytest -q` trong `backend/` -> pass 103 voi 1 Starlette/httpx deprecation warning sau V4-007.
- `uv run python` import `main` smoke -> health status ok sau V4-007.
- `uv run fastapi dev main.py --host 127.0.0.1 --port 3001` + curl `/api/v1/health` -> pass status ok sau V4-007.
- Final `./init.sh` sau V4-007 -> pass: frontend 13 files/57 tests + build, backend 103 tests voi 1 Starlette/httpx deprecation warning.
- `python3 -m json.tool feature_list.json` va `git diff --check` -> pass sau V4-007.
- `uv run pytest tests/test_health.py -q` -> pass 2 sau V4-008.
- `uv run python` config import smoke -> API base/version/origins/env_int/health ok sau V4-008.
- `uv run pytest -q` trong `backend/` -> pass 103 voi 1 Starlette/httpx deprecation warning sau V4-008.
- Final `./init.sh` sau V4-008 -> pass: frontend 13 files/57 tests + build, backend 103 tests voi 1 Starlette/httpx deprecation warning.
- `python3 -m json.tool feature_list.json` va `git diff --check` -> pass sau V4-008.
- `uv run pytest tests/test_core_helpers.py -q` -> pass 5 sau V4-009.
- `uv run pytest tests/test_core_helpers.py tests/test_health.py tests/test_auth.py tests/test_learning.py tests/test_student_progress.py -q` -> pass 32 voi 1 Starlette/httpx deprecation warning sau V4-009.
- `uv run pytest -q` trong `backend/` -> pass 108 voi 1 Starlette/httpx deprecation warning sau V4-009.
- Final `./init.sh` sau V4-009 -> pass: frontend 13 files/57 tests + build, backend 108 tests voi 1 Starlette/httpx deprecation warning.
- `python3 -m json.tool feature_list.json` va `git diff --check` -> pass sau V4-009.
- `uv run pytest tests/test_auth_module_boundaries.py tests/test_auth.py -q` -> pass 15 sau V4-010.
- `uv run pytest tests/test_auth.py tests/test_learning.py tests/test_lesson_blocks.py tests/test_student_progress.py -q` -> pass 51 voi 1 Starlette/httpx deprecation warning sau V4-010.
- `uv run pytest -q` trong `backend/` -> pass 111 voi 1 Starlette/httpx deprecation warning sau V4-010.
- Final `./init.sh` sau V4-010 -> pass: frontend 13 files/57 tests + build, backend 111 tests voi 1 Starlette/httpx deprecation warning.
- `python3 -m json.tool feature_list.json` va `git diff --check` -> pass sau V4-010.
- `uv run pytest tests/test_auth_module_boundaries.py tests/test_auth.py -q` -> pass 17 sau V4-011.
- `uv run pytest tests/test_auth.py tests/test_learning.py tests/test_lesson_blocks.py tests/test_student_progress.py -q` -> pass 51 voi 1 Starlette/httpx deprecation warning sau V4-011.
- `uv run pytest -q` trong `backend/` -> pass 113 voi 1 Starlette/httpx deprecation warning sau V4-011.
- Final `./init.sh` sau V4-011 -> pass: frontend 13 files/57 tests + build, backend 113 tests voi 1 Starlette/httpx deprecation warning.
- `python3 -m json.tool feature_list.json` va `git diff --check` -> pass sau V4-011.
- `uv run pytest tests/test_auth_module_boundaries.py tests/test_auth.py -q` -> pass 18 sau V4-012.
- `uv run pytest tests/test_auth.py tests/test_learning.py tests/test_lesson_blocks.py tests/test_student_progress.py -q` -> pass 51 voi 1 Starlette/httpx deprecation warning sau V4-012.
- `uv run pytest -q` trong `backend/` -> pass 114 voi 1 Starlette/httpx deprecation warning sau V4-012.
- Final `./init.sh` sau V4-012 -> pass: frontend 13 files/57 tests + build, backend 114 tests voi 1 Starlette/httpx deprecation warning.
- `python3 -m json.tool feature_list.json` va `git diff --check` -> pass sau V4-012.
- `uv run pytest tests/test_auth_module_boundaries.py tests/test_auth.py -q` -> pass 19 sau V4-013.
- `uv run pytest tests/test_auth.py tests/test_learning.py tests/test_lesson_blocks.py tests/test_student_progress.py -q` -> pass 51 voi 1 Starlette/httpx deprecation warning sau V4-013.
- `uv run pytest -q` trong `backend/` -> pass 115 voi 1 Starlette/httpx deprecation warning sau V4-013.
- Final `./init.sh` sau V4-013 -> pass: frontend 13 files/57 tests + build, backend 115 tests voi 1 Starlette/httpx deprecation warning.
- `python3 -m json.tool feature_list.json` va `git diff --check` -> pass sau V4-013.
- `uv run pytest tests/test_auth_module_boundaries.py tests/test_auth.py tests/test_health.py -q` -> pass 22 voi 1 Starlette/httpx deprecation warning sau V4-014.
- `uv run pytest tests/test_auth.py tests/test_learning.py tests/test_lesson_blocks.py tests/test_student_progress.py -q` -> pass 51 voi 1 Starlette/httpx deprecation warning sau V4-014.
- `uv run pytest -q` trong `backend/` -> pass 116 voi 1 Starlette/httpx deprecation warning sau V4-014.
- Final `./init.sh` sau V4-014 -> pass: frontend 13 files/57 tests + build, backend 116 tests voi 1 Starlette/httpx deprecation warning.
- `python3 -m json.tool feature_list.json` va `git diff --check` -> pass sau V4-014.
- `uv run pytest tests/test_learning_module_boundaries.py -q` -> pass 3 sau V4-015.
- `uv run pytest tests/test_learning_module_boundaries.py tests/test_learning.py tests/test_learning_persistence.py tests/test_student_progress.py -q` -> pass 21 voi 1 Starlette/httpx deprecation warning sau V4-015.
- `uv run pytest tests/test_lesson_blocks.py -q` -> pass 26 sau V4-015.
- `uv run pytest -q` trong `backend/` -> pass 119 voi 1 Starlette/httpx deprecation warning sau V4-015.
- Final `./init.sh` sau V4-015 -> pass: frontend 13 files/57 tests + build, backend 119 tests voi 1 Starlette/httpx deprecation warning.
- `python3 -m json.tool feature_list.json` va `git diff --check` -> pass sau V4-015.
- `uv run pytest tests/test_learning_module_boundaries.py -q` test-first -> fail dung ky vong vi chua co `app.learning.repositories`, sau implementation pass 4 sau V4-016.
- `uv run pytest tests/test_learning_module_boundaries.py tests/test_learning_persistence.py tests/test_learning.py tests/test_student_progress.py -q` -> pass 22 voi 1 Starlette/httpx deprecation warning sau V4-016.
- `uv run pytest tests/test_lesson_blocks.py -q` -> pass 26 sau V4-016.
- `uv run pytest -q` trong `backend/` -> pass 120 voi 1 Starlette/httpx deprecation warning sau V4-016.
- Final `./init.sh` sau V4-016 -> pass: frontend 13 files/57 tests + build, backend 120 tests voi 1 Starlette/httpx deprecation warning.
- `python3 -m json.tool feature_list.json` va `git diff --check` -> pass sau V4-016.
- `uv run pytest tests/test_learning_module_boundaries.py -q` test-first -> fail dung ky vong vi chua co `app.learning.services`, sau implementation pass 5 sau V4-017.
- `uv run pytest tests/test_learning_module_boundaries.py tests/test_learning.py tests/test_learning_persistence.py tests/test_student_progress.py -q` -> pass 23 voi 1 Starlette/httpx deprecation warning sau V4-017.
- `uv run pytest tests/test_lesson_blocks.py -q` -> pass 26 sau V4-017.
- `uv run pytest -q` trong `backend/` -> pass 121 voi 1 Starlette/httpx deprecation warning sau V4-017.
- Final `./init.sh` sau V4-017 -> pass: frontend 13 files/57 tests + build, backend 121 tests voi 1 Starlette/httpx deprecation warning.
- `python3 -m json.tool feature_list.json` va `git diff --check` -> pass sau V4-017.
- `uv run pytest tests/test_learning_module_boundaries.py -q` test-first -> fail dung ky vong vi chua co `app.learning.routes`, sau implementation pass 6 sau V4-018.
- `uv run pytest tests/test_learning_module_boundaries.py tests/test_learning.py tests/test_learning_persistence.py tests/test_student_progress.py -q` -> pass 24 sau V4-018.
- `uv run pytest tests/test_lesson_blocks.py -q` -> pass 26 sau V4-018.
- `uv run pytest -q` trong `backend/` -> pass 122 sau V4-018.
- Final `./init.sh` sau V4-018 -> pass: frontend 13 files/57 tests + build, backend 122 tests.
- `python3 -m json.tool feature_list.json` va `git diff --check` -> pass sau V4-018.
- `pnpm --dir frontend exec vitest run src/features/adminStudentWorkspace.test.ts` -> pass 2 tests sau V4-002.
- Frontend `pnpm --dir frontend typecheck && pnpm --dir frontend lint && pnpm --dir frontend test -- --run` -> pass 13 files / 56 tests sau V4-002.
- Frontend `pnpm --dir frontend run build` -> pass sau V4-002.
- `uv run pytest tests/test_lesson_blocks.py tests/test_learning.py -q` -> pass 34 tests sau V4-002.
- Playwright V4-002 fallback vi Browser plugin khong co: Admin/Student desktop 1440x1100 va mobile 390x900, console issues empty, screenshots `/tmp/teachflow-v4-002-admin-desktop.png`, `/tmp/teachflow-v4-002-admin-mobile.png`, `/tmp/teachflow-v4-002-student-desktop.png`, `/tmp/teachflow-v4-002-student-mobile.png`.
- Playwright rendered QA fallback vi Browser plugin khong co: desktop 1440x1100 va mobile 390x900, seed API tao lesson that 5 blocks, console logs empty.
- Playwright rendered smoke V2-005: Teacher workspace Job Queue hien `Chưa có job AI gần đây.` khi chua co job, console issues none.
- `git diff --check` -> pass.

## 7. Cach chay local

Backend:

```bash
cd backend
uv run fastapi dev main.py --host 0.0.0.0 --port 3000
```

Frontend:

```bash
pnpm --dir frontend dev --host 0.0.0.0
```

Local demo nhanh dung `URL_BACKEND=/api/v1` de Vite proxy `/api` ve backend. Neu muon test V2 persistence sau restart, dat trong `.env`:

```env
LEARNING_REPOSITORY=postgres
AUTH_PROVIDER=supabase
AUTH_REPOSITORY=postgres
```

V4 UI local URL sau khi frontend chay: `http://127.0.0.1:5173/`.

## 8. Demo data / tai khoan demo

- Admin: `admin@teachflow.local` / `teachflow-demo`
- Teacher: `teacher@teachflow.local` / `teachflow-demo`
- Student: `student@teachflow.local` / `teachflow-demo`
- Demo flow chinh: course `Introduction to Artificial Intelligence`, class `KTPM-K18`, topic `Transformer Architecture`.
- Playwright QA da tao course/class tam trong memory backend hien tai khi server dang chay; restart backend se mat neu `LEARNING_REPOSITORY=memory`.

## 9. Blocker / cau hoi can user quyet dinh

- Khong co blocker can user quyet dinh ngay.
- V2 con viec lon: durable ingestion worker/retry/cancel, re-index worker/progress/retry-cancel, job polling/retry UI day du, V2-P1 grounded tutor.
- V2-005 co debt `TD-013`: AI generation van xu ly dong bo trong request, chua co worker queue/retry/cancel UI day du.
- V2-006 co debt `TD-014`: rate guard moi per-user, chua co org-wide budget/token accounting that.
- V2-007 co debt `TD-015`: ingestion background task con in-process, chua co durable raw PDF storage/worker/retry-cancel endpoint.
- V2-009 co debt `TD-016`: re-index embeddings con sync trong request cho tai lieu nho, chua co worker/progress/retry-cancel.
- V2-011 da co service-layer org scoping. Neu can production hardening hon, co the them DB-level RLS policies theo auth claims sau khi deploy auth strategy on dinh.
- V3 chua implement vi V2-P0 chua production-complete.
- V4-001 xong Teacher workspace; V4-002 xong Admin/Student polish; V4-003 xong Student module split; V4-004 xong backend modularization plan; V4-005 xong Admin module split; V4-006 xong Teacher module split; V4-007 xong backend app package entrypoint; V4-008 core config extraction; V4-009 core helper extraction; V4-010 den V4-014 auth module split; V4-015 den V4-018 learning module split. V4-P2 van con progress/content/knowledge module slices theo plan.
- Local default van `LEARNING_REPOSITORY=memory` de giu test/demo nhanh; production can set `LEARNING_REPOSITORY=postgres`.

## 10. Viec sang mai nen test dau tien

1. Chay `./init.sh`.
2. Doc nhanh `docs/harness/OPERATIONS_RUNBOOK.md` de nam backup/restore/export/delete.
3. Mo frontend Teacher workspace moi, xac nhan timeline/metric/source strip/job queue hien ro.
4. Chon/tao course-class, generate outline/lesson, chon block trong Lesson Studio 3 cot va xem citation inspector.
5. Dat `LEARNING_REPOSITORY=postgres`, restart backend.
6. Neu test production auth: provision profile Postgres voi `profiles.id` bang Supabase Auth user id, dat `AUTH_PROVIDER=supabase`, dang nhap bang Supabase email/password va goi `/api/v1/me`.
7. Test org scope: tao profile org khac, xac nhan Admin org khac khong thay queue/publish lesson org-demo va document org-demo bi coi nhu missing khi RAG.
8. Restart backend lan nua, dang nhap lai va xac nhan course/class/outline/lesson/block van ton tai.
9. Dang nhap Admin demo, tao invite Teacher/Student trong panel `Invite người dùng`, xac nhan pending list.
10. Mo Admin review surface moi, chon lesson/block, xac nhan warning/citation coverage/evidence va feedback actions hien ro.
11. Mo Student surface moi, bam `Tiếp tục học`, chon block/chuyen slide, bam `Hoàn thành`, xac nhan progress chip `Xong` va header `Đã hoàn thành`.
12. Mo Teacher workspace, xem panel `Tiến độ lớp`, xac nhan started/completed/average update cho lesson published.
13. Thuc hien edit/approve/submit va Admin publish/request/reject, restart backend, xac nhan Audit history van con.
14. Mo Teacher workspace, tao outline/lesson/regenerate block, xac nhan Hàng đợi xử lý hien job completed/failed that.
15. Neu muon test guard: set `AI_ACTION_RATE_LIMIT_MAX_REQUESTS=0`, restart backend, bam generate outline va xac nhan UI hien cooldown/rate-limit error.
16. Chay tiep V1 demo flow: approve/submit Admin, Admin publish, Student open lesson/presentation/PDF.
