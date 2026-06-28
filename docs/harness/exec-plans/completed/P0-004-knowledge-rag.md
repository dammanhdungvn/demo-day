# Exec Plan - P0-004 Knowledge base source selection and RAG retrieval

## Muc Tieu

- Feature: `P0-004 - Knowledge base source selection and RAG retrieval`
- User stories: `US-006`, `US-007`, `US-008`
- Ket qua user can validate: Teacher xem completed source documents tu Supabase va backend retrieve top-k chunks co citation metadata tu `document_chunks`.
- Vertical slice: backend Supabase documents/chunks + retrieval service + frontend source picker + RAG tests/manual validation.

## Scope P0

- Lam:
  - Chi truy van documents/chunks da pre-ingest trong Supabase.
  - Chi cho Teacher chon documents status completed.
  - Retrieval nhan topic/session va selected_document_ids, tra top-k chunks co citation metadata.
  - Luu retrieved context vao generation job neu schema co san.
- Khong lam:
  - Mock RAG data de danh dau done.
  - Upload books UI, local `./data/books/` production reads, GraphRAG, ingestion production.
- Dependencies da xong: `P0-002`, `P0-003`
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

Decision 2026-06-28:
- User da cung cap `SUPABASE_POOLER_CONNECTING_STRING`.
- Agent da fix URL-encode password trong `.env` va test ket noi bang chinh URI thanh cong: `pooler_connect_ok db=postgres user=postgres postgres=17.6`.
- Supabase project ban dau chua co `documents`/`document_chunks`; P0-004 da tao schema toi thieu va pre-ingest local `data/books/` vao Supabase.
- App runtime khong doc `data/books/`; chi script pre-ingest local doc folder nay.
- P0-004 chua goi OpenAI/AI provider. Embedding tam thoi dung deterministic local hash vector de tao pgvector data that; AI provider abstraction/generation thuoc P0-005.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Documents endpoint tra source documents kem status metadata cho Teacher.
  - Failed/processing documents khong duoc dung de generate/retrieve.
  - Retrieval chi dung selected_document_ids va tra chunk citation fields.
  - Khong gui toan bo document/PDF vao retrieval/generation context.
- Frontend:
  - Source picker load documents qua `URL_BACKEND`.
  - Completed documents selectable; failed/processing disabled.
  - Warning khi chua chon document.
- Integration/e2e:
  - HTTP smoke voi Supabase documents/chunks that.
- Security/access:
  - Supabase service key chi o backend.
  - Teacher-only endpoints bi chan voi Student/Admin token sai.

### Manual validation

Prerequisite:
- Supabase REST/RPC truy cap duoc.
- Table `documents` va `document_chunks` ton tai voi data pre-ingested.
- Co completed documents va chunks co `document_title`, `page_number`, `excerpt`, `chunk_id`.

Steps:
1. Login Teacher.
2. Mo source picker va xem documents.
3. Chon completed document.
4. Retrieve topic `Transformer Architecture`.

Expected:
- Source picker hien title, status, chunk count.
- Retrieval tra top-k chunks trong selected documents.
- Citation metadata day du.

Negative check:
- Failed/processing documents khong selectable.
- Chua chon document thi UI hien warning.
- Student/Admin khong goi duoc teacher retrieval endpoints.

## Implementation Plan Theo Vertical Slice

Backend:
- Tao schema `documents`, `document_chunks`, `generation_jobs` tren Supabase Postgres voi pgvector, RLS enabled va indexes can thiet.
- Tao script pre-ingest local PDFs tu `data/books/`: extract text theo page, chunk noi dung, tao deterministic embedding, upsert documents/chunks vao Supabase.
- Them DB client doc `SUPABASE_POOLER_CONNECTING_STRING`/`DATABASE_URL` tu env/root `.env`, khong in secret.
- Them API `GET /api/v1/documents` cho Teacher lay source documents.
- Them API `POST /api/v1/rag/retrieve` cho Teacher retrieve top-k chunks trong selected completed documents va luu context vao `generation_jobs`.

Frontend:
- Them API client documents/retrieval.
- Them Teacher source picker: list documents, chi completed selectable, warning khi chua chon.
- Them retrieval preview cho topic demo va hien citation fields.

Tests:
- Backend service tests voi fake repository de verify role guard, completed-only selection, selected-document filtering, citation response.
- Frontend API client tests cho endpoint URL/header/body.
- HTTP/DB smoke sau khi ingest de verify Supabase documents/chunks va retrieval that.

Docs / Env:
- Cap nhat `.env.example` voi pooler/database keys da dung.
- Cap nhat feature/progress/handoff va debt neu local hash embedding la shortcut.

## Evidence Sau Khi Lam

Commands da chay:
- Supabase REST check bang `.env` keys, khong in secret.
- `uv run python scripts/ingest_books.py --schema-only`
- `uv run python scripts/ingest_books.py --reset` (da dung bang Ctrl-C sau khi 5 PDF dau ingest xong vi output bi buffer; DB da commit 5 completed documents)
- DB verification: `completed_documents_chunks (5, 4256)`, `document_chunks_rows 4256`, `retrieval_jobs 3`
- Targeted backend: `uv run pytest tests/test_knowledge_rag.py -q` -> `5 passed`
- Targeted frontend: `pnpm --dir frontend exec vitest run src/api/learning.test.ts` -> `6 passed`
- Full backend: `uv run pytest -q` -> `19 passed`
- Frontend typecheck/lint/build pass.
- HTTP smoke local: Teacher login 200, `GET /documents` 200 count 5, `POST /rag/retrieve` 200 count 3 va co `generation_job_id`, Student `GET /documents` 403.
- Full verification: `./init.sh` pass; frontend 6 files/22 tests pass; backend 19 tests pass.
- Review: khong co `/review` tool truc tiep trong session; da thuc hien manual code review tren diff, chay `git diff --check` pass, va fix ingest script metadata path/flush progress.

Ket qua:
- `documents` REST query tra HTTP 404.
- `document_chunks` REST query tra HTTP 404.
- REST OpenAPI tra status 200 nhung chi co `path_count 2`, khong co path nao chua `document` hoac `chunk`.
- Thu `Accept-Profile` voi `public` va `graphql_public` van 404; `storage` va `extensions` tra 406.
- Repo co local PDFs trong `data/books/`, vi du `data/books/ai/building applications with ai agents.pdf` va nhieu sach design/microservices. Theo guardrail, folder nay chi dung pre-ingest local, khong duoc app production doc truc tiep.
- Khong co `supabase/` migrations, file `.sql`, `.mcp.json`, hay Supabase CLI trong environment. Chi co Supabase URL/key trong `.env`; REST/service role khong du de tao remote database schema.
- User da bo sung `SUPABASE_DB_NAME`, `SUPABASE_DB_PASSWORD`, `SUPABASE_DIRECT_CONNECTING_STRING` vao `.env`.
- `SUPABASE_DIRECT_CONNECTING_STRING` hien tai khong parse duoc do password co ky tu `@` chua URL-encode; khi connect bang tham so rieng, direct host resolve ra IPv6 va environment khong co IPv6 outbound (`Network is unreachable`).
- Thu Supabase pooler pattern pho bien voi mot so region/port/user pattern deu fail; loi dai dien: `tenant/user ... not found`, nen can pooler connection string chinh xac tu Supabase Dashboard.
- Da them backend dependencies `psycopg[binary]` va `pypdf` de san sang connect Postgres va extract PDFs khi DB route kha dung.
- 2026-06-28: User bo sung pooler; agent fix encode password trong `.env`. Test thanh cong bang chinh `SUPABASE_POOLER_CONNECTING_STRING`: `pooler_connect_ok db=postgres user=postgres postgres=17.6`.
- Tao schema Supabase public: `documents`, `document_chunks`, `generation_jobs`; RLS enabled cho ca 3 bang; `pgvector` extension available va `vector` cast ok.
- Pre-ingest 5 completed PDF documents vao Supabase voi 4,256 chunks/embeddings. Runtime app khong doc `data/books/`; chi script pre-ingest doc local folder.
- Retrieval hybrid lexical + vector tra citations toi thieu: document title, page number, excerpt, chunk id, score.
- Retrieved context duoc luu vao `generation_jobs` voi `job_type='retrieval'`, `status='completed'`.

Manual validation da huong dan user:
Prerequisite:
- `.env` da co `SUPABASE_POOLER_CONNECTING_STRING` da URL-encode password.
- Supabase DB da co 5 documents completed va 4,256 chunks.

Steps:
1. Chay backend: `cd backend && uv run fastapi dev main.py --host 0.0.0.0 --port 3000`.
2. Chay frontend: `pnpm --dir frontend dev --host 0.0.0.0`.
3. Login Teacher demo.
4. Trong Teacher Dashboard, xem `Knowledge sources and RAG`, chon completed document, topic `Transformer Architecture`, bam `Retrieve chunks`.

Expected:
- UI hien source documents voi title, file name, status/chunk count.
- Retrieval tra top-k chunks co document title, page number, chunk index, score va excerpt.
- Backend khong doc PDF local khi retrieve; data lay tu Supabase.

Negative check:
- Bo chon het documents thi UI canh bao `Select a completed document before retrieval`.
- Student login khong thay Teacher source picker; Student goi `/api/v1/documents` bi 403.

## Files Changed

- `docs/harness/exec-plans/completed/P0-004-knowledge-rag.md`
- `backend/main.py`
- `backend/scripts/ingest_books.py`
- `backend/tests/test_knowledge_rag.py`
- `backend/pyproject.toml`
- `backend/uv.lock`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `.env.example`
- `docs/harness/exec-plans/tech-debt-tracker.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Khong con blocker DB cho P0-004.
- Next feature: `P0-005 - AI provider abstraction and course outline generation`.
- Debt: `TD-004` ghi local hash embedding va moi ingest 5/10 PDF; co the resume bang `uv run python scripts/ingest_books.py --start-index 5`.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
