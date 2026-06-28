# Progress - TeachFlow AI Harness

## Trang Thai Hien Tai

**Last updated:** 2026-06-28  
**Active feature tiep theo:** `P0-001 - Project setup, env baseline, verification`  
**Muc tieu:** Dung harness de AI agent trien khai MVP theo P0 Critical, khong mo rong sang P1/P2.

## Da Hoan Thanh Trong Session Harness

- Tao `AGENTS.md` lam instruction file goc cho agent.
- Tao `feature_list.json` voi danh sach vertical slices P0, dependencies, tests va manual validation.
- Tao `init.sh` lam verification entrypoint.
- Tao `session-handoff.md` de tiep tuc session sau.
- Tao `docs/harness/SOP.md` va `docs/harness/TASK_NOTE_TEMPLATE.md`.
- Chuan hoa `.env.example` theo bien moi truong TeachFlow AI.

## Dang Cho Lam

- `P0-001`: Khoi tao frontend Vite React TypeScript/TSX.
- `P0-001`: Khoi tao backend FastAPI bang `uv`, port `3000`, base path `/api/v1`.
- `P0-001`: Tao health endpoint, API client dung `VITE_BACKEND_URL`, va baseline tests.

## Blockers / Rui Ro

- Chua co source code frontend/backend, nen `init.sh` hien tai chi verify harness va se skip project checks cho den khi `frontend/` va `backend/` duoc tao.
- Can user cung cap hoac xac nhan demo accounts/credential strategy khi den `P0-002` neu khong du thong tin trong Supabase/Auth setup.
- Can Supabase project va knowledge base pre-ingested de hoan thanh `P0-004`.

## Decision Log

- **Chi P0 Critical:** P1/P2 bi khoa trong `feature_list.json` cho den khi full P0 demo pass.
- **Vertical slice bat buoc:** Moi feature phai co backend + frontend + test/test plan + manual validation.
- **Env convention:** Frontend dung `VITE_BACKEND_URL`; backend secrets doc tu `.env`. Khong dua AI/Supabase service keys vao frontend.
- **Test truoc code:** Neu test framework chua ton tai, task note phai ghi test plan truoc, sau do feature setup tao test framework phu hop.

## Evidence

- Harness files da duoc tao moi, khong ghi de artifact harness cu vi repo chua co.
- Source docs da doc: `MVP.md`, `PRD_MVP.md`, `USER_STORIES_MVP.md`.
- `./init.sh` pass: verify harness files, `feature_list.json`, `.env.example`; hien warning hop le vi chua co `frontend/` va `backend/`.
- `python3 -m json.tool feature_list.json` pass.
- `git diff --check` pass.
- `node .agents/skills/harness-creator/scripts/validate-harness.mjs --target .` pass voi score `100/100`.

## Next Session Startup

1. Doc `AGENTS.md`.
2. Chay `./init.sh`.
3. Doc `feature_list.json` va chon `P0-001`.
4. Tao task note theo `docs/harness/TASK_NOTE_TEMPLATE.md`.
5. Viet test/test plan truoc khi code.
