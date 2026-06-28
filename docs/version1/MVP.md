# MVP — TeachFlow AI

## 1. Mục tiêu MVP

**TeachFlow AI** là nền tảng AI hỗ trợ giảng viên thiết kế bài giảng và học liệu từ tài liệu học thuật đã được đưa vào knowledge base.

MVP version 1 chỉ tập trung vào một flow demo end-to-end:

```txt
Teacher tạo course/class
→ Teacher add Student vào class
→ Teacher chọn tài liệu nguồn đã pre-ingest
→ AI tạo outline và lesson blocks bằng RAG
→ Teacher chỉnh sửa, regenerate, approve blocks
→ Teacher submit lesson cho Admin
→ Admin approve & publish
→ Student thuộc class xem lesson đã publish
→ Mở Web Presentation / Export PDF
```

Mục tiêu chính là có **link deploy chạy được**, có **RAG thật**, có **citation**, có **human-in-the-loop**, có **Admin moderation**, có **Student access theo class**, và UI đủ đẹp để demo.

---

## 2. Product Name

Tên sản phẩm chính thức:

```txt
TeachFlow AI
```

Tên mô tả:

```txt
Nền tảng AI hỗ trợ thiết kế bài giảng và học liệu cho giảng viên.
```

---

## 3. Roles trong MVP

## 3.1 Admin

Admin là người kiểm duyệt cuối cùng trước khi bài học được publish cho Student.

Admin có thể:

* xem danh sách lesson chờ duyệt
* xem nội dung lesson blocks
* xem citations/source evidence
* xem warning của block thiếu citation
* approve & publish lesson
* request changes cho Teacher

Admin **không sửa trực tiếp nội dung bài giảng**.

---

## 3.2 Teacher

Teacher là giảng viên tạo và kiểm duyệt bài giảng.

Teacher có thể:

* tạo course
* tạo class profile
* add Student có sẵn vào class
* chọn source documents từ knowledge base
* generate course outline
* generate lesson blocks
* edit block
* regenerate block
* approve block
* approve_with_warning cho block thiếu citation
* submit lesson cho Admin
* preview Web Presentation
* export PDF

---

## 3.3 Student

Student là người học.

Student có thể:

* đăng nhập bằng seeded/demo account
* xem các class mình được Teacher add vào
* xem published lessons thuộc class đó
* mở lesson reading view
* mở Web Presentation
* export/xem PDF nếu được phép

Student không được:

* xem lesson draft
* xem lesson của class mình không thuộc về
* edit/regenerate/approve lesson
* truy cập Teacher/Admin workspace

---

## 4. Scope Priority

## 4.1 P0 Critical — Bắt buộc cho MVP deploy

Chỉ làm các phần sau trước:

1. Project setup frontend + backend.
2. Đọc config từ `.env`.
3. Auth/demo accounts cho 3 role: Admin, Teacher, Student.
4. Role-based routing và backend role check cơ bản.
5. Course management tối thiểu.
6. Class management tối thiểu.
7. Teacher add Student có sẵn vào class.
8. Knowledge base đã được pre-ingest vào Supabase.
9. RAG retrieval từ `document_chunks`.
10. Generate course outline.
11. Generate lesson blocks có citations.
12. Teacher Lesson Studio: edit, regenerate, approve, approve_with_warning, submit.
13. Admin review: xem blocks/citations/warnings, approve & publish, request changes.
14. Student view: chỉ thấy published lessons thuộc class của mình.
15. Web Presentation.
16. PDF export cơ bản.
17. Loading, empty, error states cho flow chính.
18. UI hiện đại, rõ ràng, không rối.

---

## 4.2 P1 Polish — Làm sau khi P0 chạy ổn

Các phần này không được làm trước khi P0 Critical hoàn thành:

1. Markdown export.
2. PPTX Basic export.
3. Reject lesson.
4. Audit/history đầy đủ hơn.
5. Upload books UI.
6. Incremental ingestion production-ready.
7. Better PDF layout.
8. Better presentation theme.
9. Better tests.
10. UI animation/polish nâng cao.

---

## 4.3 P2 Future — Không làm trong MVP version 1

Không triển khai trong MVP:

* LMS đầy đủ
* gradebook
* điểm danh
* bài nộp sinh viên
* Student AI tutor
* Student chatbot hỏi đáp
* adaptive learning cá nhân
* YouTube/link ingestion
* internet research agent
* paper research agent
* GraphRAG production
* RAG multimodal phức tạp
* multi-agent/multi-router đầy đủ
* SCORM/xAPI/LTI
* collaborative editing realtime
* native mobile app
* analytics dashboard nâng cao

---

## 5. Knowledge Base trong MVP

Trong MVP, folder local:

```txt
./data/books/
```

chỉ dùng để **pre-ingest dữ liệu trước khi deploy**.

Khi deploy production/demo:

```txt
Không mang ./data/books/ lên server.
App deploy chỉ dùng dữ liệu đã nằm trong Supabase.
```

Pre-ingest flow:

```txt
./data/books/
→ extract text theo page
→ chunk text
→ generate embeddings
→ lưu documents vào Supabase
→ lưu document_chunks + embeddings vào Supabase/pgvector
→ production app retrieve từ database
```

Citation tối thiểu:

```txt
document_title
page_number nếu có
excerpt
chunk_id
```

---

## 6. Incremental Ingestion — Thiết kế để mở rộng sau

Sau MVP, khi upload thêm books, hệ thống không được ingest lại toàn bộ dữ liệu.

Nguyên tắc mở rộng:

```txt
document có file_hash/content_hash
file mới → chỉ ingest file mới
file cũ không đổi → skip
file cũ thay đổi → chỉ re-ingest document đó
retrieval chạy trên toàn bộ vector store hiện có
```

Trong MVP version 1, chỉ cần có data fields phù hợp như `file_hash`, `source_type`, `last_ingested_at`. Upload UI và incremental ingestion đầy đủ để P1/P2.

---

## 7. AI/RAG Scope

MVP chỉ cần RAG đơn giản nhưng chạy thật.

Flow:

```txt
Teacher chọn course/class/documents/topic
→ RetrievalService lấy top-k chunks liên quan
→ GenerationService gọi AI provider
→ AI trả structured output
→ Backend validate schema
→ Lưu outline/lesson blocks
→ UI hiển thị citations/warnings
```

Không gửi toàn bộ PDF vào prompt.

Block thiếu citation vẫn được giữ, nhưng phải có warning rõ:

```txt
Nội dung này chưa được grounding đầy đủ từ tài liệu nguồn.
```

Teacher có thể `approve_with_warning`. Admin phải nhìn thấy warning trước khi publish.

---

## 8. Export Scope

| Format           | Priority | Trạng thái                        |
| ---------------- | -------: | --------------------------------- |
| Web Presentation |       P0 | Active                            |
| PDF              |       P0 | Active                            |
| Markdown         |       P1 | Disabled/Coming soon nếu chưa làm |
| PPTX Basic       |       P1 | Disabled/Coming soon nếu chưa làm |

Không để user bấm vào chức năng chưa chạy thật.

---

## 9. UI/UX Direction

UI/UX theo phong cách:

```txt
Modern SaaS kiểu Linear/Notion
```

Yêu cầu:

* sidebar rõ ràng
* card layout
* block editor
* right panel cho citation
* typography sạch
* spacing thoáng
* loading state đẹp
* empty state có hướng dẫn
* error state dễ hiểu
* toast success/error
* animation nhẹ, không lạm dụng

Người dùng không cần hiểu RAG hay prompt engineering vẫn phải biết bước tiếp theo cần làm gì.

---

## 10. Tech Stack

Frontend:

```txt
Vite
React
TypeScript/TSX
Tailwind CSS
shadcn/ui
Radix UI
TanStack Query
React Hook Form
Zod
Sonner
Lucide Icons
Motion nếu cần
```

Backend + AI:

```txt
FastAPI
uv
Supabase Auth
Supabase Postgres
pgvector
AI Provider Abstraction
```

Backend chạy:

```txt
localhost:3000
```

API base:

```txt
/api/v1
```

Frontend đọc backend URL từ:

```env
URL_BACKEND=/api/v1
BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Ghi chú chạy local: `URL_BACKEND=/api/v1` dùng Vite dev proxy để tránh browser gọi nhầm `localhost` khi frontend được mở qua forwarded/preview URL. Khi deploy frontend static, đặt `URL_BACKEND` thành public backend base URL có `/api/v1`.

---

## 11. Demo Seed

Demo mặc định:

```txt
Course: Introduction to Artificial Intelligence
Class: KTPM-K18
Student Level: Average
Topic: Transformer Architecture
Sessions: 12
Minutes per session: 90
Language: Vietnamese hoặc Bilingual
```

Demo accounts:

```txt
Admin demo account
Teacher demo account
Student demo account
```

Student demo account phải được add vào class demo để thấy published lessons của class đó.

---

## 12. Definition of Done

MVP được xem là hoàn thành khi link deploy chạy được:

1. Admin/Teacher/Student login được.
2. Teacher tạo/open course demo được.
3. Teacher tạo/open class demo được.
4. Teacher add Student vào class được.
5. Knowledge base đã có documents/chunks/embeddings trong Supabase.
6. Teacher chọn source documents được.
7. Teacher generate outline được.
8. Teacher generate lesson blocks được.
9. Lesson blocks có citation/source evidence.
10. Block thiếu citation có warning.
11. Teacher edit/regenerate/approve/approve_with_warning được.
12. Teacher submit lesson cho Admin được.
13. Admin review citations/warnings được.
14. Admin approve & publish được.
15. Student trong class xem được published lesson.
16. Student ngoài class không xem được lesson.
17. Web Presentation hoạt động.
18. PDF Export hoạt động.
19. UI có loading/empty/error states.
20. Sản phẩm deploy ổn định qua link.
