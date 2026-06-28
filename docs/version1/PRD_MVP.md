# PRD MVP — TeachFlow AI

## 1. Mục đích tài liệu

Tài liệu này là source of truth cho MVP version 1 của **TeachFlow AI**.

Mục tiêu của PRD là giúp AI/Harness/Codex triển khai đúng phạm vi, không over-engineer, không tự mở rộng feature ngoài MVP.

---

## 2. Quy tắc triển khai cho AI/Harness

## 2.1 Ngôn ngữ

Tài liệu, mô tả nghiệp vụ, task notes và comment nghiệp vụ chính viết bằng **tiếng Việt**.

Tên biến, tên API, tên bảng, tên hàm có thể dùng tiếng Anh theo chuẩn kỹ thuật.

---

## 2.2 Làm theo vertical slice

Mỗi chức năng phải làm đủ:

```txt
backend
frontend
test phù hợp
manual validation steps
```

Không làm riêng backend mà thiếu UI để validate.
Không làm mock UI mà thiếu API nếu chức năng cần backend.

---

## 2.3 Test trước khi coding task

Trước khi code task, phải viết test hoặc test plan phù hợp.

MVP không cần test quá nặng, nhưng cần kiểm chứng được logic quan trọng:

* role permission
* class membership
* RAG retrieval
* AI output schema validation
* lesson status transition
* admin publish flow
* student access restriction

---

## 2.4 Environment variables

API keys và URLs luôn đọc từ `.env`.

Không hardcode secret trong source code.

Frontend đọc:

```env
URL_BACKEND=/api/v1
BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Khi chạy local với Vite, `URL_BACKEND=/api/v1` đi qua dev proxy tới backend `127.0.0.1:3000` để tránh lỗi browser resolve `localhost` sai môi trường. Khi deploy frontend static, `URL_BACKEND` phải là public backend base URL có `/api/v1`.

Backend đọc các key từ `.env`, ví dụ:

```env
URL_SUPABASE=
PUBLIC_API_KEY_SUPABASE=
SECRET_API_KEY_SUPABASE=
OPENAI_API_KEY=
OPENAI_MODEL=
```

Khi deploy frontend lên domain thật, cập nhật `BACKEND_CORS_ORIGINS` bằng danh sách origin frontend được phép, phân tách bằng dấu phẩy.

Frontend không bao giờ chứa:

```txt
OPENAI_API_KEY
SECRET_API_KEY_SUPABASE
NVIDIA_OPENAI_API_KEY
```

---

## 2.5 Không suy đoán context

Nếu business rule chưa rõ, AI phải hỏi lại user.

Không tự thêm feature ngoài MVP.
Không tự đổi priority nếu chưa có lý do rõ.
Không triển khai P1/P2 khi P0 Critical chưa xong.

---

## 2.6 Ưu tiên open source phù hợp

Ưu tiên dùng thư viện/framework chất lượng nếu giúp giảm thời gian.

Ví dụ:

* UI: shadcn/ui, Radix UI
* styling: Tailwind CSS
* server state: TanStack Query
* form: React Hook Form + Zod
* vector DB: Supabase pgvector
* PDF extraction: thư viện PDF phù hợp
* PDF export MVP: print layout/browser print nếu đủ validate

Không đưa framework nặng vào MVP nếu làm tăng rủi ro deadline.

---

## 2.7 Không over-engineer

MVP ưu tiên hoàn thành demo flow end-to-end.

Không build:

* permission matrix phức tạp
* admin user management
* workflow engine nặng
* slide engine phức tạp
* PDF service phức tạp
* multi-agent
* GraphRAG
* LMS đầy đủ

Giải pháp đơn giản chạy được luôn được ưu tiên hơn giải pháp phức tạp nhưng chưa demo được.

---

## 3. Product Summary

TeachFlow AI là nền tảng AI giúp Teacher tạo bài giảng từ knowledge base học thuật đã pre-ingest.

Flow sản phẩm:

```txt
Teacher tạo course/class
→ add Student vào class
→ chọn source documents
→ generate outline
→ generate lesson blocks
→ review/approve
→ submit Admin
→ Admin publish
→ Student thuộc class xem lesson
```

---

## 4. Product Goals

MVP cần đạt:

1. Có link deploy chạy được.
2. Có demo accounts.
3. Có knowledge base trong Supabase.
4. Có RAG retrieval thật.
5. Có AI generation cho outline và lesson blocks.
6. Có citation/source evidence.
7. Có Teacher Lesson Studio.
8. Có Admin moderation.
9. Có Student class-based access.
10. Có Web Presentation và PDF Export.
11. UI hiện đại, rõ ràng.
12. Codebase dễ mở rộng nhưng không over-engineer.

---

## 5. Non-goals

Không làm trong MVP version 1:

* Student AI tutor
* adaptive learning
* gradebook
* điểm danh
* bài nộp
* upload YouTube/link web
* research agent
* GraphRAG production
* multi-agent/multi-router
* SCORM/xAPI/LTI
* PPTX advanced
* analytics nâng cao
* native mobile app

---

## 6. Users & Permissions

## 6.1 Admin

Admin có thể:

* xem review queue
* xem submitted lesson
* xem blocks/citations/warnings
* approve & publish
* request changes
* reject lesson nếu P1 được làm

Admin không sửa trực tiếp lesson content.

---

## 6.2 Teacher

Teacher có thể:

* tạo course
* tạo class
* add Student vào class
* chọn source documents
* generate outline
* generate lesson blocks
* edit/regenerate/approve/reject block
* approve_with_warning
* submit lesson cho Admin
* preview presentation
* export PDF

Teacher chỉ quản lý dữ liệu của mình.

---

## 6.3 Student

Student có thể:

* xem class mình được add vào
* xem published lessons thuộc class đó
* mở lesson reading view
* mở presentation
* export PDF nếu được phép

Student không được xem draft/submitted/rejected lessons.

---

## 7. Functional Requirements P0 Critical

## FR-001 — Auth & Role Routing

Hệ thống có login cơ bản cho Admin, Teacher, Student.

Acceptance Criteria:

* User login được.
* User có role.
* Redirect theo role.
* Backend kiểm tra role ở endpoint quan trọng.
* Frontend ẩn action ngoài quyền.
* Có demo accounts.

---

## FR-002 — Course Management

Teacher tạo và xem course.

Course fields tối thiểu:

```txt
id
teacher_id
title
description
learning_goals
teaching_language
created_at
updated_at
```

Acceptance Criteria:

* Teacher tạo course được.
* Course thuộc Teacher hiện tại.
* Teacher xem được course của mình.

---

## FR-003 — Class Management

Teacher tạo class profile trong course.

Class fields:

```txt
id
course_id
teacher_id
name
student_level
background_knowledge
session_count
minutes_per_session
teaching_style
created_at
updated_at
```

Acceptance Criteria:

* Teacher tạo class được.
* Class thuộc course.
* Student level gồm: weak, average, strong.
* Class profile được dùng khi generate AI.

---

## FR-004 — Class Student Membership

Teacher add Student có sẵn vào class.

Bảng tối thiểu:

```txt
class_students
  id
  class_id
  student_id
  added_by_teacher_id
  created_at
```

Acceptance Criteria:

* Teacher add Student vào class được.
* Student được add thấy class.
* Student không được add không thấy class.
* Student chỉ xem lessons published của class mình.

---

## FR-005 — Knowledge Base Pre-ingested

Production không đọc `./data/books/`.

Knowledge base phải có sẵn trong Supabase trước deploy.

Documents:

```txt
id
title
file_name
file_hash
source_type
status
chunk_count
last_ingested_at
error_message
created_at
updated_at
```

Document chunks:

```txt
id
document_id
content
page_number
chunk_index
embedding
metadata
created_at
```

Acceptance Criteria:

* Documents tồn tại trong Supabase.
* Chunks/embeddings tồn tại trong Supabase/pgvector.
* App production retrieve từ DB.
* Không cần local books folder khi deploy.

---

## FR-006 — RAG Retrieval

Backend retrieve chunks liên quan.

Acceptance Criteria:

* Input gồm topic/session và selected document ids.
* Trả về top-k chunks.
* Mỗi chunk có document title, page number nếu có, excerpt.
* Không gửi toàn bộ tài liệu vào LLM.
* Retrieved context được lưu vào generation job.

---

## FR-007 — AI Provider Abstraction

Không hardcode AI provider trong route/controller.

Interface tối thiểu:

```txt
AIProvider
  generate_structured()
  generate_text()
  embed_text()
```

Acceptance Criteria:

* Provider chọn qua `.env`.
* API key đọc từ `.env`.
* Có thể đổi provider ở một nơi.
* Frontend không chứa AI API key.

---

## FR-008 — Generate Course Outline

Teacher generate outline từ course/class/documents.

Outline session:

```txt
session_index
title
learning_objectives
key_topics
teaching_activities
suggested_exercises
adaptation_notes
source_references
```

Acceptance Criteria:

* Outline đúng `session_count`.
* Có adaptation theo `student_level`.
* Output validate schema.
* Output được lưu.
* Teacher edit outline cơ bản được.

---

## FR-009 — Generate Lesson Blocks

Teacher chọn một outline session để generate lesson.

Block types hỗ trợ:

```txt
learning_objectives
concept_explanation
analogy_or_example
code_example
teaching_activity
quiz
assignment
common_misconception
visual_diagram
slide
```

Acceptance Criteria:

* Lesson được chia thành blocks.
* Mỗi block có type, title, content, order_index, status.
* Block mặc định `needs_review`.
* Output validate schema.
* Không lưu lesson thành text blob lớn.

---

## FR-010 — Citation & Warning

Block quan trọng cần có source evidence nếu tìm được.

Citation fields:

```txt
document_title
page_number
excerpt
chunk_id
confidence
```

Acceptance Criteria:

* Citation hiển thị trong Teacher Lesson Studio.
* Citation hiển thị trong Admin Review.
* Block thiếu citation có warning.
* Teacher có thể approve_with_warning.
* Admin nhìn thấy warning trước khi publish.

---

## FR-011 — Teacher Lesson Studio

Teacher review lesson theo block.

Actions:

```txt
edit
save
regenerate
approve
approve_with_warning
reject
submit_to_admin
```

Acceptance Criteria:

* Teacher edit được block.
* Teacher regenerate một block.
* Teacher approve/reject được block.
* Review progress cập nhật.
* Không submit nếu còn block chính chưa review.

---

## FR-012 — Admin Moderation

Admin review lesson submitted.

P0 actions:

```txt
approve_and_publish
request_changes
```

P1 action:

```txt
reject
```

Acceptance Criteria:

* Admin xem blocks/citations/warnings.
* Admin approve & publish được.
* Admin request changes kèm feedback được.
* Admin không sửa trực tiếp nội dung.

---

## FR-013 — Student Published Lesson View

Student chỉ xem được published lessons thuộc class của mình.

Acceptance Criteria:

* Student thấy class mình được add vào.
* Student thấy published lessons trong class đó.
* Student không thấy draft/submitted/rejected lessons.
* Direct URL access vẫn kiểm tra quyền.

---

## FR-014 — Web Presentation

Lesson có thể mở ở presentation mode.

Acceptance Criteria:

* next/previous
* fullscreen
* keyboard navigation
* progress indicator
* layout dễ đọc trên máy chiếu
* draft preview có trạng thái rõ nếu chưa published

---

## FR-015 — PDF Export

Lesson/presentation export được PDF cơ bản.

Acceptance Criteria:

* Có Export PDF button active.
* PDF hoặc print layout đọc được.
* Export không crash app.
* Export kiểm tra quyền truy cập.
* Markdown/PPTX chưa xong thì disabled/coming soon.

---

## 8. Data Model Tối Thiểu

Các bảng chính:

```txt
profiles
courses
classes
class_students
documents
document_chunks
course_outlines
lesson_sessions
lesson_blocks
generation_jobs
moderation_events
exports
```

Lesson statuses:

```txt
draft
teacher_reviewing
submitted_for_admin_review
changes_requested
admin_rejected
published
```

Block statuses:

```txt
needs_review
teacher_approved
teacher_approved_with_warning
teacher_rejected
```

---

## 9. API Requirements

Backend chạy:

```txt
localhost:3000
```

API base:

```txt
/api/v1
```

Suggested route groups:

```txt
/auth
/me
/courses
/classes
/class-students
/documents
/rag
/outlines
/lessons
/lesson-blocks
/admin/reviews
/student/classes
/student/lessons
/exports
```

Không bắt buộc đúng tên route, nhưng domain phải rõ ràng.

---

## 10. Frontend Requirements

Stack:

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

Frontend đọc backend URL:

```ts
URL_BACKEND từ `.env` qua abstraction/Vite config
```

Không hardcode backend URL.

---

## 11. Testing Requirements

P0 test cần tập trung vào logic nguy hiểm:

* role routing
* backend role check
* class membership access
* student cannot access unrelated class lesson
* outline schema validation
* lesson schema validation
* retrieval returns citations
* admin publish changes visibility
* PDF export permission check

Không cần test mọi UI detail trong MVP.

---

## 12. Release Criteria

MVP pass khi:

1. App deploy được.
2. Demo accounts chạy được.
3. Teacher tạo/open course/class được.
4. Teacher add Student vào class được.
5. Knowledge base tồn tại trong Supabase.
6. Teacher generate outline được.
7. Teacher generate lesson blocks được.
8. Citations/warnings hiển thị.
9. Teacher review/submit được.
10. Admin approve & publish được.
11. Student trong class xem được lesson.
12. Student ngoài class không xem được lesson.
13. Web Presentation hoạt động.
14. PDF Export hoạt động.
15. UI đủ đẹp và rõ ràng.
16. Không có API key ở frontend.
