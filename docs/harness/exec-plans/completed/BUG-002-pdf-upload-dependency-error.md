# Exec Plan - BUG-002 PDF upload DependencyError

## Muc Tieu

- Feature: sua loi upload PDF tra ve `Could not extract text from PDF: DependencyError`.
- User stories: V2 knowledge ingestion production reliability.
- Ket qua user can validate: Upload PDF khong fail vi thieu dependency AES/cryptography cua `pypdf`; neu PDF khong the extract thi message than thien, khong lo ten exception thô.
- Vertical slice: backend dependency + backend extraction helper/test + verification.

## Scope P0

- Lam:
  - Them dependency runtime can thiet cho `pypdf` xu ly PDF ma hoa/AES.
  - Chuan hoa message loi PDF extraction.
  - Them test cho DependencyError mapping.
- Khong lam:
  - Khong chuyen ingestion sang background job trong task nay.
  - Khong doi schema Supabase.
  - Khong doi upload UI neu backend message da duoc frontend hien.
- Dependencies da xong: P1-005/P1-006 upload/incremental ingestion.
- Source-of-truth da doc: `docs/version2/PRD_V2_PRODUCTION.md`, `feature_list.json`, harness docs.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Unit test helper loi extraction mapping `DependencyError`.
  - Targeted `uv run pytest tests/test_knowledge_rag.py -q`.
  - Full backend pytest qua `./init.sh`.
- Frontend:
  - Khong doi frontend.
- Integration/e2e:
  - Neu co server local/Supabase san sang, smoke upload co the chay bang PDF local sau unit/full tests.
- Security/access:
  - Khong doi role guard; upload route van Teacher/Admin only va Student 403.

### Manual validation

Prerequisite:
- Backend/frontend local dang chay.
- Dang nhap Teacher hoac Admin.

Steps:
1. Mo upload PDF trong Teacher/Admin.
2. Chon PDF bi loi truoc do.
3. Bam upload.

Expected:
- PDF khong fail chi vi missing `cryptography`.
- Neu PDF password-protected/khong extract text duoc, UI hien message ro thay vi `DependencyError`.

Negative check:
- Student van khong upload duoc PDF.

## Implementation Plan Theo Vertical Slice

Backend:
- Them `cryptography` vao backend dependency.
- Them helper format extraction error.
- Dung helper trong `SupabaseKnowledgeRepository.ingest_uploaded_pdf`.

Frontend:
- Khong doi.

Tests:
- Them unit test trong `backend/tests/test_knowledge_rag.py`.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` baseline truoc khi sua: pass.
- `uv add cryptography>=43.0.0` trong `backend/`: installed `cryptography==49.0.0`, cap nhat `pyproject.toml` va `uv.lock`.
- `uv run pytest tests/test_knowledge_rag.py -q`: pass 16 tests.
- Encrypted PDF smoke bang `pypdf.PdfWriter`: message password-protected/encrypted than thien, khong con raw exception.
- `uv run pytest -q`: pass 58 tests.
- `python3 -m json.tool feature_list.json`: pass.
- `./init.sh`: pass frontend 11 files/43 tests + build, backend 58 tests.

Ket qua:
- Backend runtime co `cryptography` de `pypdf` xu ly PDF ma hoa/AES.
- PDF encrypted/password-protected duoc detect va map sang message than thien.
- `DependencyError` khong con bi tra thang ra user.

Manual validation da huong dan user:
- Dang nhap Teacher/Admin, upload lai PDF bi loi truoc do.
- Expected: khong con message `DependencyError`; neu PDF password-protected thi UI hien message file password-protected/encrypted.

## Files Changed

- `backend/main.py`
- `backend/pyproject.toml`
- `backend/uv.lock`
- `backend/tests/test_knowledge_rag.py`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Khong co.

## Quality Gate

- [x] Khong vuot scope.
- [x] Co evidence test.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi debt.
