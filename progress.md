# Progress - TeachFlow AI Harness

## Trang Thai Hien Tai

**Last updated:** 2026-06-28  
**Active feature tiep theo:** `P0-002 - Auth, demo accounts, role routing`
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
- Hoan thanh `P0-001`: tao `backend/` FastAPI + uv, `frontend/` Vite React TSX, health endpoint `/api/v1/health`, frontend health card, test/build baseline.
- Doi frontend env convention ve mot nguon duy nhat: root `.env` dung `URL_BACKEND`; `vite.config.ts` expose co kiem soat cho browser.
- Audit lai `.env`: `.env.example`, `init.sh`, docs va frontend config da dung dung key names hien co trong `.env`.
- Fix restartability: `init.sh` dat `UV_CACHE_DIR`/`XDG_CACHE_HOME` trong workspace va `.env.example` khai bao `BACKEND_CORS_ORIGINS` cho deploy.
- Fix backend baseline test: health pytest khong dung `TestClient.get()` de tranh treo trong `./init.sh`.

## Dang Cho Lam

- `P0-002`: Auth, demo accounts, role routing.
- Truoc khi code `P0-002`, tao exec plan moi trong `docs/harness/exec-plans/active/`, viet test plan role permission truoc, va hoi user neu demo account/auth strategy chua ro.

## Blockers / Rui Ro

- Can user cung cap hoac xac nhan demo accounts/credential strategy khi den `P0-002` neu khong du thong tin trong Supabase/Auth setup.
- Can Supabase project va knowledge base pre-ingested de hoan thanh `P0-004`.
- `README.md` dang khong phai tai lieu cua du an nay va khong duoc dung lam harness source.
- `data/books/` phai duoc giu local-only, khong commit raw PDFs/books.

## Decision Log

- **Chi P0 Critical:** P1/P2 bi khoa trong `feature_list.json` cho den khi full P0 demo pass.
- **Vertical slice bat buoc:** Moi feature phai co backend + frontend + test/test plan + manual validation.
- **Env convention:** Root `.env` dung `URL_BACKEND`. Frontend khong doc `.env` truc tiep; `vite.config.ts` chi expose backend URL can thiet qua build constant. Khong dua AI/Supabase service keys vao frontend.
- **Env required keys:** `URL_BACKEND`, `URL_SUPABASE`, `PUBLIC_API_KEY_SUPABASE`, `SECRET_API_KEY_SUPABASE`, `OPENAI_API_KEY`, `OPENAI_MODEL`.
- **Env optional deploy key:** `BACKEND_CORS_ORIGINS` de khai bao frontend origins duoc phep goi backend.
- **Test truoc code:** Neu test framework chua ton tai, exec plan phai ghi test plan truoc, sau do feature setup tao test framework phu hop.

## Evidence

- Harness files da duoc tao moi, khong ghi de artifact harness cu vi repo chua co.
- Source docs da doc: `MVP.md`, `PRD_MVP.md`, `USER_STORIES_MVP.md`.
- `./init.sh` pass: verify harness files, `feature_list.json`, `.env.example`, frontend typecheck/lint/test/build, backend pytest/compile.
- `python3 -m json.tool feature_list.json` pass.
- `git diff --check` pass.
- `node .agents/skills/harness-creator/scripts/validate-harness.mjs --target .` pass voi score `100/100`.
- Review fix: dong bo startup order giua `AGENTS.md` va `docs/harness/SOP.md`.
- Review fix: sua command path vendored skill tu `skills/harness-creator/...` sang `.agents/skills/harness-creator/...`.
- Review fix: command backend dev trong SOP dung `main.py`, khop output mac dinh cua `uv init --app`.
- Review fix: `.gitignore` ignore `data/books/` de raw source books khong vao git/deploy.
- Ap dung triết lý harness engineering theo huong lightweight: repo la system-of-record, AGENTS.md ngan, docs/harness la tai lieu sau, mechanical checks qua `init.sh`, exec plans/debt nam canh code.
- P0-001 evidence: `./init.sh` pass, frontend `typecheck/lint/test/build` pass, backend `pytest` pass, `git diff --check` pass, manual curl `/api/v1/health` tra `status: ok`.
- Env audit evidence: `.env.example` va `.env` co cung required keys; `BACKEND_CORS_ORIGINS` la deploy key optional trong `.env.example`; `./init.sh` pass sau khi them check ten bien trong `.env` that.
- Health test evidence: `timeout 30s uv run pytest -q` trong `backend/` pass `2 passed`, khong con `TestClient` trong backend tests.

## Next Session Startup

1. Doc `AGENTS.md`.
2. Chay `./init.sh`.
3. Doc `feature_list.json` va chon `P0-002`.
4. Tao mot exec plan trong `docs/harness/exec-plans/active/` theo template `docs/harness/TASK_NOTE_TEMPLATE.md`.
5. Viet test/test plan trong exec plan truoc khi code.
