# Exec Plan - V4-008 Backend core config extraction

## Muc Tieu

- Feature: Backend core config extraction.
- User stories: `US-413`.
- Ket qua user can validate: backend API behavior khong doi, nhung config/env helper da co boundary rieng `backend/app/core/config.py`.
- Vertical slice: backend architecture cleanup + full regression; frontend runtime behavior khong doi.

## Scope V4-P2

- Lam:
  - Tao `backend/app/core/config.py`.
  - Move config constants va helper: `API_BASE_PATH`, `APP_VERSION`, `EMBEDDING_DIMENSIONS`, rate-limit defaults, `_allowed_origins`, `_env_value`, `_env_bool`, `_env_int`, `_database_conninfo`.
  - `backend/app/main.py` import lai helper/constant va giu call sites hien co.
- Khong lam:
  - Khong tach route/service/repository.
  - Khong doi API path `/api/v1`, response schema, env var, DB schema.
  - Khong doi frontend client.
- Dependencies da xong: `V4-007`.
- Source-of-truth da doc: `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, `docs/version4/USER_STORIES_V4.md`, harness docs.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker. Day la behavior-preserving extraction.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated checks

- Baseline truoc feature: `./init.sh` da pass frontend 13 files / 57 tests + build, backend 103 tests voi 1 Starlette/httpx deprecation warning.
- Sau khi extract:
  - `cd backend && uv run pytest tests/test_health.py -q`
  - `cd backend && uv run pytest -q`
  - `./init.sh`
  - `python3 -m json.tool feature_list.json`
  - `git diff --check`

### Manual validation

Steps:
1. Chay backend dev command cu neu can.
2. Curl `/api/v1/health`.
3. Neu production env can test, xac nhan existing env names van dung: `BACKEND_CORS_ORIGINS`, `DATABASE_URL`, `SUPABASE_POOLER_CONNECTING_STRING`, `AI_ACTION_RATE_LIMIT_*`.

Expected:
- Health/API path khong doi.
- Repo restart path van pass `./init.sh`.

## Implementation Plan

1. Tao core package/config module.
2. Move helpers/constants va update imports trong `backend/app/main.py`.
3. Chay backend targeted/full tests va `./init.sh`.
4. Cap nhat evidence/progress/handoff va move exec plan completed.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline truoc feature: `./init.sh` -> pass frontend 13 files / 57 tests + build, backend 103 tests, 1 Starlette/httpx deprecation warning.
- `cd backend && uv run pytest tests/test_health.py -q` -> pass 2.
- `cd backend && uv run python - <<'PY' ...` -> pass, config defaults/origins/env_int va health ok.
- `cd backend && uv run pytest -q` -> pass 103, 1 Starlette/httpx deprecation warning.
- `./init.sh` -> pass frontend 13 files / 57 tests + build, backend 103 tests, 1 Starlette/httpx deprecation warning.
- `python3 -m json.tool feature_list.json` -> pass.
- `git diff --check` -> pass.

Ket qua:
- Da tao `backend/app/core/config.py` va `backend/app/core/__init__.py`.
- Da move config constants/env helpers/CORS origins/database conninfo ra core config.
- `backend/app/main.py` import lai helper/constant, khong con dinh nghia env reader/CORS/database conninfo truc tiep.
- Khong doi route/API/env/DB schema/service behavior.

Manual validation da huong dan user:
- Health/API path khong doi qua targeted tests va `./init.sh`.
- Existing env names van giu: `API_BASE_PATH`, `BACKEND_CORS_ORIGINS`, `SUPABASE_POOLER_CONNECTING_STRING`, `DATABASE_URL`, `SUPABASE_DIRECT_CONNECTING_STRING`, `AI_ACTION_RATE_LIMIT_*`.

## Files Changed

- `feature_list.json`
- `backend/app/core/__init__.py`
- `backend/app/core/config.py`
- `backend/app/main.py`
- `docs/harness/exec-plans/active/V4-008-backend-core-config-extraction.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`

## Blockers / Next Step

- Khong co blocker.
- Next backend slice nen tach auth hoac learning/progress modules theo `docs/version4/BACKEND_MODULARIZATION_PLAN.md`.

## Quality Gate

- [x] Khong vuot V4-P2 scope.
- [x] Co test plan truoc code.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
