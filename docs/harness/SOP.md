# SOP Harness - TeachFlow AI MVP

SOP này hướng dẫn AI agent triển khai MVP theo đúng `docs/version1`. Khi có mâu thuẫn giữa SOP và đặc tả, đọc lại `MVP.md`, `PRD_MVP.md`, `USER_STORIES_MVP.md`; nếu vẫn chưa rõ thì hỏi user.

## 1. Startup

1. Xác nhận đang ở root repo.
2. Đọc `AGENTS.md`.
3. Đọc 3 file đặc tả trong `docs/version1/`.
4. Đọc `feature_list.json` để chọn đúng một feature P0 có dependency đã xong.
5. Đọc `docs/harness/SOP.md` để nắm quy trình chi tiết.
6. Đọc `progress.md` và `session-handoff.md`.
7. Chạy `./init.sh` để kiểm tra baseline trước khi sửa code.
8. Tạo hoặc cập nhật task note theo `docs/harness/TASK_NOTE_TEMPLATE.md`.

Không bắt đầu code nếu chưa có test hoặc test plan cho task hiện tại.

## 1.1 P0-001 Scaffold Chính Thức

Khi khởi tạo dự án, dùng command từ tài liệu chính thức, không tự dựng cấu trúc thủ công nếu chưa có lý do rõ:

- Frontend Vite React TypeScript/TSX:

```bash
pnpm create vite frontend --template react-ts
```

- Backend FastAPI quản lý bằng `uv`:

```bash
mkdir backend
cd backend
uv init --app
uv add fastapi --extra standard
uv run fastapi dev app/main.py --host 0.0.0.0 --port 3000
```

Sau scaffold, agent phải điều chỉnh app theo PRD: backend port `3000`, API base path `/api/v1`, health endpoint `/api/v1/health`, và frontend đọc `VITE_BACKEND_URL` từ env.

## 2. Quy Tắc Vertical Slice

Mỗi feature phải có đủ:

- Backend/API/service behavior nếu workflow cần backend.
- Frontend UI để user tự validate.
- Test tự động hoặc test plan rõ ràng trước khi code.
- Manual validation steps để user kiểm tra cuối cùng.
- Evidence trong `feature_list.json` hoặc `progress.md`.

Không làm riêng backend mà không có UI kiểm tra. Không làm mock UI nếu API/backend là phần cốt lõi của feature.

## 3. Scope P0 Critical

Ưu tiên flow demo:

```txt
Teacher tạo course/class
-> add Student vào class
-> chọn source documents
-> RAG retrieval
-> generate outline
-> generate lesson blocks
-> Teacher edit/regenerate/approve/submit
-> Admin review/publish
-> Student xem published lesson
-> Web Presentation/PDF
```

P1/P2 bị khóa cho đến khi toàn bộ P0 pass. Nếu task có dấu hiệu kéo sang Markdown export, PPTX, upload books UI, GraphRAG, Student AI tutor, LMS, analytics nâng cao hoặc realtime collaboration thì dừng lại và quay về P0.

## 4. Test Trước Khi Code

Trước khi sửa code, task note phải có phần test plan. Nếu test framework đã tồn tại, ưu tiên viết test trước. Nếu chưa có framework, ghi test plan chi tiết rồi tạo framework trong cùng vertical slice setup.

Các logic cần kiểm tra kỹ:

- Role permission: Admin/Teacher/Student không gọi được API ngoài quyền.
- Class membership: Student chỉ thấy class mình được add.
- Student access restriction: direct URL vẫn bị chặn nếu không thuộc class hoặc lesson chưa published.
- RAG retrieval: chỉ retrieve selected documents, trả citation metadata, không gửi toàn bộ PDF vào LLM.
- AI output schema validation: outline và lesson blocks phải validate trước khi lưu.
- Lesson status transition: draft/teacher_reviewing/submitted_for_admin_review/changes_requested/published.
- Admin publish flow: publish làm Student trong class thấy lesson, Student ngoài class không thấy.

## 5. Env Và Secrets

- `.env.example` là template; `.env` là local secret file.
- Frontend chỉ dùng `VITE_BACKEND_URL` hoặc abstraction đọc từ env.
- Không hardcode `localhost:3000/api/v1` trong source frontend.
- Backend đọc Supabase/AI keys từ env.
- Frontend không chứa service role key hoặc AI provider key.

Nếu cần key thật hoặc Supabase project chưa rõ, hỏi user. Không tự thêm key giả vào source code.

## 6. Khi Gặp Context Chưa Rõ

Dừng và hỏi user nếu:

- Business rule không có trong đặc tả.
- Đặc tả mâu thuẫn về role, status, permission hoặc data model.
- Không rõ nên dùng demo auth, Supabase Auth, seed account hay provider nào.
- Không có Supabase schema/data cần thiết cho RAG thật.
- Cần quyết định vượt P0 hoặc thay đổi priority.

Không tự suy đoán để lấp chỗ trống nghiệp vụ.

## 7. Manual Validation Format

Mỗi task phải để lại hướng dẫn user kiểm tra theo format:

```txt
Prerequisite:
- ...

Steps:
1. ...
2. ...
3. ...

Expected:
- ...

Negative check:
- ...
```

Với feature quyền truy cập, luôn có negative check cho role sai hoặc Student ngoài class.

## 8. Definition Of Done Cho Feature

Feature chỉ `done` khi:

- Acceptance criteria trong `feature_list.json` pass.
- Test/test plan đã chạy và có evidence.
- Manual validation steps rõ ràng.
- Không lộ secret, không hardcode backend URL.
- UI có loading/empty/error state cơ bản nếu feature là user workflow.
- `progress.md` và `feature_list.json` được cập nhật.

## 9. End Of Session

1. Ghi việc đã làm, việc còn lại, blockers vào `progress.md`.
2. Cập nhật status/evidence của feature trong `feature_list.json`.
3. Cập nhật `session-handoff.md` nếu còn task dang dở.
4. Ghi rõ command verification đã chạy.
5. Nếu chưa thể hoàn thành vì thiếu thông tin, ghi câu hỏi cụ thể cho user.
