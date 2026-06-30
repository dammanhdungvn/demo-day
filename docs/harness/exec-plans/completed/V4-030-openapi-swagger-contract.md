# Exec Plan - V4-030 OpenAPI and Swagger contract quality

## Muc Tieu

- Feature: `V4-030 OpenAPI and Swagger contract quality`
- User stories: `US-413`
- Ket qua user can validate: Backend expose `/api/v1/docs` va `/api/v1/openapi.json` co tag groups, auth security scheme, role/security descriptions, response schemas/examples cho endpoint chinh; QA/dev co the doc API ma khong mo code.
- Vertical slice: backend OpenAPI contract + automated contract tests + docs/evidence. Khong can frontend UI moi.

## Scope P0

- Lam:
  - Them OpenAPI metadata/tags theo module: health, auth, learning, knowledge, content, admin, student, jobs.
  - Them bearer auth security scheme vao OpenAPI va gan security cho protected endpoints, public endpoints khong yeu cau auth.
  - Them common error responses/schema cho 400/401/403/404/422/429 va response examples cho auth/invite/knowledge/learning endpoint chinh.
  - Tao API inventory doc ngan ve public/protected/role endpoints.
  - Them test OpenAPI JSON sinh duoc, tags/security scheme/path chinh/operation id unique.
- Khong lam:
  - Khong doi behavior API, route path, role policy.
  - Khong lam frontend UI cho docs.
  - Khong implement logging/observability cua V4-031.
- Dependencies da xong: `V4-028` va V4-029 foundation.
- Source-of-truth da doc: `AGENTS.md`, `feature_list.json`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, FastAPI official metadata/additional responses docs.
- Khong dung: `README.md`.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Them `backend/tests/test_openapi_contract.py`.
  - Test `/api/v1/openapi.json` duoc generate tu app route va co `info`, `tags`, `paths`.
  - Test `components.securitySchemes.BearerAuth` ton tai.
  - Test public endpoints `/api/v1/health`, `/api/v1/auth/login`, `/api/v1/auth/invites/accept` khong co security requirement.
  - Test protected endpoints chinh co `BearerAuth`: `/api/v1/me`, `/api/v1/auth/invites`, `/api/v1/documents`, `/api/v1/courses`, `/api/v1/student/lessons`, `/api/v1/generation-jobs`.
  - Test operation ids unique va route tags bat buoc ton tai.
  - Test common error response schemas duoc expose cho endpoint protected.
- Integration:
  - `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_openapi_contract.py -q`
  - `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest -q`
  - Final `./init.sh`.

### Manual validation

1. Chay backend dev server.
2. Mo `http://127.0.0.1:3001/api/v1/docs`.
3. Xac nhan tag groups ro rang, lock/auth bearer scheme co trong Swagger authorize.
4. Kiem tra `/api/v1/openapi.json` co security scheme va route examples.

## Implementation Plan Theo Vertical Slice

Backend:
- [x] Them module metadata OpenAPI `backend/app/openapi_contract.py`.
- [x] Cap nhat `FastAPI(...)` metadata trong `backend/app/main.py`.
- [x] Cap nhat OpenAPI generated contract voi `tags`, BearerAuth security, request examples va common error responses qua custom OpenAPI post-processing.
- [x] Customize `app.openapi` de gan security cho protected endpoints ma khong doi behavior route.

Docs:
- [x] Tao/cap nhat API inventory trong `docs/version4/API_CONTRACT_INVENTORY.md`.
- [x] Update progress, handoff, feature evidence.

## Evidence Sau Khi Lam

Commands da chay:
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_openapi_contract.py -q` -> test-first fail dung ky vong truoc implementation; sau implementation 4 passed.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest -q` -> 148 passed.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run python - <<'PY' ... app.openapi() ...` -> `TeachFlow AI API 41 10`, bearer.
- HTTP smoke local `/api/v1/openapi.json` va `/api/v1/docs` qua backend dev server -> 200.
- `./init.sh` -> pass; frontend 13 files/59 tests + build, backend 148 tests.

Ket qua:
- Backend OpenAPI co 10 tag groups: Health, Auth, Learning, Knowledge, AI Generation, Lessons, Admin, Teacher, Student, Jobs.
- OpenAPI components co `BearerAuth` HTTP bearer JWT.
- Public endpoints khong co security requirement; protected endpoints chinh co `security: [{"BearerAuth": []}]`.
- Endpoint chinh co request examples va common error responses.
- Operation ids unique duoc guard bang test.
- API inventory doc ghi public/protected/role endpoint groups.

Manual validation da huong dan user:
- Backend dev server: `http://127.0.0.1:3001/api/v1/docs`.
- Swagger Authorize dung bearer token dang nhap tu `/api/v1/auth/login`.
- OpenAPI JSON: `http://127.0.0.1:3001/api/v1/openapi.json`.
- Kiem tra tags/security examples/error responses trong Swagger UI.

## Files Changed

- `feature_list.json`
- `backend/app/openapi_contract.py`
- `backend/app/main.py`
- `backend/tests/test_openapi_contract.py`
- `docs/version4/API_CONTRACT_INVENTORY.md`
- `docs/harness/exec-plans/completed/V4-030-openapi-swagger-contract.md`

## Blockers / Next Step

- Khong co blocker hien tai.
- Next: `V4-031 Structured logging and observability foundation`.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co test plan truoc code.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
