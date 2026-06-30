# Observability Notes - V4-031

V4-031 tao foundation logging nhe, local-first, khong can collector ngoai. Muc tieu la giup debug nhanh: moi API request va cac workflow AI/RAG quan trong deu co log JSON co the grep theo `request_id`, `actor_id`, `generation_job_id`, `document_id` hoac `lesson_id`.

## Request Logs

Moi request qua FastAPI middleware co:

- Header response `X-Request-ID`.
- Neu client gui `X-Request-ID`, backend preserve gia tri hop le.
- Neu client khong gui, backend tao UUID moi.
- Structured log event `api.request.completed` hoac `api.request.failed`.

Fields toi thieu:

- `timestamp`
- `level`
- `event`
- `request_id`
- `method`
- `path`
- `route`
- `status_code`
- `duration_ms`
- `actor_id`, `role`, `organization_id` neu request da authenticated.

## Workflow Logs

Backend log cac event workflow P0:

- `rag.retrieval.completed`
- `rag.retrieval.rejected`
- `ai.outline_generation.started|completed|failed`
- `ai.lesson_generation.started|completed|failed`
- `ai.block_regeneration.started|completed|failed`
- `document.upload.queued|completed|failed`
- `document.web_ingested`
- `document.reindex.started|completed|failed`
- `lesson.audit_event.recorded`

Cac event nay khong log raw prompt, raw document text, password, access token, refresh token, API key hoac Authorization header. Cac key co pattern `authorization`, `password`, `secret`, `token`, `api_key`, `service_role` bi redact thanh `[REDACTED]`.

## Debug Flow

1. Lay `X-Request-ID` tu response header hoac error report.
2. Grep log theo request id:

```bash
rg '"request_id":"<request-id>"' logs-or-stdout.txt
```

3. Neu debug AI/RAG, tiep tuc grep theo `generation_job_id`, `document_id` hoac `lesson_id` tu event workflow.
4. Doi voi RAG/hallucination risk, xem:
   - `active_library_document_count`
   - `selected_contextual_document_count`
   - `candidate_document_count`
   - `retrieved_chunk_count`
   - `citation_coverage`

## Local Manual Smoke

```bash
curl -i -H 'X-Request-ID: manual-request-1' \
  http://127.0.0.1:3001/api/v1/health
```

Expected:

- Response co `X-Request-ID: manual-request-1`.
- Backend stdout co JSON event `api.request.completed`.

## Limits Con Lai

- Chua co OpenTelemetry exporter/collector.
- Chua co log shipping/SIEM.
- Chua co frontend hien request id trong error toast.
- Chua tinh token/cost that tu provider usage; hien moi log provider/model va metadata workflow.
