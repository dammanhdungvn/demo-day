# AGENTS.md

Harness cho AI agent triển khai MVP TeachFlow AI. Tài liệu nghiệp vụ, SOP, task notes và ghi chú quyết định chính phải viết bằng tiếng Việt. Tên biến, API, bảng, hàm có thể dùng tiếng Anh theo chuẩn kỹ thuật.

`README.md` không phải tài liệu của dự án TeachFlow AI hiện tại. Không dùng `README.md` để suy luận nghiệp vụ, scope, tech stack, backlog hoặc product direction.

## Startup Workflow

Before writing code, làm theo startup workflow này:

1. `docs/version1/MVP.md`
2. `docs/version1/PRD_MVP.md`
3. `docs/version1/USER_STORIES_MVP.md`
4. `feature_list.json`
5. `docs/harness/SOP.md`
6. `docs/harness/ARCHITECTURE.md`
7. `docs/harness/QUALITY_SCORE.md`
8. `docs/harness/RELIABILITY_SECURITY.md`
9. `progress.md`
10. Chạy `./init.sh`

Nếu tài liệu mâu thuẫn, thiếu business rule, hoặc không đủ thông tin để quyết định: dừng lại và hỏi user. Không tự bịa rule, không tự đổi scope.

## Scope Guardrails

- One feature at a time: chỉ chọn đúng một feature `not-started` hoặc `in-progress` trong `feature_list.json`.
- Stay in scope: chỉ sửa file liên quan trực tiếp đến feature đang làm.
- Chỉ làm P0 Critical cho đến khi toàn bộ P0 pass demo end-to-end.
- Không triển khai P1/P2/Future khi P0 chưa hoàn thành, kể cả khi có vẻ dễ làm.
- Ưu tiên demo flow: Teacher -> RAG -> Lesson Studio -> Admin Publish -> Student View -> Web Presentation/PDF.
- Làm từng vertical slice: backend + frontend + test/test plan + hướng dẫn validate thủ công.
- Không làm backend-only hoặc mock UI-only nếu chức năng cần cả hai để user kiểm tra.
- Ưu tiên thư viện open source chất lượng khi giúp giảm rủi ro MVP, nhưng không đưa framework nặng nếu làm chậm demo.
- Clean restart path: sau mỗi session, repo phải đủ sạch và restartable để agent kế tiếp đọc harness rồi chạy `./init.sh`.
- Repository là system-of-record: quyết định, kế hoạch, debt, evidence phải nằm trong file repo; không dựa vào lịch sử chat.
- Kiểm tra cơ học hơn trí nhớ: nếu rule quan trọng có thể test/lint/script được thì thêm vào `init.sh` hoặc test suite thay vì chỉ nhắc bằng lời.

## Tech Constraints

- Frontend: Vite + React + TypeScript/TSX. Nếu chưa có project, khởi tạo theo docs chính thức bằng `pnpm create vite frontend --template react-ts`.
- Backend + AI: FastAPI, quản lý package bằng `uv`. Nếu chưa có project, khởi tạo theo docs chính thức bằng `uv init --app` rồi `uv add fastapi --extra standard`. `uv init --app` tạo `main.py` ở root backend, nên P0-001 phải chạy dev command theo file thật hoặc cập nhật cấu trúc trước khi chạy.
- Backend chạy port `3000`, API base path `/api/v1`.
- Frontend đọc API base từ `import.meta.env.VITE_BACKEND_URL` hoặc abstraction tương đương. Không hardcode `localhost:3000/api/v1` trong source frontend.
- API keys, Supabase keys, AI provider keys, backend URL luôn đọc từ `.env` hoặc `.env.example`.
- Frontend không được chứa `AI_API_KEY`, `OPENAI_API_KEY`, `NVIDIA_OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- `./data/books/` chỉ dùng local pre-ingest. Không commit raw PDFs/books, không deploy folder này.

## Before Coding Any Task

1. Chọn đúng một feature `not-started` hoặc `in-progress` trong `feature_list.json` có dependencies đã xong.
2. Tạo hoặc cập nhật exec plan trong `docs/harness/exec-plans/active/` theo `docs/harness/TASK_NOTE_TEMPLATE.md`.
3. Viết unit test, integration test, hoặc test plan trước khi code. Nếu chưa có test framework, ghi test plan cụ thể trong exec plan rồi tạo test framework trong vertical slice setup.
4. Xác nhận P1/P2 liên quan vẫn bị khóa.
5. Kiểm tra `docs/harness/QUALITY_SCORE.md` và `docs/harness/RELIABILITY_SECURITY.md` để biết quality gate của feature.

Các phần phải test kỹ: role permission, class membership, student access restriction, RAG retrieval, AI output schema validation, lesson status transition, admin publish flow.

## Definition Of Done

Một feature chỉ được đánh dấu done khi có đủ:

- Backend/API hoặc service behavior đã chạy được nếu feature cần backend.
- Frontend UI cho user validate được nếu feature có workflow người dùng.
- Test tự động hoặc test plan đã chạy, có evidence.
- Manual validation steps rõ ràng cho user testing cuối cùng.
- Loading/empty/error state cơ bản cho flow chính liên quan.
- Không hardcode secret hoặc backend URL.
- `feature_list.json`, `progress.md`, và nếu cần `session-handoff.md` đã được cập nhật.
- Exec plan được chuyển từ `docs/harness/exec-plans/active/` sang `docs/harness/exec-plans/completed/` hoặc để lại trạng thái blocked rõ ràng.

## Verification Commands

Chạy:

```bash
./init.sh
```

Sau khi frontend/backend tồn tại, script này phải chạy các kiểm tra tương ứng. Nếu baseline fail, sửa baseline trước khi mở rộng scope.

## End Of Session

Trước khi kết thúc:

1. Cập nhật trạng thái feature và evidence trong `feature_list.json`.
2. Ghi tóm tắt vào `progress.md`.
3. Cập nhật `session-handoff.md` nếu còn việc dang dở.
4. Cập nhật `docs/harness/exec-plans/tech-debt-tracker.md` nếu có debt hoặc shortcut.
5. Ghi rõ command đã chạy và manual validation user cần thử.
