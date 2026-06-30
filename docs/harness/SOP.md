# SOP Harness - TeachFlow AI

SOP này hướng dẫn AI agent triển khai TeachFlow AI theo đúng tài liệu version trong `docs/version*/`. Khi có mâu thuẫn giữa SOP và đặc tả, tài liệu version đang được user yêu cầu là source-of-truth nghiệp vụ; nếu vẫn chưa rõ thì hỏi user.

`README.md` không phải source-of-truth của TeachFlow AI. Không dùng README để lấy yêu cầu sản phẩm, scope, backlog, tech stack hoặc quyết định nghiệp vụ.

## 1. Startup

1. Xác nhận đang ở root repo.
2. Đọc `AGENTS.md`.
3. Đọc tài liệu version phù hợp:
   - Version 1/MVP: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`.
   - Version 2/production: `docs/version2/README.md`, `docs/version2/PRD_V2_PRODUCTION.md`, `docs/version2/USER_STORIES_V2.md`, `docs/version2/V1_P2_MIGRATION.md`.
   - Version 3/growth: `docs/version3/README.md`, `docs/version3/PRD_V3_GROWTH.md`, `docs/version3/USER_STORIES_V3.md`.
   - Version 4/product excellence: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`.
   - Version 5/market-fit product bets: `docs/version5/README.md`, `docs/version5/PRODUCT_MARKET_REVIEW.md`.
4. Đọc `feature_list.json` để chọn đúng một feature P0 có dependency đã xong.
5. Đọc `docs/harness/SOP.md` để nắm quy trình chi tiết.
6. Đọc `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`.
7. Đọc `progress.md` và `session-handoff.md`.
8. Chạy `./init.sh` để kiểm tra baseline trước khi sửa code.
9. Tạo hoặc cập nhật exec plan trong `docs/harness/exec-plans/active/` theo `docs/harness/TASK_NOTE_TEMPLATE.md`.

Không bắt đầu code nếu chưa có test hoặc test plan cho task hiện tại.

## 1.0 Triết Lý Harness Áp Dụng Cho Dự Án Nhỏ

Dự án này là sản phẩm cá nhân/nhóm nhỏ, version 2 dự kiến không quá 1000 active users, nên không dùng harness enterprise nặng. Áp dụng vừa đủ các nguyên tắc:

- Repo là system-of-record: kế hoạch, quyết định, evidence và debt phải ghi vào repo.
- AGENTS.md là router ngắn; tài liệu sâu nằm trong `docs/harness/`.
- Kiểm tra cơ học tốt hơn trí nhớ: rule quan trọng phải được test, script hoặc checklist hóa.
- Feedback loop phục hồi: nếu task bị ngắt, agent sau đọc `progress.md`, `session-handoff.md`, exec plan active và chạy `./init.sh` để tiếp tục.
- Dọn dẹp là trách nhiệm hạng nhất: shortcut MVP được phép nếu ghi debt rõ và không phá P0 demo.

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
# Sau khi thay main.py bằng FastAPI app tối thiểu:
uv run fastapi dev main.py --host 0.0.0.0 --port 3000
```

`uv init --app` tạo `main.py` ở root `backend/`. Nếu agent muốn chuyển sang `app/main.py`, phải tạo file đó trước và cập nhật command/test tương ứng. Sau scaffold, agent phải điều chỉnh app theo PRD: backend port `3000`, API base path `/api/v1`, health endpoint `/api/v1/health`, và frontend đọc `URL_BACKEND` từ env qua `vite.config.ts`.

## 2. Quy Tắc Vertical Slice

Mỗi feature phải có đủ:

- Backend/API/service behavior nếu workflow cần backend.
- Frontend UI để user tự validate.
- Test tự động hoặc test plan rõ ràng trước khi code.
- Manual validation steps để user kiểm tra cuối cùng.
- Evidence trong `feature_list.json` hoặc `progress.md`.

Không làm riêng backend mà không có UI kiểm tra. Không làm mock UI nếu API/backend là phần cốt lõi của feature.

## 3. Scope Theo Version

Version 1 da hoan thanh P0/P1 demo/polish. Khi user yeu cau version 2, uu tien production conversion trong `docs/version2`; khi user yeu cau version 3, uu tien growth roadmap trong `docs/version3`; khi user yeu cau version 4, uu tien product excellence/design system/clean architecture trong `docs/version4` ma khong pha V1/V2/V3 guardrails.

Truoc khi code feature version 2/3/4, agent phai tao/cap nhat backlog/exec plan cho feature do. Khong lay P2 version 1 lam yeu cau truc tiep neu `docs/version2/V1_P2_MIGRATION.md` da reclassify sang V2/V3/Future.

## 3.0 UI Approval Gate

Moi khi chuyen sang code giao dien cho mot page/surface/workflow chua co concept duoc duyet, agent phai:

1. Tao image concept bang Image Gen hoac cong cu thiet ke phu hop.
2. Luu concept vao `images/` va neu la source-of-truth version thi luu them vao `docs/version4/assets/`.
3. Gui cho user duyet voi lua chon ngan gon, uu tien format `1. Duyet` / `2. Lam lai`.
4. Chi bat dau code UI sau khi user duyet. Neu user duyet kem ghi chu, agent phai ap dung ghi chu do vao implementation va evidence.

Neu page/surface da co concept duoc duyet trong repo thi duoc dung concept do lam visual spec. Khong dung screenshot/thumbnail lam UI runtime; concept chi la reference, UI phai duoc build bang React/CSS/components that.

## 3.1 Scope P0 Critical Version 1

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

Trước khi sửa code, exec plan phải có phần test plan. Nếu test framework đã tồn tại, ưu tiên viết test trước. Nếu chưa có framework, ghi test plan chi tiết rồi tạo framework trong cùng vertical slice setup.

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
- Frontend chỉ dùng `URL_BACKEND` qua abstraction đọc từ env; không tạo thêm biến duplicate nếu không cần.
- Không hardcode `localhost:3000/api/v1` trong source frontend.
- Backend đọc `BACKEND_CORS_ORIGINS` từ env để cho phép origin frontend local/deploy gọi API.
- Backend đọc Supabase/AI keys từ env.
- Frontend không chứa service role key hoặc AI provider key.
- `./data/books/` chỉ dùng local pre-ingest; raw PDFs/books không được commit và không được đưa vào deploy artifact.

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
4. Cập nhật exec plan active/completed.
5. Cập nhật `docs/harness/exec-plans/tech-debt-tracker.md` nếu có debt hoặc quyết định tạm thời.
6. Ghi rõ command verification đã chạy.
7. Nếu chưa thể hoàn thành vì thiếu thông tin, ghi câu hỏi cụ thể cho user.
