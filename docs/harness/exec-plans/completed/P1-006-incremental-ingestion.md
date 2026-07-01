# Exec Plan - P1-006 Incremental ingestion production-ready

## Muc Tieu

- Feature: P1-006 Incremental ingestion production-ready
- User stories: US-037
- Ket qua user can validate: upload file moi se ingest, upload lai file khong doi se skip, upload file cung ten nhung noi dung thay doi se re-ingest dung document do.
- Vertical slice: Backend incremental upload decision + frontend skipped/re-ingested status + tests + manual validation.

## Scope P1

- Lam:
  - Dung `file_hash` de skip file khong doi.
  - Dung `file_name` nhu identity toi thieu cua upload UI de re-ingest document khi noi dung thay doi.
  - Response upload co `job_status`/`ingestion_action` ro rang: `ingested`, `skipped`, `reingested`, `failed`.
  - Frontend hien status skipped/re-ingested sau upload.
  - Retrieval tiep tuc chay tren vector store sau re-ingest.
- Khong lam:
  - Khong them storage bucket, background queue, cron, realtime progress.
  - Khong ingest YouTube/link/web.
  - Khong thay embedding model local-hash-v1 trong slice nay.
- Dependencies da xong: P1-005
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Pure decision test: khong co document cu -> `ingested`.
  - Pure decision test: cung `file_name` va cung `file_hash` -> `skipped`.
  - Pure decision test: cung `file_name` nhung khac `file_hash` -> `reingested` va giu document id cu.
  - Response upload cho skipped khong xoa chunks va tra document existing.
  - Retrieval van dung completed document sau re-ingest.
- Frontend:
  - `DocumentUploadResponse` chap nhan `job_status=skipped` va `ingestion_action`.
  - Upload panel hien text skipped/reingested/completed phu hop.
- Integration/e2e:
  - `./init.sh` pass sau feature.
  - Supabase smoke: upload lai file local cu -> skipped; upload file cung ten voi bytes khac qua repository -> reingested same document id.
- Security/access:
  - Giu role/type/size guard P1-005; khong expose Supabase secret ra frontend.

### Manual validation

Prerequisite:
- Backend/frontend dang chay.
- Co mot file PDF nho hop le local-only.

Steps:
1. Dang nhap Teacher va upload PDF moi.
2. Upload lai dung file PDF do.
3. Tao/cap nhat file PDF cung ten nhung noi dung khac va upload lai.

Expected:
- Lan 1 hien ingested/completed.
- Lan 2 hien skipped/unchanged, chunk count khong doi.
- Lan 3 hien re-ingested va document id/list item tuong ung duoc cap nhat.

Negative check:
- Student van bi 403 khi upload.
- File sai type/qua lon van bi chan nhu P1-005.

## Implementation Plan Theo Vertical Slice

Backend:
- Them `DocumentUploadJobStatus` va `DocumentIngestionAction` cho response.
- Them helper quyet dinh incremental dua tren existing document by `file_hash`/`file_name`.
- Cap nhat `SupabaseKnowledgeRepository.ingest_uploaded_pdf` de skip unchanged va re-ingest same filename changed file.

Frontend:
- Cap nhat type `DocumentUploadResponse`.
- Cap nhat upload status text cho `skipped`, `ingested`, `reingested`, `failed`.

Tests:
- Mo rong backend `test_knowledge_rag.py`.
- Them frontend helper/test neu can de test status text.

Docs / Env:
- Cap nhat progress/session-handoff/feature_list evidence.
- Cap nhat debt tracker neu TD-012 scope con lai thay doi.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh`
- `uv run pytest tests/test_knowledge_rag.py -q`
- `uv run pytest -q`
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts src/uploadStatus.test.ts`
- `pnpm --dir frontend typecheck`
- `pnpm --dir frontend lint`
- `git diff --check`
- Supabase smoke incremental upload/retrieval/cleanup.

Ket qua:
- Backend targeted pass 14 tests.
- Backend full pytest pass 56 tests.
- Frontend targeted upload/status pass 17 tests.
- Full `./init.sh` pass voi frontend 10 files/40 tests + build va backend 56 tests.
- Supabase smoke: first action `ingested`, second `skipped`, third `reingested`, same document id, retrieval tra 1 chunk, smoke document da cleanup.

Manual validation da huong dan user:
- Co manual validation steps trong plan: upload moi, upload lai file cu, upload cung filename voi noi dung khac, Student/type/size negative checks.

## Files Changed

- `backend/main.py`
- `backend/tests/test_knowledge_rag.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/uploadStatus.ts`
- `frontend/src/uploadStatus.test.ts`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- P1-006 done. P1 backlog trong `feature_list.json` khong con feature active.

## Quality Gate

- [x] Khong vuot P1 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
