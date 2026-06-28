# Session Handoff - TeachFlow AI

## Current Objective

- **Goal:** Dung harness de trien khai MVP TeachFlow AI theo P0 Critical.
- **Current status:** Harness da duoc tao; P0-001 setup frontend/backend baseline da hoan thanh.
- **Next active feature:** `P0-002 - Auth, demo accounts, role routing`.
- **Source-of-truth:** chi `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`. Khong dung `README.md`.

## Completed This Session

- Tao root instruction file `AGENTS.md` bang tieng Viet.
- Tao `feature_list.json` tu PRD/User Stories P0 Critical.
- Tao `progress.md` voi trang thai ban dau va decision log.
- Tao `init.sh` de verify harness, env example, frontend/backend khi ton tai.
- Tao SOP va exec plan template trong `docs/harness/`.
- Tao docs harness nang cao vua du cho du an ca nhan: `ARCHITECTURE.md`, `QUALITY_SCORE.md`, `RELIABILITY_SECURITY.md`, va `docs/harness/exec-plans/`.
- Chuan hoa `.env.example` theo TeachFlow AI.
- Hoan thanh `P0-001`: backend FastAPI + uv, frontend Vite React TSX, health endpoint `/api/v1/health`, frontend health card, tests/build baseline.
- Chuan hoa frontend env: root `.env` dung `URL_BACKEND`; `vite.config.ts` expose chi backend URL can thiet cho browser.
- Audit lai env names: harness/code/docs dung key names hien co trong `.env`, va `init.sh` kiem tra `.env` theo ten bien ma khong in value.
- Fix restartability: `init.sh` dung workspace uv cache; `.env.example` co `BACKEND_CORS_ORIGINS` cho deploy frontend origin.
- Fix backend health test: baseline pytest khong dung `TestClient.get()` vi co the treo voi lock hien tai.

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| Harness scaffold | `node .agents/skills/harness-creator/scripts/create-harness.mjs --target . --package-manager pnpm` | Pass | Tao file harness moi vi repo chua co artifact cu. |
| Init verification | `./init.sh` | Pass | Chay frontend typecheck/lint/test/build va backend pytest. |
| JSON validation | `python3 -m json.tool feature_list.json` | Pass | `feature_list.json` hop le. |
| Diff whitespace | `git diff --check` | Pass | Khong co whitespace error. |
| Harness validation | `node .agents/skills/harness-creator/scripts/validate-harness.mjs --target .` | Pass | Score `100/100`. |
| P0-001 baseline | `git diff --check` | Pass | Pass sau khi doi env convention ve `URL_BACKEND`. |
| Env names | `./init.sh` | Pass | `.env.example` va `.env` deu co required keys: `URL_BACKEND`, `URL_SUPABASE`, `PUBLIC_API_KEY_SUPABASE`, `SECRET_API_KEY_SUPABASE`, `OPENAI_API_KEY`, `OPENAI_MODEL`. |
| Restartability | `./init.sh` | Pass | `UV_CACHE_DIR`/`XDG_CACHE_HOME` dat trong workspace, khong phu thuoc `$HOME/.cache/uv`. |
| Backend pytest | `timeout 30s uv run pytest -q` | Pass | `2 passed`; health test dung route registration + handler payload, khong dung `TestClient`. |

## Files Changed

- `AGENTS.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `init.sh`
- `.env.example`
- `docs/harness/SOP.md`
- `docs/harness/TASK_NOTE_TEMPLATE.md`
- `backend/`
- `frontend/`
- `docs/harness/exec-plans/completed/P0-001-project-setup.md`

## Decisions Made

- Dung mot bien env duy nhat `URL_BACKEND=http://localhost:3000/api/v1` o root `.env`; frontend nhan gia tri qua `vite.config.ts`, khong doc secret env truc tiep.
- Env canonical names theo `.env` hien tai: `URL_BACKEND`, `URL_SUPABASE`, `PUBLIC_API_KEY_SUPABASE`, `SECRET_API_KEY_SUPABASE`, `OPENAI_API_KEY`, `OPENAI_MODEL`; khong dung lai cac alias cu.
- `BACKEND_CORS_ORIGINS` la optional deploy env trong `.env.example`; cap nhat bang frontend production origin khi deploy.
- Backend dung FastAPI + `uv`, port `3000`, base path `/api/v1`.
- P0-001 scaffold phai dung docs chinh thuc: `pnpm create vite frontend --template react-ts`; backend dung `uv init --app`, `uv add fastapi --extra standard`, sau do chay `uv run fastapi dev main.py --host 0.0.0.0 --port 3000` neu giu file root `main.py`.
- P1/P2 khong duoc lam truoc khi P0 Critical pass end-to-end.
- Moi task can test/test plan truoc code va manual validation cho user.
- `data/books/` chi la local pre-ingest, khong commit/deploy raw PDFs/books.
- Repo la system-of-record: exec plans, debt, evidence phai nam trong repo thay vi chat history.

## Blockers / Risks

- Can Supabase credentials va data pre-ingested de hoan thanh RAG flow.
- Neu demo accounts hoac auth provider setup chua ro, agent phai hoi user truoc khi code rule.

## Next Session Startup

1. Read `AGENTS.md`.
2. Run `./init.sh`.
3. Read `feature_list.json`, `progress.md`, and this handoff.
4. Create one active exec plan for `P0-002` under `docs/harness/exec-plans/active/` using `docs/harness/TASK_NOTE_TEMPLATE.md`.
5. Write role-permission/auth test plan before implementing auth code.

## Recommended Next Step

- Bat dau `P0-002`: xac nhan demo account/auth strategy neu spec chua du ro, sau do lam vertical slice auth + role routing + tests.
