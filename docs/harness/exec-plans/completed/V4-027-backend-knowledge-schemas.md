# Exec Plan - V4-027 Backend knowledge schemas extraction

## Muc Tieu

- Feature: `V4-027 Backend knowledge schemas extraction`
- User stories: `US-413 Backend modularization plan`
- Ket qua user can validate: document/RAG/citation API payload khong doi, nhung schemas shared cho knowledge/content da nam trong `backend/app/knowledge/schemas.py`.
- Vertical slice: backend architecture cleanup nho, behavior-preserving; khong doi frontend, DB schema, env, API path hay response payload.

## Scope P0

- Lam:
  - Tao `backend/app/knowledge/__init__.py` va `backend/app/knowledge/schemas.py`.
  - Move document/retrieval/web/reindex schemas va `RetrievedChunkRecord` ra knowledge schema module.
  - Import/re-export compatibility names trong `backend/app/main.py`.
  - Cap nhat backend boundary tests va chay knowledge/content/AI regression.
- Khong lam:
  - Chua tach `KnowledgeRepository`, ingestion service/repository, embedding providers, RAG routes hay content schemas.
  - Khong doi SQL, env var, AI provider, RAG ranking, job lifecycle hay frontend API.
  - Khong them UI moi hoac route moi.
- Dependencies da xong: `V4-026`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Them `backend/tests/test_knowledge_module_boundaries.py`.
  - Test import document/retrieval/citation schemas tu `app.knowledge.schemas`.
  - Test `main` compatibility exports tro ve dung class object.
  - Test validation rules co y nghia: URL blank bi reject, retrieval top_k bounds, citation source_url optional.
- Frontend:
  - Khong co frontend change; final `./init.sh` van chay frontend typecheck/lint/test/build.
- Integration/e2e:
  - Chay `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_knowledge_module_boundaries.py tests/test_knowledge_rag.py -q`.
  - Chay AI/content regression: `tests/test_ai_outline.py tests/test_lesson_blocks.py tests/test_ai_rate_guard.py tests/test_content_persistence.py`.
  - Chay backend full pytest va final `./init.sh`.
- Security/access:
  - Existing knowledge tests cover Teacher/Admin document/RAG access, Student restriction, URL safety va active document filtering.

### Manual validation

Prerequisite:
- Backend dang chay voi demo data hoac local in-memory/default Supabase env.
- Co Teacher/Admin/Student demo account.

Steps:
1. Teacher/Admin goi list documents va RAG retrieve.
2. Teacher generate outline/lesson co citations.
3. Student/role sai thu access restricted document/RAG endpoints.

Expected:
- Response payload document/retrieval/citation khong doi.
- Role/access restriction khong doi.

Negative check:
- URL ingest invalid/private URL van bi chan nhu truoc.

## Implementation Plan Theo Vertical Slice

Backend:
- Them knowledge package schemas.
- Move schema/literal definitions khoi `backend/app/main.py`.
- Import schemas vao `backend/app/main.py` de repositories/services/routes hien co khong doi.

Frontend:
- Khong thay doi.

Tests:
- Them boundary test truoc, chay de fail do thieu `app.knowledge.schemas`.
- Implement module split.
- Chay targeted va full verification.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/version4/PRODUCT_REVIEW.md`.
- Move exec plan sang completed neu done.
- Khong doi env.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` truoc code: pass frontend 13 files/57 tests + build, backend 135 tests.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_knowledge_module_boundaries.py -q` truoc implementation: fail dung ky vong vi thieu `app.knowledge`.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_knowledge_module_boundaries.py -q`: pass 2.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_knowledge_rag.py -q`: pass 29.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_knowledge_module_boundaries.py tests/test_knowledge_rag.py tests/test_ai_outline.py tests/test_lesson_blocks.py tests/test_ai_rate_guard.py tests/test_content_persistence.py tests/test_audit_persistence.py tests/test_student_progress.py -q`: pass 75.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest -q`: pass 137.
- `./init.sh`: pass frontend 13 files/57 tests + build, backend 137 tests.
- `python3 -m json.tool feature_list.json`: pass.
- `git diff --check`: pass.

Ket qua:
- `backend/app/knowledge/schemas.py` expose document, upload, web ingestion, re-index, retrieval va citation schemas.
- `backend/app/main.py` khong con dinh nghia truc tiep cac schema knowledge da tach, nhung van expose compatibility imports.
- Content citations tiep tuc dung cung `RetrievedChunkRecord` class.

Manual validation da huong dan user:
- Teacher/Admin list documents, upload/ingest URL/reindex va RAG retrieve de xac nhan payload khong doi.
- Generate outline/lesson co citations de xac nhan `RetrievedChunkRecord` dung chung van render dung.
- Role/access restriction hien co khong doi trong slice nay.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V4-027-backend-knowledge-schemas.md`
- `backend/app/knowledge/__init__.py`
- `backend/app/knowledge/schemas.py`
- `backend/app/main.py`
- `backend/tests/test_knowledge_module_boundaries.py`
- `progress.md`
- `session-handoff.md`
- `docs/version4/PRODUCT_REVIEW.md`

## Blockers / Next Step

- Khong co blocker.
- Next: knowledge access model moi theo user feedback, sau do content schemas/ports extraction.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
