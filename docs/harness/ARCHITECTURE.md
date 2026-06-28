# Architecture Harness - TeachFlow AI MVP

Tài liệu này là bản đồ kiến trúc tối thiểu cho agent. Không thay thế PRD; mọi nghiệp vụ vẫn lấy từ `docs/version1`.

## Nguyên Tắc

- MVP cá nhân <=100 user: ưu tiên đơn giản, rõ boundary, dễ deploy.
- Không xây workflow engine, permission matrix phức tạp, GraphRAG, LMS, hay PDF service nặng trong P0.
- Backend là nơi giữ secrets, role checks, class membership checks, RAG retrieval và AI schema validation.
- Frontend chỉ gọi API qua `VITE_BACKEND_URL`, không chứa AI key hoặc Supabase service role key.

## Layer Dự Kiến

Frontend `frontend/`:

- Vite React TypeScript/TSX.
- UI theo workflow role: Admin, Teacher, Student.
- API client đọc `import.meta.env.VITE_BACKEND_URL`.
- State/data fetching có thể dùng TanStack Query khi bắt đầu có server state thật.

Backend `backend/`:

- FastAPI chạy port `3000`, base path `/api/v1`.
- Router chia theo domain: auth/me, courses, classes, documents, rag, outlines, lessons, lesson-blocks, admin, student, exports.
- Service layer xử lý business rules: role, ownership, membership, status transition, AI/RAG.
- Repository/client layer nói chuyện Supabase/Postgres.

AI/RAG:

- `AIProvider` abstraction tối thiểu: `generate_structured`, `generate_text`, `embed_text`.
- Retrieval chỉ lấy top-k chunks từ `document_chunks`; không gửi toàn bộ PDF vào LLM.
- Structured output phải validate schema trước khi lưu.

Data:

- Supabase Auth/Postgres/pgvector.
- Local `./data/books/` chỉ dùng pre-ingest, không commit/deploy.

## Boundary Bắt Buộc

- Student API phải check class membership và lesson status `published`.
- Teacher API phải check ownership.
- Admin API phải check role admin.
- Admin không sửa trực tiếp lesson content.
- Lesson không lưu thành một text blob lớn; dùng lesson blocks.

## Khi Cần Quyết Định Kiến Trúc

Dừng hỏi user nếu quyết định làm thay đổi:

- auth strategy hoặc demo account strategy,
- Supabase schema lớn,
- AI provider/model mặc định,
- cách publish/deploy,
- bất kỳ feature nào thuộc P1/P2.
