# Exec Plan - V2-006 AI rate and cost guard

## Muc Tieu

- Feature: AI rate and cost guard
- User stories: `US-212`, `US-207`, `US-208`
- Ket qua user can validate: Teacher vuot limit generate se nhan cooldown/error ro, khong goi AI provider tiep.
- Vertical slice: backend env config + service guard + frontend error parsing.

## Scope P0

- Lam:
  - Them rate limit config doc tu env.
  - Guard `outline_generation`, `lesson_generation`, `block_regeneration` bang job history V2-005.
  - Tra HTTP 429 voi structured detail va `Retry-After`.
  - Frontend API client parse error detail de UI hien message cooldown.
- Khong lam:
  - Khong lam billing dashboard/usage analytics day du.
  - Khong tinh token/cost chinh xac theo provider trong slice nay.
  - Khong lam organization-wide limit truoc khi V2 production org/auth xong.
- Dependencies da xong: `V2-005`
- Source-of-truth da doc: `docs/version2/README.md`, `docs/version2/PRD_V2_PRODUCTION.md`, `docs/version2/USER_STORIES_V2.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker; org-wide limit se lam sau production org/auth.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - `tests/test_ai_rate_guard.py` kiem tra env config parse.
  - `tests/test_ai_rate_guard.py` kiem tra per-user rate guard dua tren generation jobs.
  - `tests/test_ai_rate_guard.py` kiem tra max=0 chan outline generation truoc khi AI provider duoc goi.
- Frontend:
  - `frontend/src/api/learning.test.ts` kiem tra 429 structured detail duoc parse thanh message de UI hien cooldown.
- Integration/e2e:
  - `./init.sh` full.
- Security/access:
  - Guard nam backend service layer, frontend chi hien error; khong dua secret/rate config vao frontend.

### Manual validation

Prerequisite:
- Backend local dang chay.

Steps:
1. Set `.env` hoac runtime env `AI_ACTION_RATE_LIMIT_MAX_REQUESTS=0`.
2. Restart backend.
3. Dang nhap Teacher va bam generate outline.

Expected:
- UI hien message rate limit/cooldown ro.
- Backend khong goi AI provider.

Negative check:
- Set `AI_ACTION_RATE_LIMIT_ENABLED=false` hoac limit mac dinh, restart backend, generate khong bi chan boi rate guard.

## Implementation Plan Theo Vertical Slice

Backend:
- Them config helpers `_env_int`, `_env_bool`, `AIRateLimitConfig`, `get_ai_rate_limit_config`.
- Them `enforce_ai_rate_limit` dem jobs gan day trong `GenerationJobRepository`.
- Goi guard truoc khi tao job/goi AI provider o outline/lesson/block regeneration.

Frontend:
- Cai thien `readJson` de parse `detail.message`, `retry_after_seconds` cho error responses.

Tests:
- Test-first backend/frontend.
- Chay targeted va full `./init.sh`.

Docs / Env:
- Them env keys vao `.env.example`.
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/OVERNIGHT_HANDOFF.md`.

## Evidence Sau Khi Lam

Commands da chay:
- `uv run pytest tests/test_ai_rate_guard.py -q` -> pass 3 tests.
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts` -> pass 16 tests.
- `uv run python -m compileall main.py` -> pass.
- `uv run pytest tests/test_ai_rate_guard.py tests/test_ai_outline.py tests/test_lesson_blocks.py tests/test_generation_jobs.py -q` -> pass 34 tests.
- `pnpm --dir frontend typecheck` -> pass.
- `pnpm --dir frontend lint` -> pass.
- `pnpm --dir frontend test -- --run` -> pass 12 files / 47 tests.
- `pnpm --dir frontend build` -> pass.
- `uv run pytest -q` -> pass 75 tests.
- `./init.sh` -> pass frontend 12 files/47 tests + build va backend 75 tests.

Ket qua:
- Backend co env config va rate guard per-user cho outline/lesson/block regeneration.
- Frontend API client parse structured 429/cooldown detail.

Manual validation da huong dan user:
- Huong dan trong phan Manual validation cua plan nay va `docs/OVERNIGHT_HANDOFF.md`.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V2-006-ai-rate-cost-guard.md`
- `backend/tests/test_ai_rate_guard.py`
- `backend/main.py`
- `.env.example`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`

## Blockers / Next Step

- Khong co blocker hien tai.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
