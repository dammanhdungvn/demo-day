# Exec Plan - V2-008 Document lifecycle management

## Muc Tieu

- Feature: Document lifecycle management
- User stories: `US-213`, `US-209`, `US-207`, `US-208`
- Ket qua user can validate: Teacher/Admin archive document trong kho tri thuc; archived/failed/processing document khong duoc chon RAG/generation moi; failed document re-upload cung file se retry ingestion thay vi skip.
- Vertical slice: backend schema/service/API + frontend controls/status + automated tests + manual validation.

## Scope P0

- Lam:
  - Them `is_active` vao document response/schema bang migration idempotent.
  - Them endpoint Teacher/Admin archive document, khong xoa chunks/citations.
  - Retrieval reject document inactive hoac khong completed voi response detail ro.
  - Sua upload retry: failed document cung file/hash phai queue/reingest.
  - Frontend Teacher/Admin hien inactive ro, disable selection va co nut archive.
- Khong lam:
  - Khong them delete hard data.
  - Khong them restore/unarchive trong slice nay.
  - Khong them org scoping/auth production trong feature nay.
- Dependencies da xong: `V2-007`
- Source-of-truth da doc: `docs/version2/USER_STORIES_V2.md`, `docs/version2/PRD_V2_PRODUCTION.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker; archive la soft-deactivate de bao toan citations cu.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - `determine_document_ingestion_action` re-upload failed same hash returns `reingested`.
  - `archive_source_document` requires Teacher/Admin, Student 403.
  - Archived/inactive completed document bi `retrieve_relevant_chunks` reject voi `inactive_document_ids`.
  - Repository fake keeps chunks untouched on archive.
- Frontend:
  - API `archiveDocument` sends `POST /documents/{id}/archive` voi bearer token.
  - UI/API type includes `is_active`; source selection only active + completed.
- Integration/e2e:
  - `./init.sh` full.
- Security/access:
  - Backend role guard cho archive, retrieve vẫn Teacher-only.

### Manual validation

Prerequisite:
- Backend/frontend local running.

Steps:
1. Dang nhap Teacher.
2. Mo Kho tri thuc, archive mot completed document.
3. Xac nhan document hien inactive/archived va checkbox bi disable.
4. Goi retrieval voi id document archived.
5. Upload lai mot failed PDF cung file/content.

Expected:
- Archive khong xoa document khoi list nhung no khong con duoc chon.
- Backend retrieval archived doc tra 400 voi inactive document detail.
- Failed same-hash upload tra processing/reingested hoac ingested retry, khong `skipped`.

Negative check:
- Student archive endpoint bi 403.
- Failed/processing/inactive documents khong duoc dung cho generation moi.

## Implementation Plan Theo Vertical Slice

Backend:
- Cap nhat `DocumentRecord` them `is_active`.
- Cap nhat schema helper/migration documents `is_active boolean default true`.
- Them `archive_document` vao `KnowledgeRepository` va service/route.
- Cap nhat retrieval availability check `completed && is_active`.
- Cap nhat ingestion action de failed same-hash retry.

Frontend:
- Cap nhat type/API `archiveDocument`.
- Refactor document row nhe de co archive button va inactive label.
- Teacher/Admin reload documents sau archive, bo selected id neu archived.

Tests:
- Backend tests truoc/sau code trong `test_knowledge_rag.py`.
- Frontend API test trong `learning.test.ts`.
- Full `./init.sh`.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/OVERNIGHT_HANDOFF.md`.
- Neu co debt thi ghi tech-debt tracker.

## Evidence Sau Khi Lam

Commands da chay:
- `uv run pytest tests/test_knowledge_rag.py -q` -> pass 20.
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts src/features/teacherWorkspace.test.ts src/uploadStatus.test.ts` -> pass 3 files / 24 tests.
- `pnpm --dir frontend typecheck` -> pass.
- `pnpm --dir frontend lint` -> pass.
- `uv run python -m compileall main.py` -> pass.
- `./init.sh` -> pass voi frontend 12 files / 50 tests + build va backend 79 tests.
- Postgres smoke `document_lifecycle_smoke_ok` -> pass, archive document tam, retrieval inactive reject 400, cleanup thanh cong.

Ket qua:
- Backend co `DocumentRecord.is_active`, migration idempotent `documents.is_active`, route `POST /api/v1/documents/{document_id}/archive`.
- Archive la soft-deactivate, khong xoa chunks/citations.
- Retrieval reject documents khong active hoac khong completed voi detail `inactive_document_ids`/`unavailable_document_ids`.
- Failed/inactive same-hash upload retry bang `reingested` thay vi `skipped`.
- Frontend Teacher/Admin co icon archive, inactive label, disable selection; V4 SourceStrip/metrics chi tinh active completed sources.

Manual validation da huong dan user:
- Dang nhap Teacher/Admin, archive mot completed document, document hien `Đã archive` va khong chon duoc cho RAG.
- Goi retrieval/generate voi archived document id se bi backend reject 400.
- Upload lai failed document cung file/content de retry ingestion thay vi skip.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V2-008-document-lifecycle-management.md`
- `backend/main.py`
- `backend/scripts/ingest_books.py`
- `backend/tests/test_knowledge_rag.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`

## Blockers / Next Step

- Khong co blocker hien tai.
- Khong co debt moi; restore/unarchive va hard delete nam ngoai scope V2-008.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md` hoac xac nhan khong co.
