# Progress - TeachFlow AI Harness

## Trang Thai Hien Tai

**Last updated:** 2026-06-28  
**Active feature tiep theo:** `P0-001 - Project setup, env baseline, verification`  
**Muc tieu:** Dung harness de AI agent trien khai MVP theo P0 Critical, khong mo rong sang P1/P2.
**Source-of-truth:** chi doc `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`; khong dung `README.md`.

## Da Hoan Thanh Trong Session Harness

- Tao `AGENTS.md` lam instruction file goc cho agent.
- Tao `feature_list.json` voi danh sach vertical slices P0, dependencies, tests va manual validation.
- Tao `init.sh` lam verification entrypoint.
- Tao `session-handoff.md` de tiep tuc session sau.
- Tao `docs/harness/SOP.md` va `docs/harness/TASK_NOTE_TEMPLATE.md`.
- Tao harness nang cao vua du cho du an nho: `ARCHITECTURE.md`, `QUALITY_SCORE.md`, `RELIABILITY_SECURITY.md`, va `exec-plans`.
- Chuan hoa `.env.example` theo bien moi truong TeachFlow AI.

## Dang Cho Lam

- `P0-001`: Khoi tao frontend Vite React TypeScript/TSX.
- `P0-001`: Khoi tao backend FastAPI bang `uv`, port `3000`, base path `/api/v1`.
- `P0-001`: Tao health endpoint, API client dung `VITE_BACKEND_URL`, va baseline tests.
- Khi bat dau `P0-001`, dung scaffold chinh thuc: `pnpm create vite frontend --template react-ts`; backend dung `uv init --app`, `uv add fastapi --extra standard`.
- Backend scaffold dung `uv run fastapi dev main.py --host 0.0.0.0 --port 3000` sau khi thay `backend/main.py` bang FastAPI app toi thieu. Khong dung `app/main.py` neu chua tao file do.

## Blockers / Rui Ro

- Chua co source code frontend/backend, nen `init.sh` hien tai chi verify harness va se skip project checks cho den khi `frontend/` va `backend/` duoc tao.
- Can user cung cap hoac xac nhan demo accounts/credential strategy khi den `P0-002` neu khong du thong tin trong Supabase/Auth setup.
- Can Supabase project va knowledge base pre-ingested de hoan thanh `P0-004`.
- `README.md` dang khong phai tai lieu cua du an nay va khong duoc dung lam harness source.
- `data/books/` phai duoc giu local-only, khong commit raw PDFs/books.

## Decision Log

- **Chi P0 Critical:** P1/P2 bi khoa trong `feature_list.json` cho den khi full P0 demo pass.
- **Vertical slice bat buoc:** Moi feature phai co backend + frontend + test/test plan + manual validation.
- **Env convention:** Frontend dung `VITE_BACKEND_URL`; backend secrets doc tu `.env`. Khong dua AI/Supabase service keys vao frontend.
- **Test truoc code:** Neu test framework chua ton tai, exec plan phai ghi test plan truoc, sau do feature setup tao test framework phu hop.

## Evidence

- Harness files da duoc tao moi, khong ghi de artifact harness cu vi repo chua co.
- Source docs da doc: `MVP.md`, `PRD_MVP.md`, `USER_STORIES_MVP.md`.
- `./init.sh` pass: verify harness files, `feature_list.json`, `.env.example`; hien warning hop le vi chua co `frontend/` va `backend/`.
- `python3 -m json.tool feature_list.json` pass.
- `git diff --check` pass.
- `node .agents/skills/harness-creator/scripts/validate-harness.mjs --target .` pass voi score `100/100`.
- Review fix: dong bo startup order giua `AGENTS.md` va `docs/harness/SOP.md`.
- Review fix: sua command path vendored skill tu `skills/harness-creator/...` sang `.agents/skills/harness-creator/...`.
- Review fix: command backend dev trong SOP dung `main.py`, khop output mac dinh cua `uv init --app`.
- Review fix: `.gitignore` ignore `data/books/` de raw source books khong vao git/deploy.
- Ap dung triết lý harness engineering theo huong lightweight: repo la system-of-record, AGENTS.md ngan, docs/harness la tai lieu sau, mechanical checks qua `init.sh`, exec plans/debt nam canh code.

## Next Session Startup

1. Doc `AGENTS.md`.
2. Chay `./init.sh`.
3. Doc `feature_list.json` va chon `P0-001`.
4. Tao mot exec plan trong `docs/harness/exec-plans/active/` theo template `docs/harness/TASK_NOTE_TEMPLATE.md`.
5. Viet test/test plan trong exec plan truoc khi code.
