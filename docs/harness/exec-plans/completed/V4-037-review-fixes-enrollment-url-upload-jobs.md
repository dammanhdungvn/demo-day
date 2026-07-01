# Exec Plan - V4-037 Review fixes enrollment URL upload jobs

## Muc Tieu

- Feature: `V4-037 Review fixes: enrollment, URL redirect safety, upload job visibility`
- User stories: `US-401`, `US-405`, `US-409`, `US-413`
- Ket qua user can validate: Student duoc invite/accept co the duoc Teacher add vao class; URL ingestion khong fetch redirect private; Teacher upload job hien trong job queue khi dung Postgres.
- Vertical slice: backend service/repository/security fix, UI dung API hien co nen khong doi frontend surface.

## Scope P0

- Lam:
  - Learning service doc active student profiles tu auth repository cung organization.
  - URL ingestion validate moi redirect target truoc khi follow.
  - Postgres document upload job insert ghi `actor_id` va `actor_role`.
- Khong lam:
  - Khong doi auth strategy, UI redesign, worker queue moi, hay migration Supabase ngoai schema helper hien co.
  - Khong commit/raw touch `data/books/`.
- Dependencies da xong: `V4-029`, `V4-031`, `V4-035`, `V4-036`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - `tests/test_learning.py`: invited active student profile tu auth repository xuat hien trong list va enroll duoc vao class.
  - `tests/test_auth_module_boundaries.py`: auth repository protocol/adapters expose `list_profiles`.
  - `tests/test_knowledge_rag.py`: redirect handler reject `Location` ve loopback/private truoc khi follow; allowed relative redirect van tao request hop le.
  - `tests/test_knowledge_rag.py`: `_save_document_upload_job` insert SQL co `actor_id`/`actor_role` va bind dung teacher.
- Frontend:
  - Khong doi frontend; chay full frontend qua `./init.sh`.
- Integration/e2e:
  - `./init.sh` full gate.
- Security/access:
  - SSRF regression test cho redirect target unsafe.
  - Learning service van filter same organization va active student.

### Manual validation

Prerequisite:
- Backend chay voi auth/repository mode production hoac memory local.

Steps:
1. Admin tao invite Student, user accept invite, Teacher mo danh sach `/students`.
2. Teacher add invited Student vao class va Student login thay class.
3. Teacher ingest URL public co redirect ve `127.0.0.1`/private host.
4. Teacher upload PDF va goi `/api/v1/generation-jobs`.

Expected:
- Invited Student active cung organization nam trong candidate list va enroll thanh cong.
- Unsafe redirect bi 400 truoc khi fetch private target.
- Upload job co actor columns nen Teacher thay job cua minh.

Negative check:
- Student disabled/cross-org khong duoc list/enroll.
- URL loopback/private direct hoac qua redirect deu bi reject.

## Implementation Plan Theo Vertical Slice

Backend:
- Them `AuthRepository.list_profiles` cho memory/Postgres adapters.
- Learning service merge demo student fallback voi auth profile students active cung org.
- Them safe redirect handler cho `fetch_web_page`.
- Them actor columns vao document upload job insert.

Frontend:
- Khong doi UI trong slice nay.

Tests:
- Them regression tests truoc khi implementation va chay targeted fail/pass.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, va move exec plan sang completed khi done.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline `./init.sh` pass truoc code.
- Fail-first targeted:
  - `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_learning.py::test_teacher_can_enroll_invited_active_student_profile tests/test_auth_module_boundaries.py::test_auth_ports_module_exports_protocol_contracts tests/test_auth_module_boundaries.py::test_auth_repository_module_exports_adapters_and_schema_sql tests/test_knowledge_rag.py::test_web_fetch_redirect_handler_rejects_unsafe_redirect_target tests/test_knowledge_rag.py::test_web_fetch_redirect_handler_allows_safe_relative_redirect tests/test_knowledge_rag.py::test_supabase_upload_job_insert_sets_actor_columns -q`
- Sau fix:
  - `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_learning.py::test_teacher_can_enroll_invited_active_student_profile tests/test_auth_module_boundaries.py::test_auth_ports_module_exports_protocol_contracts tests/test_auth_module_boundaries.py::test_auth_repository_module_exports_adapters_and_schema_sql tests/test_knowledge_rag.py::test_web_fetch_redirect_handler_rejects_unsafe_redirect_target tests/test_knowledge_rag.py::test_web_fetch_redirect_handler_allows_safe_relative_redirect tests/test_knowledge_rag.py::test_supabase_upload_job_insert_sets_actor_columns -q`
  - `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_learning.py tests/test_auth_module_boundaries.py tests/test_knowledge_rag.py -q`
  - `UV_CACHE_DIR=.uv-cache uv run pytest -q`

Ket qua:
- Baseline `./init.sh` pass truoc code: frontend 15 files/64 tests + build, backend 170 tests.
- Fail-first targeted SSRF regression fail do `SafeWebRedirectHandler` chua ton tai.
- Sau fix targeted 6 pass; broader learning/auth/knowledge 57 pass; backend full 174 pass.

Manual validation da huong dan user:
- Prerequisite:
  - Backend chay voi auth/repository mode production hoac memory local.
- Steps:
  1. Admin tao invite Student, user accept invite, Teacher mo danh sach `/students`.
  2. Teacher add invited Student vao class va Student login thay class.
  3. Teacher ingest URL public co redirect ve `127.0.0.1`/private host.
  4. Teacher upload PDF va goi `/api/v1/generation-jobs`.
- Expected:
  - Invited Student active cung organization nam trong candidate list va enroll thanh cong.
  - Unsafe redirect bi 400 truoc khi fetch private target.
  - Upload job co actor columns nen Teacher thay job cua minh.
- Negative check:
  - Student disabled/cross-org khong duoc list/enroll.
  - URL loopback/private direct hoac qua redirect deu bi reject.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V4-037-review-fixes-enrollment-url-upload-jobs.md`
- `backend/app/auth/ports.py`
- `backend/app/auth/repositories.py`
- `backend/app/learning/services.py`
- `backend/app/main.py`
- `backend/tests/test_auth_module_boundaries.py`
- `backend/tests/test_learning.py`
- `backend/tests/test_knowledge_rag.py`
- `docs/version4/README.md`
- `docs/version4/PRODUCTION_GAP_ANALYSIS.md`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Khong con blocker trong scope V4-037.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Khong co shortcut/debt moi can ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
