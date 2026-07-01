# Exec Plan - V2-007 Async document ingestion jobs

## Muc Tieu

- Feature: Async document ingestion jobs
- User stories: `US-209`, `US-207`, `US-208`, `US-213`
- Ket qua user can validate: Upload PDF tra response nhanh voi status processing, document/job cap nhat completed/failed sau background processing, failed co huong dan retry bang re-upload.
- Vertical slice: backend queue/background path + frontend status/retry guidance + tests.

## Scope P0

- Lam:
  - Them queue upload service dung FastAPI `BackgroundTasks`.
  - File moi/re-ingest tao document `processing`, job `processing`, response ngay.
  - Background task extract/chunk/embed va cap nhat document/job `completed` hoac `failed`.
  - Giu skip unchanged, file guard, role guard, size guard.
  - Frontend hien message processing/failed/retry bang upload lai file.
- Khong lam:
  - Khong them Supabase Storage/blob persistence cho raw PDF trong slice nay.
  - Khong them worker queue ngoai process; neu server restart trong luc task chay, can retry bang re-upload.
  - Khong lam retry endpoint khong can file vi raw PDF khong duoc luu ben vung.
- Dependencies da xong: `V2-006`
- Source-of-truth da doc: `docs/version2/README.md`, `docs/version2/PRD_V2_PRODUCTION.md`, `docs/version2/USER_STORIES_V2.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker; durable raw file storage/retry endpoint de lai cho Supabase Storage slice sau.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - `tests/test_knowledge_rag.py` queue upload returns processing and does not call extraction before background task.
  - `tests/test_knowledge_rag.py` background task completes fake repository processing.
  - Existing upload guards still pass: Student 403, non-PDF 400, oversize 413.
- Frontend:
  - `uploadStatus.test.ts` processing message explains ingestion queued/processing.
  - `uploadStatus.test.ts` failed message explains retry by re-upload.
- Integration/e2e:
  - `./init.sh` full.
- Security/access:
  - Backend role guard remains Teacher/Admin; frontend only displays status.

### Manual validation

Prerequisite:
- Backend/frontend local running.

Steps:
1. Dang nhap Teacher.
2. Upload mot PDF hop le.
3. Quan sat upload panel va danh sach source documents.
4. Neu document failed, upload lai cung file de retry.

Expected:
- Upload response ban dau la processing/queued.
- Document list chuyen processing -> completed/failed sau reload.
- Failed message noi retry bang re-upload.

Negative check:
- Student upload endpoint bi 403.
- File khong phai PDF bi 400.

## Implementation Plan Theo Vertical Slice

Backend:
- Them repository methods queue/process upload ingestion.
- Them service `queue_source_document_upload` dung `BackgroundTasks`.
- Route `/documents/upload` dung queue path thay vi sync path.
- Giu sync helper hoac fake adapter cho tests can cu.

Frontend:
- Update upload status message cho processing/failed retry guidance.
- Sau upload processing, reload documents va khong auto-select document chua completed.

Tests:
- Test-first backend/frontend targeted.
- Full `./init.sh`.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/OVERNIGHT_HANDOFF.md`, tech debt neu can.

## Evidence Sau Khi Lam

Commands da chay:
- `uv run pytest tests/test_knowledge_rag.py -q` -> pass 17.
- `uv run pytest tests/test_knowledge_rag.py tests/test_ai_rate_guard.py tests/test_generation_jobs.py -q` -> pass 23.
- `pnpm --dir frontend exec vitest run src/uploadStatus.test.ts` -> pass 5.
- `pnpm --dir frontend typecheck` -> pass.
- `pnpm --dir frontend lint` -> pass.
- `pnpm --dir frontend test -- --run` -> pass 12 files / 49 tests.
- `./init.sh` -> pass voi frontend 12 files / 49 tests + build va backend 76 tests.
- HTTP smoke local upload PDF payload gia -> initial status `processing`, background final status `failed`, cleanup document/job tam thanh cong.

Ket qua:
- Backend them queue/background ingestion path cho `POST /api/v1/documents/upload` bang FastAPI `BackgroundTasks`.
- File moi/re-ingest tao document `processing` va generation job `processing`, response ngay; background extract/chunk/embed roi update document/job sang `completed` hoac `failed`.
- Skip unchanged van tra `skipped` khong tao background task.
- Frontend upload panel va status helper hien queued/processing/failed retry guidance.

Manual validation da huong dan user:
- Upload PDF hop le bang Teacher/Admin: UI bao da xep hang/processing, reload source list de xem completed/failed.
- Neu failed, upload lai cung file de retry vi raw file chua duoc luu durable trong slice nay.
- Student upload endpoint van bi 403; non-PDF van bi 400.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V2-007-async-document-ingestion.md`
- `backend/main.py`
- `backend/tests/test_knowledge_rag.py`
- `frontend/src/uploadStatus.ts`
- `frontend/src/uploadStatus.test.ts`
- `frontend/src/App.tsx`

## Blockers / Next Step

- Khong co blocker hien tai.
- Debt da ghi `TD-015`: background task hien chay in-process, retry bang re-upload vi chua co Supabase Storage/raw file persistence hoac external worker.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
