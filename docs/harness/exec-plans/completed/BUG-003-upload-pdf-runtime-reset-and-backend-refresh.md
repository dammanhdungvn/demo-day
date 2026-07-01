# Exec Plan - BUG-003 Upload PDF runtime form reset and backend refresh

## Muc Tieu

- Feature: BUG-003 Upload PDF runtime form reset and backend refresh
- User stories: Teacher upload document from `/teacher`.
- Ket qua user can validate: Teacher upload PDF khong crash `Cannot read properties of null (reading 'reset')`; backend upload khong tra message tho `DependencyError`.
- Vertical slice: frontend handler fix + backend runtime/dependency verification + smoke test.

## Scope P0

- Lam:
  - Capture form reference truoc `await` trong Teacher/Admin knowledge upload handler.
  - Xac minh backend code/dependency moi cho PDF extraction da co trong runtime.
  - Restart backend local neu process port 3000 dang chay ban cu.
- Khong lam:
  - Khong them async ingestion queue production.
  - Khong doi Supabase schema.
  - Khong doi product scope version 2/3.
- Dependencies da xong: BUG-002.
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`, `feature_list.json`, harness docs.
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend: `uv run pytest tests/test_knowledge_rag.py -q`.
- Frontend: `pnpm --dir frontend typecheck`, `pnpm --dir frontend lint`.
- Integration/e2e: Playwright smoke voi upload endpoint mocked de confirm submit khong co page error va status duoc cap nhat.
- Security/access: Khong doi role guard; `./init.sh` chay lai full guard.

### Manual validation

Prerequisite:
- Backend port 3000 va frontend port 5173 dang chay code moi.

Steps:
1. Mo `http://127.0.0.1:5173/teacher`.
2. Dang nhap Teacher demo neu can.
3. Vao khu vuc `Kho tri thuc`, chon mot file PDF text-based.
4. Bam `Upload tài liệu`.

Expected:
- Khong con crash `Cannot read properties of null (reading 'reset')`.
- Neu PDF hop le, UI hien upload/ingest thanh cong hoac skipped/reingested.
- Neu PDF ma hoa/password/khong extract duoc, UI hien message than thien, khong hien `DependencyError`.

Negative check:
- Upload file khong phai PDF van bi chan o frontend/backend.

## Implementation Plan Theo Vertical Slice

Backend:
- Kiem tra backend source khong con error message tho.
- Kiem tra `cryptography` trong backend venv.
- Restart process backend port 3000 neu can.

Frontend:
- Luu `const form = event.currentTarget` truoc `await`.
- Dung `form.reset()` sau khi upload thanh cong.

Tests:
- Chay targeted frontend/backend checks.
- Chay Playwright smoke cho Teacher upload form voi mocked API.
- Chay `./init.sh`.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` baseline truoc khi code.
- `pnpm --dir frontend typecheck`
- `pnpm --dir frontend lint`
- `cd backend && uv run pytest tests/test_knowledge_rag.py -q`
- `cd backend && uv run python` smoke xac minh `cryptography` va `pdf_extraction_failure_message`.
- Playwright smoke Teacher upload form voi mocked `/api/v1/documents/upload`.
- Restart backend local bang `uv run fastapi dev main.py --host 127.0.0.1 --port 3000`.
- `./init.sh` final.
- `python3 -m json.tool feature_list.json`
- `git diff --check`

Ket qua:
- Frontend handler da capture `form` truoc async va reset bang `form.reset()`.
- `pnpm --dir frontend typecheck` pass.
- `pnpm --dir frontend lint` pass.
- `uv run pytest tests/test_knowledge_rag.py -q` pass 16 tests.
- Backend venv co `cryptography 49.0.0`; helper PDF extraction khong tra raw `DependencyError`.
- Playwright smoke pass: Teacher upload form goi upload route mocked, UI hien `Da ingest Smoke Upload: 1 chunk.`, khong co page error/console error.
- Final `./init.sh` pass: frontend 11 files/43 tests + build, backend 58 tests.
- Backend da restart va health `http://127.0.0.1:3000/api/v1/health` tra `status: ok`.
- `feature_list.json` hop le va `git diff --check` pass.

Manual validation da huong dan user:
- Mo `http://127.0.0.1:5173/teacher`, dang nhap Teacher, upload lai PDF bi loi truoc do. Expected: khong con crash `reset`; neu PDF extract duoc thi ingest thanh cong/skipped/reingested, neu PDF khong extract duoc thi hien message than thien khong co `DependencyError`.

## Files Changed

- `frontend/src/App.tsx`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/harness/exec-plans/active/BUG-003-upload-pdf-runtime-reset-and-backend-refresh.md`

## Blockers / Next Step

- Khong co. Backend local port 3000 va frontend port 5173 dang listen sau verification.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
