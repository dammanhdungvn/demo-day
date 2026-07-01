# AGENTS.md

Harness cho AI agent triển khai TeachFlow AI. Tài liệu nghiệp vụ, SOP, task notes và ghi chú quyết định chính phải viết bằng tiếng Việt. Tên biến, API, bảng, hàm có thể dùng tiếng Anh theo chuẩn kỹ thuật.

`README.md` không phải tài liệu của dự án TeachFlow AI hiện tại. Không dùng `README.md` để suy luận nghiệp vụ, scope, tech stack, backlog hoặc product direction.

## Startup Workflow

Before writing code, làm theo startup workflow này:

1. Đọc tài liệu version phù hợp với task:
   - Version 1/MVP history: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
   - Version 2/production conversion: `docs/version2/README.md`, `docs/version2/PRD_V2_PRODUCTION.md`, `docs/version2/USER_STORIES_V2.md`, `docs/version2/V1_P2_MIGRATION.md`
   - Version 3/growth roadmap: `docs/version3/README.md`, `docs/version3/PRD_V3_GROWTH.md`, `docs/version3/USER_STORIES_V3.md`
   - Version 4/product excellence: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`
   - Version 5/market-fit product bets: `docs/version5/README.md`, `docs/version5/PRODUCT_MARKET_REVIEW.md`
2. Nếu task không nói rõ version, đọc version mới nhất có liên quan trong `progress.md`/`session-handoff.md`; nếu vẫn mơ hồ thì hỏi user.
3. Không dùng `README.md` để suy luận nghiệp vụ, scope, tech stack, backlog hoặc product direction.
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
- Với version 1, P0/P1 lock trong `docs/version1` vẫn là lịch sử MVP đã hoàn thành.
- Với version 2/3/4, dùng priority trong `docs/version2`, `docs/version3` hoặc `docs/version4`; trước khi code phải tạo/cập nhật backlog tương ứng thay vì tự suy đoán từ version 1.
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
- Frontend đọc API base từ `URL_BACKEND` trong `.env` qua abstraction/Vite config. Không hardcode `localhost:3000/api/v1` trong source frontend.
- API keys, Supabase keys, AI provider keys, backend URL luôn đọc từ `.env` hoặc `.env.example`.
- Frontend không được chứa `OPENAI_API_KEY`, `NVIDIA_OPENAI_API_KEY`, `SECRET_API_KEY_SUPABASE`.
- `./data/books/` chỉ dùng local pre-ingest. Không commit raw PDFs/books, không deploy folder này.

## Before Coding Any Task

1. Chọn đúng một feature `not-started` hoặc `in-progress` trong `feature_list.json` có dependencies đã xong.
2. Tạo hoặc cập nhật exec plan trong `docs/harness/exec-plans/active/` theo `docs/harness/TASK_NOTE_TEMPLATE.md`.
3. Viết unit test, integration test, hoặc test plan trước khi code. Nếu chưa có test framework, ghi test plan cụ thể trong exec plan rồi tạo test framework trong vertical slice setup.
4. Xác nhận priority/scope lock theo đúng version docs đang làm.
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
