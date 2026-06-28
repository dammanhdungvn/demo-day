# Reliability & Security Harness - TeachFlow AI MVP

Tài liệu này giữ các guardrails runtime và bảo mật ở mức vừa đủ cho dự án cá nhân <=100 user.

## Reliability P0

- `./init.sh` là baseline verification trước/sau task.
- `./init.sh` đặt `UV_CACHE_DIR` trong workspace để agent không phụ thuộc `$HOME` writable.
- Backend phải có `/api/v1/health`.
- Deploy phải cấu hình `BACKEND_CORS_ORIGINS` cho origin frontend thật.
- AI generation phải có loading/error state và không làm app crash khi provider lỗi.
- RAG retrieval phải xử lý empty/failed documents rõ ràng.
- Export PDF có thể dùng browser print/print layout nếu đủ validate MVP.

## Security P0

- Không commit `.env`.
- Không hardcode API keys, Supabase service role, AI provider keys.
- Frontend không chứa `SECRET_API_KEY_SUPABASE`, `OPENAI_API_KEY`, `NVIDIA_OPENAI_API_KEY`.
- Backend là nơi thực thi role permission, ownership, class membership và status checks.
- Student direct URL phải bị chặn nếu không thuộc class hoặc lesson chưa published.

## Data Handling

- `./data/books/` chỉ dùng local pre-ingest.
- Production/demo app chỉ retrieve từ Supabase.
- Không đưa raw PDFs/books vào git hoặc deploy artifact.
- Citation tối thiểu: `document_title`, `page_number` nếu có, `excerpt`, `chunk_id`.

## Mechanical Checks Nên Có Theo Thời Điểm

P0-001:

- Backend health endpoint test.
- Frontend build/typecheck.
- Guard không hardcode `localhost:3000/api/v1` trong frontend source.

P0-002 đến P0-003:

- Role permission tests.
- Teacher ownership tests.
- Class membership tests.

P0-004 đến P0-006:

- RAG retrieval returns citations.
- AI output schema validation.
- Unsupported block warning.

P0-007 đến P0-010:

- Lesson status transition tests.
- Admin publish flow.
- Student access restriction.
- PDF/presentation permission checks.

## Khi Có Shortcut

Shortcut MVP được phép nếu:

- Không làm sai business rule.
- Không làm lộ secret hoặc bypass permission.
- Có manual validation rõ.
- Được ghi vào `docs/harness/exec-plans/tech-debt-tracker.md`.
