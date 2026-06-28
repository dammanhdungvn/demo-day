# User Stories MVP — TeachFlow AI

## 1. Scope

Tài liệu này chỉ mô tả backlog cho MVP version 1.

MVP ưu tiên hoàn thành demo flow end-to-end:

```txt
Teacher tạo course/class
→ add Student vào class
→ chọn knowledge base
→ generate outline
→ generate lesson blocks
→ review/approve
→ submit Admin
→ Admin publish
→ Student xem lesson
→ Presentation/PDF
```

Không làm P1/P2 trước khi P0 Critical chạy ổn định.

---

## 2. Priority

| Priority    | Ý nghĩa                                      |
| ----------- | -------------------------------------------- |
| P0 Critical | Bắt buộc để demo hôm nay                     |
| P1 Polish   | Làm trong 5 ngày polish hoặc sau khi P0 xong |
| P2 Future   | Không làm trong MVP                          |

---

# Epic 1 — Setup, Env, Auth

## US-001 — Project setup

**Priority:** P0 Critical
**As a** Developer/Harness Agent,
**I want** khởi tạo frontend và backend đúng stack,
**so that** dự án có nền tảng chạy được local và deploy.

### Acceptance Criteria

* Frontend dùng Vite React TSX.
* Backend dùng FastAPI.
* Backend chạy port `3000`.
* API base path là `/api/v1`.
* Frontend đọc `URL_BACKEND` từ `.env` qua abstraction/Vite config.
* Có `.env.example`.
* Không hardcode API keys.

---

## US-002 — Login theo role

**Priority:** P0 Critical
**As an** Admin, Teacher, hoặc Student,
**I want** đăng nhập và được chuyển đến đúng dashboard,
**so that** tôi chỉ dùng đúng chức năng theo role.

### Acceptance Criteria

* Có demo Admin account.
* Có demo Teacher account.
* Có demo Student account.
* User có role: `admin`, `teacher`, `student`.
* Admin vào Admin Dashboard.
* Teacher vào Teacher Dashboard.
* Student vào Student Dashboard.
* Backend kiểm tra role ở API quan trọng.

---

# Epic 2 — Course, Class, Membership

## US-003 — Teacher tạo course

**Priority:** P0 Critical
**As a** Teacher,
**I want** tạo course,
**so that** tôi quản lý bài giảng theo môn học.

### Acceptance Criteria

* Teacher nhập title.
* Teacher nhập description.
* Teacher nhập learning goals.
* Teacher chọn teaching language.
* Course thuộc Teacher hiện tại.
* Teacher xem được course của mình.

---

## US-004 — Teacher tạo class profile

**Priority:** P0 Critical
**As a** Teacher,
**I want** tạo class profile,
**so that** AI cá nhân hóa bài giảng theo lớp.

### Acceptance Criteria

* Teacher nhập class name.
* Teacher chọn student level: weak, average, strong.
* Teacher nhập background knowledge.
* Teacher nhập session count.
* Teacher nhập minutes per session.
* Teacher nhập teaching style.
* Class thuộc course.

---

## US-005 — Teacher add Student vào class

**Priority:** P0 Critical
**As a** Teacher,
**I want** add Student có sẵn vào class,
**so that** chỉ Student thuộc class mới xem được lesson của class đó.

### Acceptance Criteria

* Teacher chọn Student có sẵn.
* Teacher add Student vào class.
* Student được add thấy class.
* Student không được add không thấy class.
* Backend kiểm tra class membership.

---

# Epic 3 — Knowledge Base & RAG

## US-006 — Knowledge base đã pre-ingest trong Supabase

**Priority:** P0 Critical
**As a** System,
**I want** dùng dữ liệu sách đã pre-ingest trong Supabase,
**so that** production không cần mang `./data/books/`.

### Acceptance Criteria

* Documents tồn tại trong Supabase.
* Document chunks tồn tại trong Supabase/pgvector.
* Embeddings đã được tạo.
* Document có status.
* App production không đọc local books folder.

---

## US-007 — Teacher xem và chọn source documents

**Priority:** P0 Critical
**As a** Teacher,
**I want** xem và chọn source documents,
**so that** AI tạo bài giảng từ đúng nguồn.

### Acceptance Criteria

* UI hiển thị documents.
* Document có title, status, chunk count.
* Teacher chọn được completed documents.
* Failed/processing documents không dùng để generate.
* Nếu chưa chọn document, UI hiển thị warning.

---

## US-008 — Retrieve relevant chunks

**Priority:** P0 Critical
**As a** System,
**I want** retrieve chunks liên quan,
**so that** AI dùng context cần thiết thay vì toàn bộ tài liệu.

### Acceptance Criteria

* Retrieval nhận topic/session và selected document ids.
* Retrieval trả về top-k chunks.
* Chunk có document title, page number nếu có, excerpt.
* Retrieved context được lưu trong generation job.

---

# Epic 4 — AI Outline

## US-009 — Generate course outline

**Priority:** P0 Critical
**As a** Teacher,
**I want** generate course outline,
**so that** tôi có khung bài học theo số buổi.

### Acceptance Criteria

* Teacher chọn course, class, source documents.
* AI tạo đúng số sessions theo class profile.
* Mỗi session có title, objectives, key topics, activities, exercises.
* Có adaptation notes theo student level.
* Output validate schema.
* Output được lưu.

---

## US-010 — Review/edit outline

**Priority:** P0 Critical
**As a** Teacher,
**I want** review và chỉnh sửa outline,
**so that** tôi kiểm soát lộ trình trước khi tạo lesson chi tiết.

### Acceptance Criteria

* Teacher xem được list sessions.
* Teacher edit được title/content cơ bản.
* Teacher chọn được một session để generate lesson.
* Changes được lưu.

---

# Epic 5 — AI Lesson Blocks

## US-011 — Generate lesson blocks

**Priority:** P0 Critical
**As a** Teacher,
**I want** generate lesson blocks từ một outline session,
**so that** tôi có bài giảng chi tiết để review.

### Acceptance Criteria

* Teacher chọn outline session.
* System retrieve relevant chunks.
* AI tạo lesson blocks.
* Mỗi block có type, title, content, order_index, status.
* Block mặc định là `needs_review`.
* Output validate schema.
* Lesson không lưu thành text blob lớn.

---

## US-012 — Required block types

**Priority:** P0 Critical
**As a** Teacher,
**I want** lesson có nhiều block type,
**so that** bài giảng có giải thích, ví dụ, quiz và slide.

### Acceptance Criteria

Supported block types:

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

Demo chính cần tối thiểu:

```txt
learning_objectives
concept_explanation
analogy_or_example
quiz
slide
```

---

# Epic 6 — Citation & Warning

## US-013 — Show citations

**Priority:** P0 Critical
**As a** Teacher hoặc Admin,
**I want** xem citations của lesson block,
**so that** tôi kiểm chứng nguồn nội dung AI.

### Acceptance Criteria

* Citation gồm document title.
* Citation gồm page number nếu có.
* Citation gồm excerpt.
* Citation hiển thị trong Teacher Lesson Studio.
* Citation hiển thị trong Admin Review.

---

## US-014 — Warning for unsupported block

**Priority:** P0 Critical
**As a** Teacher hoặc Admin,
**I want** block thiếu citation được cảnh báo,
**so that** tôi biết cần kiểm duyệt kỹ.

### Acceptance Criteria

* Block thiếu citation có warning rõ.
* Teacher có thể approve_with_warning.
* Admin thấy warning.
* Warning không bị ẩn trước khi publish.

---

# Epic 7 — Teacher Lesson Studio

## US-015 — View Lesson Studio

**Priority:** P0 Critical
**As a** Teacher,
**I want** xem lesson theo block,
**so that** tôi review nhanh và rõ ràng.

### Acceptance Criteria

* Lesson Studio hiển thị block list.
* Center area hiển thị content.
* Right panel hiển thị citations.
* Có review progress.
* Có loading/empty/error state.

---

## US-016 — Edit block

**Priority:** P0 Critical
**As a** Teacher,
**I want** edit block,
**so that** tôi sửa nội dung AI cho đúng.

### Acceptance Criteria

* Teacher edit title/content.
* Save cập nhật block.
* UI hiển thị saved state.
* Không làm thay đổi các block khác.

---

## US-017 — Regenerate one block

**Priority:** P0 Critical
**As a** Teacher,
**I want** regenerate một block,
**so that** tôi không phải generate lại toàn bộ lesson.

### Acceptance Criteria

* Teacher bấm regenerate trên một block.
* System retrieve context liên quan.
* AI tạo lại block đó.
* Các block khác giữ nguyên.
* Citation cập nhật nếu có.

---

## US-018 — Approve/reject block

**Priority:** P0 Critical
**As a** Teacher,
**I want** approve hoặc reject block,
**so that** lesson có trạng thái review rõ ràng.

### Acceptance Criteria

* Teacher approve block.
* Teacher approve_with_warning block thiếu citation.
* Teacher reject block.
* Block status cập nhật.
* Review progress cập nhật.

---

## US-019 — Submit lesson to Admin

**Priority:** P0 Critical
**As a** Teacher,
**I want** submit lesson cho Admin,
**so that** nội dung được kiểm duyệt trước khi publish.

### Acceptance Criteria

* Submit chỉ cho phép khi block chính đã review.
* Lesson status đổi thành `submitted_for_admin_review`.
* Lesson xuất hiện ở Admin review queue.
* Teacher thấy trạng thái submitted.

---

# Epic 8 — Admin Moderation

## US-020 — Admin review queue

**Priority:** P0 Critical
**As an** Admin,
**I want** xem review queue,
**so that** tôi biết lesson nào đang chờ duyệt.

### Acceptance Criteria

* Admin Dashboard hiển thị submitted lessons.
* Mỗi item có lesson title, course, class, teacher.
* Có warning count nếu có.
* Admin mở được review screen.

---

## US-021 — Admin review lesson

**Priority:** P0 Critical
**As an** Admin,
**I want** xem blocks/citations/warnings,
**so that** tôi quyết định publish hay yêu cầu sửa.

### Acceptance Criteria

* Admin xem toàn bộ blocks.
* Admin xem citations.
* Admin thấy warnings.
* Admin thấy Teacher approval status.
* Admin không sửa trực tiếp content.

---

## US-022 — Admin approve & publish

**Priority:** P0 Critical
**As an** Admin,
**I want** approve & publish lesson,
**so that** Student thuộc class có thể xem.

### Acceptance Criteria

* Admin bấm Approve & Publish.
* Lesson status đổi thành `published`.
* Student thuộc class thấy lesson.
* Student ngoài class không thấy lesson.

---

## US-023 — Admin request changes

**Priority:** P0 Critical
**As an** Admin,
**I want** request changes,
**so that** Teacher chỉnh sửa lesson chưa đạt.

### Acceptance Criteria

* Admin nhập feedback.
* Lesson status đổi thành `changes_requested`.
* Teacher xem được feedback.
* Lesson không hiển thị với Student.

---

# Epic 9 — Student Access

## US-024 — Student view my classes

**Priority:** P0 Critical
**As a** Student,
**I want** xem class mình được add vào,
**so that** tôi chỉ học đúng lớp của mình.

### Acceptance Criteria

* Student Dashboard hiển thị class membership.
* Student không thấy class mình không thuộc về.
* Class hiển thị published lesson count nếu có.

---

## US-025 — Student view published lessons

**Priority:** P0 Critical
**As a** Student,
**I want** xem published lessons trong class,
**so that** tôi chỉ học nội dung đã duyệt.

### Acceptance Criteria

* Student chỉ thấy lessons `published`.
* Student chỉ thấy lessons thuộc class mình.
* Draft/submitted/rejected lessons bị ẩn.
* Direct URL access kiểm tra permission.

---

## US-026 — Student open lesson reading view

**Priority:** P0 Critical
**As a** Student,
**I want** mở lesson content,
**so that** tôi học nội dung đã duyệt.

### Acceptance Criteria

* Student xem lesson title/content.
* Blocks hiển thị reading mode.
* Không có edit/regenerate/approve controls.
* Không truy cập được nếu không thuộc class.

---

# Epic 10 — Presentation & Export

## US-027 — Web Presentation

**Priority:** P0 Critical
**As a** Teacher hoặc Student,
**I want** mở Web Presentation,
**so that** bài học có thể trình chiếu hoặc học lại bằng slide.

### Acceptance Criteria

* Presentation có next/previous.
* Có fullscreen.
* Có keyboard navigation.
* Có progress indicator.
* Layout dễ đọc.
* Student chỉ mở được presentation của published lesson thuộc class mình.

---

## US-028 — Export PDF

**Priority:** P0 Critical
**As a** Teacher hoặc Student,
**I want** export PDF,
**so that** tôi dùng bài học ngoài web app.

### Acceptance Criteria

* Có Export PDF button active.
* PDF/print layout đọc được.
* Export không crash app.
* Nếu lỗi, UI hiển thị error rõ.
* Export kiểm tra quyền truy cập.

---

# Epic 11 — UX & Reliability

## US-029 — Loading, empty, error states

**Priority:** P0 Critical
**As a** User,
**I want** thấy trạng thái rõ ràng,
**so that** tôi biết app đang xử lý hay gặp lỗi.

### Acceptance Criteria

* AI generation có loading state.
* Dashboard có empty state.
* Knowledge base có empty/failed state.
* Error message thân thiện.
* Action chính có toast success/error.

---

## US-030 — Modern SaaS UI

**Priority:** P0 Critical
**As a** demo viewer,
**I want** UI nhìn hiện đại và dễ hiểu,
**so that** sản phẩm tạo ấn tượng tốt.

### Acceptance Criteria

* Sidebar rõ ràng.
* Card layout nhất quán.
* Lesson Studio có block editor đẹp.
* Citation panel dễ đọc.
* Presentation projector-friendly.
* Animation nhẹ, không lạm dụng.

---

## US-031 — Role-based data protection

**Priority:** P0 Critical
**As a** System,
**I want** giới hạn dữ liệu theo role và class membership,
**so that** user không truy cập sai quyền.

### Acceptance Criteria

* Admin endpoints check admin role.
* Teacher endpoints check ownership.
* Student endpoints check class membership.
* Student endpoints check published status.
* Frontend không expose AI API keys.

---

# Epic 12 — P1 Polish

Các stories sau chỉ làm sau khi P0 Critical chạy ổn định.

## US-032 — Reject lesson

**Priority:** P1 Polish

Admin có thể reject lesson với lý do.

## US-033 — Markdown export

**Priority:** P1 Polish

Teacher export lesson sang Markdown.

## US-034 — PPTX Basic export

**Priority:** P1 Polish

Teacher export slide cơ bản sang PPTX.

## US-035 — Audit events đầy đủ hơn

**Priority:** P1 Polish

Lưu event chi tiết cho edit/regenerate/approve/publish.

## US-036 — Upload books UI

**Priority:** P1 Polish

Teacher/Admin upload thêm books sau MVP.

## US-037 — Incremental ingestion production-ready

**Priority:** P1 Polish

Upload document mới chỉ ingest document mới hoặc document thay đổi.

---

# Epic 13 — P2 Future

Không làm trong MVP.

## US-038 — Student AI tutor

Student hỏi đáp với AI theo lesson.

## US-039 — Adaptive learning

Cá nhân hóa theo từng Student.

## US-040 — GraphRAG / multimodal RAG

Dùng graph/multimodal RAG nâng cao.

## US-041 — YouTube/link ingestion

Ingest từ URL, YouTube, documentation site.

## US-042 — LMS features

Gradebook, điểm danh, bài nộp.

---

# P0 Critical Checklist

MVP cần hoàn thành các P0 sau:

```txt
US-001 Project setup
US-002 Login theo role
US-003 Teacher tạo course
US-004 Teacher tạo class profile
US-005 Teacher add Student vào class
US-006 Knowledge base pre-ingest Supabase
US-007 Teacher chọn source documents
US-008 Retrieve relevant chunks
US-009 Generate course outline
US-010 Review/edit outline
US-011 Generate lesson blocks
US-012 Required block types
US-013 Show citations
US-014 Warning for unsupported block
US-015 View Lesson Studio
US-016 Edit block
US-017 Regenerate one block
US-018 Approve/reject block
US-019 Submit lesson to Admin
US-020 Admin review queue
US-021 Admin review lesson
US-022 Admin approve & publish
US-023 Admin request changes
US-024 Student view my classes
US-025 Student view published lessons
US-026 Student open lesson reading view
US-027 Web Presentation
US-028 Export PDF
US-029 Loading/empty/error states
US-030 Modern SaaS UI
US-031 Role-based data protection
```

---

# Demo Flow Acceptance

MVP pass khi demo được:

```txt
Teacher login
→ Create/open course demo
→ Create/open class KTPM-K18
→ Add Student demo vào class
→ Select knowledge source
→ Generate outline
→ Select Transformer Architecture session
→ Generate lesson blocks
→ View citations
→ Edit/regenerate/approve blocks
→ Submit to Admin
→ Admin login
→ Review lesson
→ Approve & Publish
→ Student login
→ View class KTPM-K18
→ Open published lesson
→ Open Web Presentation
→ Export PDF
```
