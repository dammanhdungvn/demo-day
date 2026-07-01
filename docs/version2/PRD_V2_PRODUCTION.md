# PRD Version 2 - TeachFlow AI Production

## 1. Muc Dich

Version 2 bien TeachFlow AI tu demo MVP thanh san pham production co the dung that cho nhom nho/truong/lop hoc voi toi da 1000 active users.

Version 2 khong phai "lam them that nhieu tinh nang". Muc tieu dung hon:

```txt
V1 demo flow chay duoc
→ V2 du lieu ben vung, auth that, job lifecycle that, van hanh on dinh
→ V2 them cac tinh nang P2 version1 co do uu tien san pham ro rang
```

## 2. Product Positioning

TeachFlow AI la cong cu ho tro Teacher tao, kiem duyet va phan phoi bai giang co citation tu knowledge base.

Khach hang/user dau tien:

- Teacher ca nhan hoac nhom Teacher nho.
- Lop hoc noi bo, trung tam, truong/bo mon nho.
- Admin/academic lead can kiem duyet chat luong noi dung truoc khi Student xem.
- Student can xem bai hoc, tai lieu, presentation va duoc AI ho tro trong pham vi lesson da publish.

## 3. Van De Version 1 Can Giai Quyet

Version 1 da dat demo flow nhung con debt production:

- Demo auth/noi bo, session mat khi restart.
- Course, class, membership, outline, lesson, moderation state con in-memory.
- Audit events con in-memory.
- Upload PDF ingest dong bo trong request.
- Embedding demo/local hash chua phai semantic embedding production.
- PDF export chu yeu browser print.
- Chua co organization/workspace boundary.
- Chua co monitoring, backup, data retention, rate limit, job retry.

## 4. Muc Tieu Version 2

1. San pham dung that cho <=1000 active users.
2. Data persistence day du cho core workflow.
3. Auth va permission production-ready.
4. AI/RAG generation dang tin cay, co job status, retry va audit.
5. Knowledge ingestion co lifecycle ro rang.
6. Student co trai nghiem hoc that, khong chi la viewer demo.
7. Teacher co cong cu quan ly lop/bai hoc co the dung lap lai hang ngay.
8. Admin co moderation va operational visibility co ban.

## 5. Non-goals Version 2

Version 2 khong uu tien:

- GraphRAG production phuc tap.
- RAG multimodal nang cao.
- Multi-agent/multi-router day du.
- Collaborative editing realtime.
- Native mobile app.
- SCORM/LTI enterprise integration.
- LMS day du ngang Moodle/Canvas.
- Internet/paper research agent tu do khong co guardrail.

Nhung muc tren duoc chuyen sang version 3 neu phu hop.

## 6. Priority Model

| Priority | Y nghia |
|---|---|
| V2-P0 Production Foundation | Bat buoc de dung that, truoc khi them feature lon |
| V2-P1 High-value Product Features | Tinh nang huu ich, co the lam sau khi P0 foundation on |
| V2-P2 Production Polish / LMS Lite | Mo rong co kiem soat, khong lam thanh LMS nang |
| V3 Candidate | Huu ich nhung can usage data hoac nen tang V2 truoc |

## 7. Scope V2-P0 - Production Foundation

### 7.1 Production Auth & Organization

Bat buoc:

- Supabase Auth hoac auth production tuong duong.
- Profiles table gan role: `admin`, `teacher`, `student`.
- Organization/workspace boundary toi thieu.
- Invite user bang email hoac invite code.
- Password reset/session refresh/logout an toan.
- Backend validate JWT/session va role moi request.

Acceptance:

- Khong con demo token in-memory la auth chinh.
- User dang nhap lai sau deploy/restart van dung duoc.
- Student khong the doc lesson ngoai class bang direct URL.
- Teacher khong doc/sua course/class cua Teacher khac.

### 7.2 Database Persistence

Chuyen cac store in-memory sang Supabase/Postgres:

- `profiles`
- `organizations`
- `organization_members`
- `courses`
- `classes`
- `class_students`
- `documents`
- `document_chunks`
- `course_outlines`
- `outline_sessions`
- `lesson_sessions`
- `lesson_blocks`
- `lesson_block_citations`
- `generation_jobs`
- `audit_events`
- `exports`

Acceptance:

- Backend restart khong mat course/class/outline/lesson.
- Lesson status transition duoc luu DB.
- Audit history ton tai sau restart.
- Cac query chinh co ownership/membership guard.

### 7.3 RLS / Backend Authorization

V2 co the enforce bang backend service layer hoac ket hop RLS, nhung phai co test ro:

- Admin scoped theo organization.
- Teacher scoped theo ownership/organization.
- Student scoped theo class membership va lesson `published`.
- Document access scoped theo organization va allowed source.

Acceptance:

- Test negative cho role sai va direct id access.
- Khong expose service role key ra frontend.

### 7.4 AI & RAG Production Jobs

Tat ca action cham/ton chi phi phai co job lifecycle:

- document ingestion
- embedding generation
- outline generation
- lesson block generation
- block regeneration
- export generation neu co

Job status:

```txt
queued
processing
completed
failed
cancelled
retrying
```

Acceptance:

- UI co polling/status/error retry.
- Request khong treo lau khi upload/generate.
- Generation job luu input metadata, selected documents, model/provider, token/cost estimate neu co.
- Failed job co error message than thien va log chi tiet backend.

### 7.5 Production Embeddings & Re-index

Thay local hash embedding bang provider embedding production.

Acceptance:

- Document chunks co embedding semantic production.
- Co script/job re-index document cu.
- Retrieval evaluation smoke co expected citation chunks.
- Khong gui toan bo PDF vao prompt.

### 7.6 Knowledge Base Library

Teacher/Admin can quan ly tai lieu that:

- upload PDF
- xem status
- retry failed ingestion
- archive/deactivate document
- re-ingest document thay doi
- source metadata: title, author/publisher neu co, tags, language

Acceptance:

- Document failed khong duoc chon generate.
- Archived document khong duoc dung trong lesson moi nhung citations cu van doc duoc.

### 7.7 Observability & Operations

Toi thieu cho <=1000 users:

- request/error logging backend
- AI job logs
- basic admin ops page hoac admin endpoint
- health/readiness endpoint
- backup/restore runbook
- rate limit theo user/action cho AI-heavy endpoints

Acceptance:

- Admin/dev biet job nao failed va vi sao.
- Co cach export/backup du lieu quan trong.
- Co guard ngan user bam generate qua nhieu lan gay ton chi phi.

## 8. Scope V2-P1 - High-value Product Features

Chi lam sau khi V2-P0 core production data/auth/job on dinh.

### 8.1 Student AI Tutor - Grounded Only

Chuyen P2 version1 "Student AI tutor/chatbot" thanh tutor co guardrail:

- Chi tra loi dua tren published lesson va selected source documents.
- Moi cau tra loi co citation hoac noi ro "khong du thong tin".
- Teacher/Admin co the bat/tat tutor cho class/lesson.
- Luu chat history toi thieu cho Student.

Khong lam chatbot internet tu do trong V2.

### 8.2 Web Link / YouTube Transcript Ingestion

Chuyen P2 version1 "YouTube/link ingestion" thanh ingestion co gioi han:

- Web URL/documentation page co allowlist/robots/error handling co ban.
- YouTube chi ingest transcript/caption neu co, khong xu ly video/audio nang.
- Moi source co type, status, citation URL va extraction metadata.

### 8.3 Student Progress

De Student dung san pham that hon:

- mark lesson as started/completed
- last opened lesson
- slide/page progress
- simple notes/bookmarks tren lesson

### 8.4 Teacher Lesson Versioning

Teacher/Admin can sua lesson sau publish ma khong pha Student view:

- lesson version number
- draft revision tu published lesson
- submit revision cho Admin
- Student tiep tuc xem published version hien tai den khi revision duoc publish

## 9. Scope V2-P2 - LMS Lite / Analytics Basic

Day la ban nhe cua P2 version1 LMS features, khong phai LMS day du.

### 9.1 Assignment Lite

- Teacher tao assignment tu lesson block.
- Student nop text/file link/toi thieu.
- Teacher xem submission list va feedback.
- AI co the goi y feedback, Teacher la nguoi quyet dinh.

### 9.2 Gradebook Lite

- Manual score/comment cho assignment.
- Export CSV.
- Khong lam weighted gradebook phuc tap trong V2.

### 9.3 Attendance Lite

- Teacher mark present/absent cho session.
- Export CSV.
- Khong lam check-in realtime/geolocation.

### 9.4 Analytics Basic

- Teacher xem lesson views/completion/progress.
- Admin xem usage: users active, lessons generated, jobs failed, AI usage.
- Khong lam predictive/adaptive analytics nang trong V2.

## 10. V1 P2 Items Reclassified

Tom tat:

| V1 P2 item | V2 decision |
|---|---|
| Student AI tutor/chatbot | V2-P1 neu grounded theo lesson/citation |
| Adaptive learning | V3 candidate, V2 chi lam progress data |
| YouTube/link ingestion | V2-P1 ban gioi han transcript/web page |
| LMS gradebook/attendance/submissions | V2-P2 LMS Lite |
| Analytics dashboard advanced | V2-P2 basic, V3 advanced |
| GraphRAG/multimodal | V3 candidate |
| Multi-agent/multi-router | V3/internal candidate |
| SCORM/xAPI/LTI | V3 candidate |
| Collaborative editing realtime | V3 candidate |
| Native mobile app | Future sau V3/PWA validation |

Chi tiet nam trong `docs/version2/V1_P2_MIGRATION.md`.

## 11. Success Metrics

Production readiness:

- 0 critical secret leak.
- 0 known bypass cho role/membership.
- Backend restart khong mat core data.
- 95%+ AI jobs co final status `completed` hoac `failed` ro rang, khong treo vo thoi han.
- P95 API read endpoints < 1.5s voi dataset nho/vua.
- P95 job status polling endpoint < 500ms.
- Basic backup/restore dry-run co tai lieu.

Product usage:

- Teacher tao duoc course/class/lesson that khong can agent ho tro.
- Student co the xem lesson va resume progress.
- Admin co the review/publish/reject/revision bang UI.
- It nhat 1 loop production smoke pass: Teacher create -> Admin publish -> Student learn -> Student tutor grounded.

## 12. Release Criteria V2

V2 production release khi:

1. V2-P0 complete.
2. It nhat 1 V2-P1 feature high-value complete: Student progress hoac Student AI Tutor grounded.
3. `./init.sh` pass.
4. E2E smoke pass cho Admin/Teacher/Student.
5. Data migration/re-index runbook co trong repo.
6. Monitoring/logging/backup docs co trong repo.
7. No known P0 security/data-loss issue.
