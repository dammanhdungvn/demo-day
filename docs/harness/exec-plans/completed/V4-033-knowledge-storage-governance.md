# Exec Plan - V4-033 Knowledge storage governance

## Muc Tieu

- Feature: V4-033 Knowledge storage governance
- User stories: US-405, US-413
- Ket qua user can validate: Admin/Teacher/Student upload documents co governance metadata ro rang, contextual docs co TTL/quota policy, raw upload co durable storage boundary, va user data export/delete xu ly contextual docs.
- Vertical slice: backend governance metadata + frontend provenance/quota/retention surface + tests + docs/evidence.

## Scope P0

- Lam:
  - Audit current document upload/ingestion schema va repository flow de them governance ma khong pha RAG/generation.
  - Them document governance fields backward-compatible: raw storage pointer/status, retention expiry, quota bytes, provenance/audit metadata.
  - Them storage abstraction de app co durable raw upload boundary; production path doc env va co fallback/test adapter, khong dua raw PDFs vao git/deploy.
  - Enforce contextual quota/retention policy o service layer cho Teacher/Student uploads.
  - Them export/delete user data hooks cho contextual documents owner-scoped.
  - Frontend hien retention/quota/provenance/storage status trong Admin library va user contextual panels.
  - Tests targeted backend/frontend va final `./init.sh`.
- Khong lam:
  - Khong upload raw books trong `data/books/` vao git.
  - Khong hardcode Supabase keys, bucket names hoac backend URL trong frontend.
  - Khong doi API base path `/api/v1` hoac role semantics hien co.
  - Khong thay toan bo ingestion worker bang queue moi trong slice nay.
- Dependencies da xong:
  - V4-028 Knowledge library/contextual access model
  - V4-031 Structured logging and observability foundation
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`, `feature_list.json`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] User da yeu cau khong hoi lai; neu thieu chi tiet, dung conservative production defaults va ghi docs.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Them/extend `tests/test_knowledge_rag.py` cho contextual quota, retention expiry metadata, raw storage metadata va owner-scoped delete/export behavior.
  - Them boundary tests neu tao module/helper governance moi.
  - Chay targeted knowledge/auth/progress/content regression.
- Frontend:
  - Them helper/unit tests cho quota/retention/provenance labels neu logic nam trong helper.
  - Chay `pnpm --dir frontend typecheck`, `lint`, `test -- --run`, `build`.
- Final:
  - `./init.sh`

### Manual validation

Prerequisite:
- `.env` that chua runtime provider/repository mode; khong in secret.
- Backend/Frontend local chay nhu runbook.

Steps:
1. Admin upload library PDF, kiem tra UI hien provenance/storage/retention label phu hop.
2. Teacher upload contextual PDF, kiem tra quota/retention label va document owner-scoped.
3. Student upload contextual PDF, kiem tra Student chi thay tai lieu cua minh.
4. Thu upload vuot quota bang test config nho, xac nhan backend reject co error ro.
5. Chay export/delete user data helper/API neu scope them route; xac nhan contextual docs cua user duoc included/deactivated/deleted theo policy.

Expected:
- Governance policy ro trong API/UI, khong chi nam trong docs.
- RAG/generation van dung hidden library + selected contextual docs nhu V4-028.

Negative check:
- Khong co secret/backend URL hardcode trong frontend.
- User khong thay raw library/private docs ngoai scope.

## Implementation Plan Theo Vertical Slice

Backend:
- Doc current knowledge repository/schema/upload flow.
- Them config env non-secret cho storage/governance defaults trong backend core config neu can.
- Them typed governance helper/service de tinh storage path, retention expiry, quota usage va provenance metadata.
- Mo rong document schema/repository backward-compatible.
- Enforce quota/retention/upload metadata trong upload/URL ingest paths.
- Them export/delete contextual user data behavior voi tests.

Frontend:
- Doc shared knowledge controls.
- Hien storage/provenance/retention/quota labels trong document rows/panels.
- Hien error/loading state cho quota/storage failures.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/version4/*` lien quan.
- Neu them env moi, cap nhat `.env.example` va `init.sh` guard neu bat buoc; `.env` that chi them non-secret default neu can runtime local.
- Move exec plan sang completed sau khi pass.

## Evidence Sau Khi Lam

Commands da chay:
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_knowledge_rag.py -q` pass: 37 tests.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_openapi_contract.py -q` pass: 4 tests.
- `pnpm --dir frontend exec vitest run src/features/knowledge/knowledgeHelpers.test.ts` pass: 2 tests.
- `pnpm --dir frontend typecheck` pass.
- `pnpm --dir frontend lint` pass.
- `pnpm --dir frontend test -- --run` pass: 15 files / 63 tests.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_knowledge_rag.py tests/test_openapi_contract.py tests/test_auth.py -q` pass: 61 tests.
- Playwright fallback Teacher governance render pass: document governance labels visible (`Raw metadata-only`, quota, retention, provenance), console issues empty, screenshot `/tmp/v4-033-knowledge-governance-teacher.png`.
- Final `./init.sh` pass: frontend typecheck/lint/test/build pass voi 15 files/63 tests; backend 167 tests pass.

Ket qua:
- Backend mo rong `DocumentRecord` va Supabase/Postgres schema voi governance fields: raw storage pointer/status, retention expiry, quota limit/used va provenance.
- Them storage boundary `DOCUMENT_STORAGE_PROVIDER=metadata|supabase`; Supabase Storage upload chay server-side bang secret key, local default metadata-only de khong dua raw uploads vao git/deploy.
- Service layer enforce contextual TTL/quota va library org quota truoc khi repository write.
- Them Admin export/delete contextual knowledge endpoints owner-scoped; delete la archive soft-delete.
- Frontend hien storage/quota/retention/provenance labels trong shared document rows va Teacher source picker.
- `.env.example` va `.env` that co cac bien non-secret governance defaults.

Manual validation da huong dan user:
- Login Teacher, xem document source row co label governance.
- Admin/Teacher/Student upload document de kiem tra quota/retention/provenance trong list.
- Admin goi export/delete contextual docs cua user de verify owner-scoped archive.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/active/V4-033-knowledge-storage-governance.md`
- `.env`
- `.env.example`
- `backend/app/knowledge/schemas.py`
- `backend/app/knowledge/__init__.py`
- `backend/app/main.py`
- `backend/tests/test_knowledge_rag.py`
- `frontend/src/api/learning.ts`
- `frontend/src/features/knowledge/knowledgeHelpers.ts`
- `frontend/src/features/knowledge/knowledgeHelpers.test.ts`
- `frontend/src/features/knowledge/KnowledgeControls.tsx`
- `frontend/src/features/teacher/TeacherWorkspace.tsx`
- `frontend/src/App.css`

## Blockers / Next Step

- Khong co blocker hien tai.

## Quality Gate

- [ ] Khong vuot P0 scope.
- [ ] Co evidence test hoac ly do chua co test automation.
- [ ] Co manual validation steps cho user.
- [ ] Khong hardcode secrets/backend URL.
- [ ] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
