# Session Handoff - TeachFlow AI

## Current Objective

- **Goal:** Dung harness de trien khai MVP TeachFlow AI theo P0 Critical.
- **Current status:** Harness da duoc tao; source code app chua duoc khoi tao.
- **Next active feature:** `P0-001 - Project setup, env baseline, verification`.

## Completed This Session

- Tao root instruction file `AGENTS.md` bang tieng Viet.
- Tao `feature_list.json` tu PRD/User Stories P0 Critical.
- Tao `progress.md` voi trang thai ban dau va decision log.
- Tao `init.sh` de verify harness, env example, frontend/backend khi ton tai.
- Tao SOP va task note template trong `docs/harness/`.
- Chuan hoa `.env.example` theo TeachFlow AI.

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| Harness scaffold | `node .agents/skills/harness-creator/scripts/create-harness.mjs --target . --package-manager pnpm` | Pass | Tao file harness moi vi repo chua co artifact cu. |
| Init verification | `./init.sh` | Pass | Skip frontend/backend checks voi warning vi source app chua ton tai. |
| JSON validation | `python3 -m json.tool feature_list.json` | Pass | `feature_list.json` hop le. |
| Diff whitespace | `git diff --check` | Pass | Khong co whitespace error. |
| Harness validation | `node .agents/skills/harness-creator/scripts/validate-harness.mjs --target .` | Pass | Score `100/100`. |

## Files Changed

- `AGENTS.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `init.sh`
- `.env.example`
- `docs/harness/SOP.md`
- `docs/harness/TASK_NOTE_TEMPLATE.md`

## Decisions Made

- Dung `VITE_BACKEND_URL=http://localhost:3000/api/v1` cho frontend.
- Backend dung FastAPI + `uv`, port `3000`, base path `/api/v1`.
- P1/P2 khong duoc lam truoc khi P0 Critical pass end-to-end.
- Moi task can test/test plan truoc code va manual validation cho user.

## Blockers / Risks

- Chua co frontend/backend nen verification app-level se duoc kich hoat sau `P0-001`.
- Can Supabase credentials va data pre-ingested de hoan thanh RAG flow.
- Neu demo accounts hoac auth provider setup chua ro, agent phai hoi user truoc khi code rule.

## Next Session Startup

1. Read `AGENTS.md`.
2. Run `./init.sh`.
3. Read `feature_list.json`, `progress.md`, and this handoff.
4. Create a task note for `P0-001`.
5. Write tests/test plan before implementing setup code.

## Recommended Next Step

- Bat dau `P0-001`: tao `frontend/` bang Vite React TSX va `backend/` bang FastAPI + uv, sau do cap nhat `init.sh` neu can de chay typecheck/test/build cu the.
