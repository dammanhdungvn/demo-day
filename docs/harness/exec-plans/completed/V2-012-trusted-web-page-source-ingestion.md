# Exec Plan - V2-012 Trusted web page source ingestion

## Muc Tieu

- Feature: Trusted web page source ingestion
- User stories: `US-214`, ket hop guards tu `US-209`, `US-213`
- Ket qua user can validate: Teacher/Admin paste URL documentation/web page tin cay, backend extract readable text, document hien trong knowledge base va co the dung cho RAG/generation.
- Vertical slice: backend URL fetch/extract/ingest + frontend URL form + tests + Postgres smoke.

## Scope P1

- Lam:
  - API `POST /api/v1/documents/ingest-url`.
  - Request model validate URL http/https.
  - SSRF guard co ban: reject localhost, loopback, private/link-local/reserved IP, URL co credentials, host thieu.
  - Fetch size limit, timeout, content-type `text/html`, `text/plain`, `application/xhtml+xml`.
  - Extract title/text HTML bang stdlib parser, bo script/style/nav.
  - Save source document `source_type=web`, `file_name=url`, `organization_id=current_user.organization_id`, metadata source URL/title.
  - Frontend Teacher/Admin knowledge panel co URL input/button, loading/error/empty state.
- Khong lam:
  - Khong crawl nhieu page/domain.
  - Khong bypass robots/JS-rendered SPA extraction.
  - Khong them browser automation/headless scraper.
  - Khong cho Student ingest URL.
- Dependencies da xong: `V2-011`
- Source-of-truth da doc: `docs/version2/PRD_V2_PRODUCTION.md`, `docs/version2/USER_STORIES_V2.md`.
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong hoi user; ap dung URL safety conservative va stdlib extraction de tranh dependency nang.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - URL request reject unsafe schemes/localhost/private IP/credentials.
  - HTML extraction lay title/body text, bo script/style.
  - Teacher/Admin ingest URL calls repository; Student bi 403.
  - Web document inherits organization_id cua actor.
  - Duplicate/reingest behavior dung `DocumentUploadResponse` contract.
- Frontend:
  - API `ingestUrlDocument` posts JSON va bearer token.
  - Knowledge panel status helper handles web response same PDF.
- Persistence:
  - Postgres smoke insert web doc/chunks, list same org, cleanup.
- Regression:
  - `./init.sh` pass.

## Implementation Plan Theo Vertical Slice

Backend:
- Models: `UrlIngestionRequest`.
- Helpers: URL safety validation, fetch page bytes, HTML/text extraction, web chunk builder.
- Protocol/repository: `ingest_web_page(url, title, text, ingested_by)`.
- Route + service: `ingest_source_url`.

Frontend:
- API client `ingestUrlDocument`.
- `KnowledgeUploadPanel` them URL form, disable/loading, call callback on response.

Docs:
- Cap nhat feature evidence/progress/handoff.

## Evidence Sau Khi Lam

Commands da chay:
- `uv run pytest tests/test_knowledge_rag.py -q` truoc implementation -> fail import/function missing dung ky vong.
- `uv run pytest tests/test_knowledge_rag.py -q` sau implementation -> pass 29.
- `pnpm exec vitest run src/api/learning.test.ts` -> pass 19.
- `uv run pytest -q` -> pass 98.
- `pnpm run lint && pnpm test -- --run && pnpm run build` -> pass frontend 12 files / 54 tests + build.
- Postgres smoke -> `web_ingestion_smoke_ok source_type=web citation_source_url=true cleanup=true`.
- Playwright UI smoke fallback vi Browser plugin khong co -> Teacher URL ingest form mocked, console issues empty, screenshot `/tmp/teachflow-v2-012-url-ingest.png`.
- `./init.sh` -> pass frontend 12 files / 54 tests + build, backend 98 tests.

Ket qua:
- Backend co URL safety guard, fetch/extract HTML/text bang stdlib, route `POST /api/v1/documents/ingest-url`.
- Supabase repository luu web document `source_type=web`, chunks/embedding metadata, job status va dedupe/reingest theo organization.
- Retrieval chunks co optional `source_url` de citation web hien URL.
- Frontend Knowledge panel co URL ingest form cho Teacher/Admin va API client `ingestUrlDocument`.

Manual validation da huong dan user:
- Local: login Teacher/Admin, paste URL trusted vao `Ingest URL`, xac nhan status `Đã ingest ...` va document web xuat hien sau reload.
- RAG: chon web source, retrieve/generate outline, xac nhan citation co URL khi source la web.
- Negative: URL `http://127.0.0.1/...` bi reject 400; Student route bi 403.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/active/V2-012-trusted-web-page-source-ingestion.md`
- `backend/main.py`
- `backend/tests/test_knowledge_rag.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/App.tsx`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`

## Blockers / Next Step

- Khong co blocker cua V2-012.
- Next recommended feature: durable retry/cancel cho ingestion/re-index jobs hoac V2-P1 Student grounded tutor.

## Quality Gate

- [x] Khong vuot P1 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md` hoac xac nhan khong co.
