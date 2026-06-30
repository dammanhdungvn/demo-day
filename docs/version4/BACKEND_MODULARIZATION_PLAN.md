# Backend Modularization Plan - V4 US-413

## 1. Muc Tieu

Tai lieu nay la plan tach `backend/main.py` theo clean architecture ma khong pha API, demo flow hoac test baseline hien co.

Current state:

- `backend/main.py`: 8023 lines.
- Backend tests: 103 tests qua `./init.sh`.
- Core production boundaries da co trong code nhung dang nam chung mot file:
  - repository protocols.
  - memory/Postgres repositories.
  - provider/client adapters.
  - service/use-case functions.
  - FastAPI route handlers.

Muc tieu V4-P2:

- Tach backend theo module co boundary ro.
- Giu `/api/v1` contract hien tai.
- Giu V1 demo flow va V2 production guards.
- Cho phep V3 adaptive/tutor/analytics duoc them vao module dung cho thay vi chen tiep vao monolith.

## 2. Non-goals

- Khong tach toan bo `backend/main.py` trong mot PR/session.
- Khong doi auth strategy, Supabase schema, API path, response schema hoac env var trong luc modularize.
- Khong them backend framework moi.
- Khong doi frontend API client neu backend contract khong doi.

## 3. Dependency Direction

Target direction:

```txt
api/routes -> services/use_cases -> repositories/providers protocols -> infrastructure adapters
                         -> domain schemas/value helpers
```

Rules:

- Routes chi parse request, call service, return response.
- Services giu business rules: role, ownership, membership, org scope, status transition, AI schema validation.
- Repository protocols nam gan domain/service, adapters Postgres/memory nam trong infrastructure.
- Infrastructure khong import FastAPI route modules.
- Env/config helpers nam trong core, khong doc env rai rac trong route/service moi.
- `main.py` cuoi cung chi con app factory, middleware, route registration va compatibility exports neu tests cu can.

## 4. Current-State Map

`backend/main.py` hien co the chia nhu sau:

| Current area | Approx lines | Target module |
|---|---:|---|
| constants, env helpers, shared utilities | 1-560, 994-1076 | `app/core/config.py`, `app/core/time.py`, `app/core/security.py` |
| Pydantic request/response/domain-ish models | 120-560 | `app/domain/*/schemas.py` theo domain |
| repository/provider protocols | 561-843 | `app/domain/*/ports.py` |
| embedding providers | 1046-1128 | `app/infrastructure/ai/embeddings.py` |
| knowledge repository + web/PDF ingestion helpers | 1129-2734, 6230-6464, 7790-7860 | `app/knowledge/*` |
| OpenAI AI provider | 2830-2968 | `app/infrastructure/ai/openai_provider.py` |
| auth/session/profile/invite | 2972-3020, 4874-5386, 5558-5737, 7583-7629 | `app/auth/*` |
| learning course/class/membership | 3025-3644, 5822-5968, 7636-7708 | `app/learning/*` |
| content outline/lesson/block | 3646-4328, 6692-7157, 7875-7958 | `app/content/*` |
| audit events | 3730-3750, 4333-4452, 7159-7226, 7747-7767 | `app/audit/*` |
| student progress | 3752-3777, 4454-4618, 6059-6189, 7724-7745 | `app/progress/*` |
| generation jobs | 3779-4868, 6621-6689, 7780-7788 | `app/jobs/*` |
| admin moderation | 7420-7569, 7960-8003 | `app/admin/*` or `app/content/review_routes.py` |
| FastAPI app/routes | 7573-8021 | `app/api/routes/*.py`, `app/main.py` |

## 5. Target Module Layout

Recommended target:

```txt
backend/
  main.py                       # thin compatibility entrypoint: from app.main import app
  app/
    main.py                     # create_app(), middleware, route registration
    core/
      config.py                 # env access, API_BASE_PATH, CORS, provider modes
      time.py                   # _now_iso and id/time helpers
      errors.py                 # _not_found, auth errors, common HTTP exceptions
      security.py               # role helpers, organization helpers
    api/
      dependencies.py           # get_current_user, require_roles
      routes/
        health.py
        auth.py
        learning.py
        knowledge.py
        content.py
        admin.py
        student.py
        jobs.py
    auth/
      schemas.py
      ports.py
      services.py
      repositories_memory.py
      repositories_postgres.py
      supabase_client.py
    learning/
      schemas.py
      ports.py
      services.py
      repositories_memory.py
      repositories_postgres.py
    content/
      schemas.py
      ports.py
      services.py
      repositories_memory.py
      repositories_postgres.py
    knowledge/
      schemas.py
      ports.py
      services.py
      repositories_supabase.py
      ingestion_pdf.py
      ingestion_web.py
    ai/
      ports.py
      services.py
      openai_provider.py
      embeddings.py
      rate_guard.py
    audit/
      schemas.py
      ports.py
      services.py
      repositories_memory.py
      repositories_postgres.py
    progress/
      schemas.py
      ports.py
      services.py
      repositories_memory.py
      repositories_postgres.py
    jobs/
      schemas.py
      ports.py
      services.py
      repositories_memory.py
      repositories_postgres.py
    export/
      markdown.py               # backend export later if needed; current frontend export stays
      pptx.py                   # future only
```

## 6. Migration Slices

### Slice 1 - App factory and core config

Goal:

- Tao `backend/app/main.py`.
- `backend/main.py` re-export `app` tu `app.main`.
- Extract config/env helpers only if tests stay green.

Do not move:

- route functions.
- repositories.
- service behavior.

Verification:

```bash
cd backend
uv run pytest tests/test_health.py -q
uv run pytest -q
cd ..
./init.sh
```

Rollback:

- Revert `backend/app/main.py` and restore `app = FastAPI(...)` in `backend/main.py`.

### Slice 2 - Auth module

Goal:

- Move auth schemas, demo sessions, auth repositories, Supabase Auth client, auth services and auth routes.
- Preserve imports used by existing tests either by updating tests or temporary compatibility exports in `backend/main.py`.

Verification:

```bash
cd backend
uv run pytest tests/test_auth.py -q
uv run pytest tests/test_learning.py tests/test_lesson_blocks.py -q
cd ..
./init.sh
```

Rollback:

- Keep route registration in `main.py`; revert only auth module files if route smoke fails.

### Slice 3 - Learning and progress modules

Goal:

- Move course/class/membership schemas, repositories and services to `app/learning`.
- Move Student progress repository/services/routes to `app/progress`.
- Keep membership/org-scope checks in service layer.

Verification:

```bash
cd backend
uv run pytest tests/test_learning.py tests/test_learning_persistence.py tests/test_student_progress.py -q
uv run pytest tests/test_lesson_blocks.py -q
cd ..
./init.sh
```

Rollback:

- Re-register old route functions from `main.py` if a module import breaks.
- Do not change DB schema in this slice.

### Slice 4 - Content, audit and jobs modules

Goal:

- Move outlines/lessons/blocks to `app/content`.
- Move audit event persistence/service to `app/audit`.
- Move generation job lifecycle to `app/jobs`.
- Preserve lesson status transition tests.

Verification:

```bash
cd backend
uv run pytest tests/test_content_persistence.py tests/test_audit_persistence.py tests/test_generation_jobs.py -q
uv run pytest tests/test_lesson_blocks.py tests/test_ai_outline.py -q
cd ..
./init.sh
```

Rollback:

- Revert route registration per module.
- Keep schema helper SQL identical until separate migration feature exists.

### Slice 5 - Knowledge/RAG and AI providers

Goal:

- Move documents/chunks/RAG, PDF/web ingestion and source lifecycle to `app/knowledge`.
- Move OpenAI/local embedding/rate guard into `app/ai`.
- Preserve source security rules: role/org, inactive/failed rejection, SSRF URL guard.

Verification:

```bash
cd backend
uv run pytest tests/test_knowledge_rag.py tests/test_ai_rate_guard.py -q
uv run pytest tests/test_ai_outline.py tests/test_lesson_blocks.py -q
cd ..
./init.sh
```

Rollback:

- Keep old `get_knowledge_repository()` compatibility export until all call sites move.
- Do not alter env names or provider defaults in this slice.

### Slice 6 - API route registration cleanup

Goal:

- `app/main.py` registers routers:
  - auth.
  - learning.
  - student.
  - teacher/content.
  - admin.
  - knowledge.
  - jobs.
  - health.
- `backend/main.py` becomes compatibility entrypoint only.

Verification:

```bash
cd backend
uv run pytest -q
cd ..
./init.sh
```

Manual smoke:

```bash
curl http://127.0.0.1:3000/api/v1/health
```

Rollback:

- Restore direct route decorators in `backend/main.py` from previous commit.

## 7. API Compatibility Rules

Must not change without separate feature:

- `API_BASE_PATH` default `/api/v1`.
- Auth routes:
  - `/auth/demo-accounts`
  - `/auth/login`
  - `/auth/refresh`
  - `/auth/logout`
  - `/auth/invites`
  - `/me`
- Course/class/student routes.
- Documents/RAG routes.
- Outline/lesson/block routes.
- Admin review routes.
- Student published lesson/progress routes.
- `generation-jobs`.

Response models must stay backward-compatible. If model split changes import paths, tests should import from new modules after the slice, but API payload stays same.

## 8. Test Gate Matrix

| Domain | Required tests |
|---|---|
| Auth | `tests/test_auth.py` |
| Learning | `tests/test_learning.py`, `tests/test_learning_persistence.py` |
| Student progress | `tests/test_student_progress.py` |
| Content/lesson | `tests/test_content_persistence.py`, `tests/test_lesson_blocks.py` |
| Audit | `tests/test_audit_persistence.py` |
| Jobs | `tests/test_generation_jobs.py` |
| Knowledge/RAG | `tests/test_knowledge_rag.py` |
| AI/rate | `tests/test_ai_outline.py`, `tests/test_ai_rate_guard.py` |
| Whole app | `./init.sh` |

## 9. Review Checklist Cho Moi Slice

- [ ] Không đổi route path hoặc method.
- [ ] Không đổi env var name.
- [ ] Không làm frontend cần đổi nếu chỉ là backend module split.
- [ ] Targeted domain tests pass.
- [ ] `./init.sh` pass.
- [ ] `git diff --check` pass.
- [ ] `progress.md`, `session-handoff.md`, exec plan update.
- [ ] Nếu có temporary compatibility export, ghi debt hoặc next slice remove.

## 10. First Coding Slice Recommendation

Nen bat dau bang Slice 1 hoac Slice 3:

- Slice 1 nho nhat, tao app factory va duong module entrypoint.
- Slice 3 co gia tri cao cho V3 vi learning/progress la nen tang adaptive learning.

Khong nen bat dau bang Knowledge/RAG vi no dang co nhieu edge case production: PDF extraction, URL safety, embedding provider, background ingestion va Supabase persistence.
