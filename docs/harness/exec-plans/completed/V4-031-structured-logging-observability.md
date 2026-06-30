# Exec Plan - V4-031 Structured logging and observability foundation

## Muc Tieu

- Feature: `V4-031 Structured logging and observability foundation`
- User stories: `US-413`
- Ket qua user can validate: Moi API request co request id header va structured JSON log; logs co fields request/user/role/org/latency/status; AI/RAG/job events co event logs co sanitized metadata; khong leak secret.
- Vertical slice: backend observability foundation + tests + docs/evidence. Khong can frontend UI neu backend error response chua doi.

## Scope P0

- Lam:
  - Them request id middleware theo FastAPI middleware official pattern, header `X-Request-ID`.
  - Structured JSON logging helper co sanitize secret fields va context fields.
  - Access log fields toi thieu: timestamp, level, event, request_id, method, path, route, status_code, duration_ms.
  - Actor context neu co bearer token hop le: actor_id, role, organization_id.
  - Observability event helper cho RAG/AI/job/doc events: provider/model, job_id, document_id, lesson_id, selected/library/contextual counts, top_k, duration/citation metadata khi co.
  - Tests no-secret leakage va request id/header/log fields.
- Khong lam:
  - Khong them OpenTelemetry collector, external log backend, Sentry, Datadog.
  - Khong thay doi API behavior/response bodies tru khi can header.
  - Khong lam AI safety/eval cua V4-032.
- Dependencies da xong: `V2-005`, `V2-006`, `V2-007`, `V4-028`, `V4-030`.
- Source-of-truth da doc: `AGENTS.md`, `feature_list.json`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`, `docs/harness/RELIABILITY_SECURITY.md`, FastAPI official middleware docs.
- Khong dung: `README.md`.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Them `backend/tests/test_observability.py`.
  - Test request middleware:
    - `X-Request-ID` input duoc preserve trong response header.
    - Neu missing thi tao request id moi.
    - Structured log co request_id/method/path/status_code/duration_ms.
  - Test actor context:
    - Authenticated demo request log co actor_id, role, organization_id.
  - Test sanitization:
    - `OPENAI_API_KEY`, `Authorization`, `SECRET_API_KEY_SUPABASE`, token/password fields bi redact trong log payload nested.
  - Test AI/RAG event logger:
    - Event payload co event/job_id/document counts/top_k.
    - Secret nested payload khong leak.
- Integration:
  - `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_observability.py -q`
  - `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest -q`
  - Final `./init.sh`.

### Manual validation

1. Chay backend dev server.
2. Goi `GET /api/v1/health` voi header `X-Request-ID: manual-request-1`.
3. Xac nhan response header co cung request id.
4. Doc stdout log co JSON `event=api.request.completed`, status_code, duration_ms, path va khong leak secret.

## Implementation Plan Theo Vertical Slice

Backend:
- [x] Them module `backend/app/observability.py`.
- [x] Middleware gan request id vao `request.state.request_id`, response header, log success/error.
- [x] Helper `log_observability_event()` cho service code dung duoc sau nay.
- [x] Hook RAG retrieval path voi event log nhe sau retrieval va khi reject document set neu co.
- [x] Hook semantic logs cho document upload/web ingest/reindex, AI outline/lesson/block generation va lesson audit events.
- [x] Giữ local default lightweight, khong them dependency moi.

Docs:
- [x] Tao/cap nhat `docs/version4/OBSERVABILITY_NOTES.md`.
- [x] Update progress, handoff, feature evidence.

## Evidence Sau Khi Lam

Commands da chay:
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_observability.py -q` -> test-first fail dung ky vong truoc implementation; sau implementation 5 passed.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest -q` -> 153 passed.
- HTTP smoke local voi escalation `GET /api/v1/health`, header `X-Request-ID: manual-v4-031-json` -> 200 va response header dung.
- Server stdout co JSON event `api.request.completed` voi `request_id`, `status_code`, `duration_ms`.
- `./init.sh` -> pass; frontend 13 files/59 tests + build, backend 153 tests.

Ket qua:
- Moi request co `X-Request-ID` response header va structured JSON access log.
- Log co `request_id`, `method`, `path`, `route`, `status_code`, `duration_ms`; authenticated route co actor context.
- Contextvars cho phep service/workflow logs trong cung request tu dong co `request_id`.
- Secret/token/password/API key fields bi redact nested.
- RAG/AI/document/audit workflows co semantic event logs voi ids/counts/status/provider metadata.

Manual validation da huong dan user:
- Chay backend dev server.
- Goi `curl -i -H 'X-Request-ID: manual-request-1' http://127.0.0.1:3001/api/v1/health`.
- Xac nhan response header `X-Request-ID: manual-request-1`.
- Xac nhan stdout co JSON `api.request.completed`, `status_code`, `duration_ms`, khong co secret.

## Files Changed

- `feature_list.json`
- `backend/app/observability.py`
- `backend/app/auth/dependencies.py`
- `backend/app/main.py`
- `backend/tests/test_observability.py`
- `docs/version4/OBSERVABILITY_NOTES.md`
- `docs/harness/exec-plans/completed/V4-031-structured-logging-observability.md`

## Blockers / Next Step

- Khong co blocker hien tai.
- Next: `V4-032 AI safety and groundedness evaluation`.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co test plan truoc code.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
