# Exec Plan - BUG-004 Review tenant/security/reliability fixes

## Muc Tieu

- Feature: Sua 5 review findings sau V4-042.
- Ket qua user can validate: backend khong leak cross-scope/cross-org data, URL ingestion khong fetch private DNS target, upload failed dung state khi embedding loi, Swagger example dung schema.
- Vertical slice: backend service/repository + tests + docs/evidence.

## Scope

- Lam:
  - Duplicate PDF lookup scope theo `organization_id`, `knowledge_scope`, `owner_user_id`.
  - URL ingestion resolve DNS va reject private/link-local/loopback hostname truoc fetch va sau redirect.
  - Admin generation job history scope theo organization trong Postgres mode.
  - Queued PDF upload mark failed neu embedding provider/embed_text loi.
  - OpenAPI example `POST /courses` dung `learning_goals`.
- Khong lam:
  - Worker queue durable moi.
  - UI/UX moi.
  - Migration file Supabase chinh thuc; schema helper SQL trong app/test la boundary hien tai.

## Source Da Doc

- `AGENTS.md`
- `docs/version4/README.md`
- `docs/version4/PRODUCTION_GAP_ANALYSIS.md`
- `feature_list.json`
- `docs/harness/SOP.md`
- `docs/harness/ARCHITECTURE.md`
- `docs/harness/QUALITY_SCORE.md`
- `docs/harness/RELIABILITY_SECURITY.md`
- `progress.md`
- `session-handoff.md`
- Supabase changelog `https://supabase.com/changelog.md` ngay 2026-06-30; khong co breaking change truc tiep cho patch nay, nhung van giu RLS/revoke/tenant isolation.

## Test Plan Truoc Khi Code

### Automated tests

- `backend/tests/test_knowledge_rag.py`
  - Fail-first: Teacher upload duplicate hash/name voi Admin library doc khong skip/reuse library doc; phai tao contextual doc owner-scoped rieng.
  - Fail-first: URL fetch reject hostname DNS resolve ve `127.0.0.1`/private IP.
  - Fail-first: queued upload embedding error cap nhat document/job failed va ghi `failure_message`.
- `backend/tests/test_generation_jobs.py` hoac `test_jobs_module_boundaries.py`
  - Fail-first: Postgres generation jobs Admin list chi tra jobs actor cung organization, khong tra org khac.
- `backend/tests/test_openapi_contract.py`
  - Fail-first: `POST /courses` example co `learning_goals`, khong co `learning_objectives`.

### Validation commands

- Targeted backend tests lien quan.
- `python3 -m json.tool feature_list.json`
- `git diff --check`
- Final `./init.sh`

## Manual Validation

Prerequisite:
- Co Admin library document va Teacher/Student contextual upload trong cung organization.

Steps:
1. Teacher upload PDF trung hash/name voi Admin library document.
2. Teacher xem `/documents`.
3. Admin goi `/generation-jobs` trong organization cua minh.
4. Goi URL ingest voi hostname public/DNS resolve private IP.
5. Lam embedding provider loi trong upload queue.
6. Mo Swagger `/api/v1/docs`, copy example create course.

Expected:
- Teacher co contextual document rieng, khong thay/leak Admin library doc qua duplicate response.
- Admin job history chi co job trong organization cua Admin.
- URL private DNS target bi reject truoc fetch.
- Upload job/document failed, khong ket `processing`.
- Create course example hop le voi schema.

Negative check:
- Other organization jobs/documents khong xuat hien trong response.
- IP literal va DNS private target deu bi reject.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` truoc code: pass frontend 15 files/71 tests + build, backend 191 tests.
- Fail-first targeted:
  - `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_knowledge_rag.py::test_supabase_duplicate_lookup_scopes_to_document_owner_and_scope tests/test_knowledge_rag.py::test_validate_web_ingestion_url_rejects_dns_that_resolves_private tests/test_knowledge_rag.py::test_queued_pdf_ingestion_marks_failed_when_embedding_provider_errors -q`: fail dung ky vong truoc fix.
  - `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_jobs_module_boundaries.py::test_postgres_admin_generation_jobs_are_scoped_by_organization tests/test_openapi_contract.py::test_openapi_primary_examples_and_error_responses_are_documented -q`: fail dung ky vong truoc fix.
- Sau fix:
  - `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_knowledge_rag.py::test_supabase_duplicate_lookup_scopes_to_document_owner_and_scope tests/test_knowledge_rag.py::test_validate_web_ingestion_url_rejects_dns_that_resolves_private tests/test_knowledge_rag.py::test_queued_pdf_ingestion_marks_failed_when_embedding_provider_errors -q`: 3 pass.
  - `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_jobs_module_boundaries.py::test_postgres_admin_generation_jobs_are_scoped_by_organization tests/test_openapi_contract.py::test_openapi_primary_examples_and_error_responses_are_documented -q`: 2 pass.
  - `UV_CACHE_DIR=.uv-cache uv run pytest tests/test_knowledge_rag.py tests/test_jobs_module_boundaries.py tests/test_generation_jobs.py tests/test_openapi_contract.py -q`: 57 pass.
  - `pnpm --dir frontend exec vitest run src/api/learning.test.ts`: 25 pass.
  - `python3 -c 'import json; json.load(open("feature_list.json")); print("feature_list.json ok")'`: pass.
  - `git diff --check`: pass.
  - `./init.sh`: pass frontend 15 files/71 tests + build, backend 196 tests.

Ket qua:
- Duplicate upload lookup nay scope theo `organization_id`, `knowledge_scope`, `owner_user_id`; Admin library va contextual docs cua user khac khong con duoc skip/reuse cho Teacher/Student.
- URL ingestion resolve DNS va reject private/link-local/loopback/reserved/multicast/unspecified target truoc fetch va trong redirect handler.
- `generation_jobs` co `organization_id`; repository create/upload jobs ghi org; Postgres Admin list query filter `where organization_id = %s`.
- Queued PDF upload catch embedding errors va update document/job failed voi `failure_message`.
- OpenAPI create course example dung `learning_goals`.

Manual validation da huong dan user:
- Teacher/Student upload file trung voi Admin library/user khac se co contextual doc rieng, khong leak doc khac.
- Hostname resolve private IP bi reject.
- Admin khong thay generation jobs org khac.
- Embedding outage hien failed upload/job, co retry guidance qua upload lai.
- Swagger create-course example hop le.

## Files Changed

- `backend/app/main.py`
- `backend/app/jobs/schemas.py`
- `backend/app/jobs/repositories.py`
- `backend/app/openapi_contract.py`
- `backend/tests/test_knowledge_rag.py`
- `backend/tests/test_jobs_module_boundaries.py`
- `backend/tests/test_generation_jobs.py`
- `backend/tests/test_openapi_contract.py`
- `frontend/src/api/learning.ts`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/version4/PRODUCTION_GAP_ANALYSIS.md`

## Blockers / Next Step

- Khong co tai thoi diem mo feature.

## Quality Gate

- [x] Co fail-first tests cho cac finding chinh.
- [x] Fix enforce dung backend boundary.
- [x] Khong weaken auth/authorization/SSRF guard.
- [x] `./init.sh` pass.
- [x] Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`.
