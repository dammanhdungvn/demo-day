# Exec Plan - V4-007 Backend app package entrypoint slice

## Muc Tieu

- Feature: Backend app package entrypoint slice.
- User stories: `US-413`.
- Ket qua user can validate: backend van chay qua `main.py`, nhung source backend chinh da nam trong `backend/app/main.py` de slice sau tach module theo V4-004.
- Vertical slice: backend architecture setup + full regression; frontend runtime behavior khong doi.

## Scope V4-P2

- Lam:
  - Tao package `backend/app/`.
  - Di chuyen current backend monolith tu `backend/main.py` sang `backend/app/main.py`.
  - Tao root `backend/main.py` compatibility re-export tu `app.main`.
- Khong lam:
  - Khong tach route/service/repository trong feature nay.
  - Khong doi API path `/api/v1`, response schema, env var, DB schema.
  - Khong doi frontend client.
- Dependencies da xong: `V4-004`, `V4-006`.
- Source-of-truth da doc: `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, `docs/version4/USER_STORIES_V4.md`, harness docs.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker. Day la mechanical package/entrypoint slice co rollback ro.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated checks

- Baseline truoc feature: `./init.sh` da pass frontend 13 files / 57 tests + build, backend 103 tests voi 1 Starlette/httpx deprecation warning.
- Sau khi move:
  - `cd backend && uv run pytest tests/test_health.py -q`
  - `cd backend && uv run pytest -q`
  - `./init.sh`
  - `python3 -m json.tool feature_list.json`
  - `git diff --check`

### Manual validation

Steps:
1. Chay backend dev command cu: `cd backend && uv run fastapi dev main.py --host 0.0.0.0 --port 3000`.
2. Curl `http://127.0.0.1:3000/api/v1/health`.

Expected:
- Backend app load tu root `main.py` compatibility entrypoint.
- Health response khong doi.

## Implementation Plan

1. Tao `backend/app/`.
2. Move current `backend/main.py` sang `backend/app/main.py`.
3. Tao root `backend/main.py` re-export compatibility.
4. Chay backend targeted/full tests va `./init.sh`.
5. Cap nhat evidence/progress/handoff va move exec plan completed.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline truoc feature: `./init.sh` -> pass frontend 13 files / 57 tests + build, backend 103 tests, 1 Starlette/httpx deprecation warning.
- `cd backend && uv run pytest tests/test_health.py -q` -> pass 2.
- `cd backend && uv run pytest -q` -> pass 103, 1 Starlette/httpx deprecation warning.
- `cd backend && uv run python - <<'PY' ... import main ... main.health()` -> pass, health status ok.
- `cd backend && uv run fastapi dev main.py --host 127.0.0.1 --port 3001` + curl `/api/v1/health` -> pass, status ok.
- `./init.sh` -> pass frontend 13 files / 57 tests + build, backend 103 tests, 1 Starlette/httpx deprecation warning.
- `python3 -m json.tool feature_list.json` -> pass.
- `git diff --check` -> pass.

Ket qua:
- Da move backend monolith hien co sang `backend/app/main.py`.
- Da tao `backend/app/__init__.py`.
- Root `backend/main.py` la compatibility entrypoint re-export tu `app.main`.
- Khong doi route/API/env/DB schema/service behavior.

Manual validation da huong dan user:
- Backend dev command cu van chay duoc qua root `main.py`.
- Curl `http://127.0.0.1:3001/api/v1/health` tra `status: ok` trong smoke.

## Files Changed

- `feature_list.json`
- `backend/app/__init__.py`
- `backend/app/main.py`
- `backend/main.py`
- `docs/harness/exec-plans/active/V4-007-backend-app-package-entrypoint.md`
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
