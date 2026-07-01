# Exec Plan - V2-009 Production embeddings and re-index

## Muc Tieu

- Feature: Production embeddings and re-index
- User stories: `US-210`, `US-211`, `US-207`, `US-208`, `US-213`
- Ket qua user can validate: backend co embedding provider doc tu env, local fallback cho demo/test, OpenAI embeddings production option, Teacher/Admin co the re-index document completed va job lifecycle ghi lai.
- Vertical slice: backend provider + document re-index API/job + frontend action + tests.

## Scope P0

- Lam:
  - Them `EmbeddingProvider` rieng cho RAG, local-hash fallback va OpenAI embedding provider qua env.
  - Giữ vector dimension 384 de khong pha schema `document_chunks.embedding vector(384)`.
  - Retrieval/upload ingestion/re-index dung embedding provider chung.
  - Them endpoint `POST /api/v1/documents/{document_id}/reindex` cho Teacher/Admin.
  - Re-index tao generation job `embedding_reindex`, update chunk embeddings va metadata provider/model/dimensions.
  - Frontend Teacher/Admin co icon re-index cho active completed document.
- Khong lam:
  - Khong doi schema vector dimension trong slice nay.
  - Khong batch async worker cho re-index lon; durable worker da nam debt `TD-015`.
  - Khong thay doi prompt/generation model.
- Dependencies da xong: `V2-008`
- Source-of-truth da doc: `docs/version2/PRD_V2_PRODUCTION.md`, `docs/version2/USER_STORIES_V2.md`, OpenAI embeddings docs official, Supabase pgvector docs official, Supabase changelog quick check theo skill.
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker; OpenAI embedding se bat bang env, local fallback giu demo/test on dinh.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Local embedding provider metadata/dimensions la 384.
  - Retrieval co the inject fake embedding provider va repository nhan query embedding tu provider.
  - Re-index active completed document tao job completed va repository nhan provider metadata.
  - Re-index inactive/non-completed document bi 400/404 ro.
- Frontend:
  - `reindexDocument` goi `POST /documents/{id}/reindex` voi bearer token.
  - Typecheck/lint full.
- Integration/e2e:
  - `./init.sh` full.
  - Postgres smoke local-hash re-index document tam va cleanup.
- Security/access:
  - Re-index route Teacher/Admin only; Student 403 qua service test hoac API guard.

### Manual validation

Prerequisite:
- Backend/frontend local running.

Steps:
1. Dang nhap Teacher/Admin.
2. Chon mot document active completed trong Kho tri thuc.
3. Bam re-index.
4. Reload job queue/document list.
5. Neu muon test OpenAI thật, set `EMBEDDING_PROVIDER=openai`, `OPENAI_EMBEDDING_MODEL=text-embedding-3-small`, restart backend va re-index document nho.

Expected:
- Re-index completed, job `embedding_reindex` completed.
- Chunk metadata co `embedding_provider`, `embedding_model`, `embedding_dimensions`.
- Archived/failed/processing document khong re-index duoc.

Negative check:
- Student re-index endpoint bi 403.
- Frontend khong chua OpenAI key.

## Implementation Plan Theo Vertical Slice

Backend:
- Them `EmbeddingMetadata`, `EmbeddingProvider`, `LocalHashEmbeddingProvider`, `OpenAIEmbeddingProvider`, `get_embedding_provider`.
- Cap nhat ingestion/retrieval dung provider.
- Them `DocumentReindexResponse` va repository/service/route re-index.
- Update ingest script dung provider va metadata chung.

Frontend:
- Them type/API `DocumentReindexResponse`, `reindexDocument`.
- Them re-index icon action trong Teacher/Admin document row.

Tests:
- Test-first backend/frontend targeted.
- Full `./init.sh`.

Docs / Env:
- Cap nhat `.env.example`, `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/OVERNIGHT_HANDOFF.md`.
- Neu co debt moi thi ghi tech-debt tracker.

## Evidence Sau Khi Lam

Commands da chay:
- `uv run pytest tests/test_knowledge_rag.py -q` -> pass 23.
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts` -> pass 18.
- `pnpm --dir frontend typecheck` -> pass.
- `pnpm --dir frontend lint` -> pass.
- `uv run python -m compileall main.py scripts/ingest_books.py` -> pass.
- `./init.sh` -> pass voi frontend 12 files / 51 tests + build va backend 82 tests.
- Postgres smoke `embedding_reindex_smoke_ok` -> pass, re-index document/chunk tam, metadata embedding provider/model/dimensions duoc ghi, cleanup thanh cong.

Ket qua:
- Backend co `EmbeddingProvider` local-hash fallback va OpenAI provider qua env.
- Retrieval/upload ingestion/script ingest dung provider chung va ghi metadata `embedding_provider`, `embedding_model`, `embedding_dimensions`.
- Them route `POST /api/v1/documents/{document_id}/reindex`, generation job `embedding_reindex`, chi cho active completed documents.
- Frontend Teacher/Admin co icon re-index, API client `reindexDocument`, Job Queue label `Re-index tài liệu`.

Manual validation da huong dan user:
- Teacher/Admin bam re-index tren active completed document, UI hien model/chunk count sau khi xong.
- Job Queue hien job `embedding_reindex`.
- Neu set `EMBEDDING_PROVIDER=openai` va OpenAI env hop le, backend goi OpenAI embeddings tu server only.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V2-009-production-embeddings-reindex.md`
- `.env.example`
- `backend/main.py`
- `backend/scripts/ingest_books.py`
- `backend/tests/test_knowledge_rag.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`

## Blockers / Next Step

- Khong co blocker hien tai.
- Debt da ghi `TD-016`: re-index hien sync trong request, can worker/durable queue cho tai lieu lon.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md` hoac xac nhan khong co.
