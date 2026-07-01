# Exec Plan - P1-005 Upload books UI

## Muc Tieu

- Feature: P1-005 Upload books UI
- User stories: US-036
- Ket qua user can validate: Teacher/Admin upload PDF vao knowledge base, thay document status/job ro rang, Student bi chan.
- Vertical slice: Backend upload/ingest endpoint + frontend upload panel + automated tests + manual validation.

## Scope P1

- Lam:
  - Backend endpoint upload PDF qua multipart, chi cho Teacher/Admin.
  - Validate file type `.pdf`, content type PDF va size guard MVP.
  - Ingest dong bo toi thieu vao bang `documents`/`document_chunks`, tao `generation_jobs` job `document_upload`.
  - UI upload cho Teacher va Admin, hien loading/success/error/status.
  - Reload document list sau upload de Teacher co the chon source moi.
- Khong lam:
  - Khong ingest lai toan bo `data/books/`.
  - Khong commit raw PDF/books.
  - Khong lam skip unchanged/re-ingest changed theo hash; do la P1-006.
  - Khong dua Supabase secret/service key ra frontend.
- Dependencies da xong: P0-004, P1-004
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Teacher/Admin upload PDF hop le se goi repository ingest va tra `DocumentUploadResponse` co document/job status.
  - Student upload bi chan 403.
  - File khong phai PDF bi chan 400.
  - File vuot size guard bi chan 413.
  - Admin list documents duoc; Student list documents van bi chan.
- Frontend:
  - API client `uploadDocument` gui multipart FormData den `/documents/upload` voi Bearer token, khong set Content-Type thu cong.
  - `fetchDocuments` van doc tu backend URL abstraction.
- Integration/e2e:
  - `./init.sh` sau feature phai pass.
- Security/access:
  - Upload di qua backend, frontend khong co Supabase secret, OpenAI key, hoac hardcode backend URL.

### Manual validation

Prerequisite:
- Backend va frontend dang chay.
- Co file PDF nho hop le tren may local, khong commit vao git.

Steps:
1. Dang nhap Teacher, mo kho tri thuc/RAG, chon file PDF va bam upload.
2. Xac nhan status upload hien completed/failed ro rang va danh sach documents reload.
3. Dang nhap Admin, upload lai mot PDF nho va xem status upload.

Expected:
- File PDF hop le duoc backend xu ly, document moi hien trong danh sach voi chunk/status.
- File upload khong lam lo secret trong frontend.

Negative check:
- Dang nhap Student goi upload endpoint bi 403.
- Chon file `.txt` hoac file vuot size guard bi 400/413 va UI hien loi.

## Implementation Plan Theo Vertical Slice

Backend:
- Them model response upload document va repository method ingest uploaded PDF.
- Them PDF extraction/chunking helper trong backend runtime, reuse embedding local-hash hien co.
- Them route `POST /api/v1/documents/upload` cho Teacher/Admin va mo `GET /documents` cho Admin de xem status.

Frontend:
- Them type/client `uploadDocument`.
- Them upload panel dung chung cho Teacher/Admin, co loading/error/success va reload document list.

Tests:
- Mo rong backend `test_knowledge_rag.py`.
- Mo rong frontend `learning.test.ts`.

Docs / Env:
- Cap nhat progress/session-handoff/evidence sau khi pass.
- Ghi debt neu upload con dong bo/in-memory job visibility chua production-ready.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh`
- `uv run pytest tests/test_knowledge_rag.py -q`
- `uv run pytest -q`
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts`
- `pnpm --dir frontend typecheck`
- `pnpm --dir frontend lint`
- `git diff --check`
- Supabase smoke qua backend repository: upload local ignored PDF `A_Philosophy_of_Software_Design.pdf` va retrieve lai document do.

Ket qua:
- Backend targeted upload/RAG tests pass 11 tests.
- Backend full pytest pass 53 tests.
- Frontend API tests pass 14 tests.
- Full `./init.sh` pass voi frontend 9 files/37 tests + build va backend 53 tests.
- Supabase smoke: upload completed, document co 417 chunks, job completed, retrieval tra 1 chunk.

Manual validation da huong dan user:
- Co manual validation steps trong plan: Teacher upload PDF, Admin upload PDF, Student/API negative check, file type/size negative check.

## Files Changed

- `backend/main.py`
- `backend/tests/test_knowledge_rag.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/harness/exec-plans/tech-debt-tracker.md`

## Blockers / Next Step

- P1-005 done. Next active: P1-006 Incremental ingestion production-ready.

## Quality Gate

- [x] Khong vuot P1 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
