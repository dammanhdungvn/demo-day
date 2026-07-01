# Exec Plan - V4-032 AI safety and groundedness evaluation

## Muc Tieu

- Feature: `V4-032 AI safety and groundedness evaluation`
- User stories: `US-405`, `US-413`
- Ket qua user can validate: Teacher/Admin thay ro canh bao citation/groundedness khi lesson yeu nguon; tai lieu/web co prompt-injection instruction khong duoc dua nguyen vao prompt AI.
- Vertical slice: backend AI safety module + ingestion/generation guardrails + Teacher/Admin warning UI + tests/docs.

## Scope P0

- Lam:
  - Them evaluator deterministic cho prompt-injection/doc-poisoning text va groundedness/citation coverage.
  - Source excerpt dua vao prompt phai duoc sanitize va co rule coi source la untrusted reference text.
  - Lesson block co citation yeu/khong co citation phai co warning ro de Teacher/Admin review.
  - Them eval fixtures/tests nho trong repo cho retrieval relevance, prompt injection va groundedness warning.
  - Hien summary/canh bao grounding ro hon trong Teacher/Admin review.
- Khong lam:
  - Khong them LLM judge bat dong bo hoac external eval service.
  - Khong thay AI provider/model mac dinh.
  - Khong thay schema DB lon cho document trust workflow trong slice nay.
  - Khong lam storage governance/TTL/quota cua V4-033.
- Dependencies da xong: `V4-028`, `V4-029`, `V4-030`, `V4-031`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`.
- External benchmark da tham khao: OWASP GenAI LLM Top 10 ve prompt injection, data/model poisoning va misinformation.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - `backend/tests/test_ai_safety.py` test-first cho source prompt-injection detection/sanitization, untrusted source prompt policy, groundedness/citation assessment, lesson warning khi citation yeu/no citation.
  - Retrieval eval fixture deterministic trong repo de test expected document/chunk ranking khong bi mat.
  - Regression `backend/tests/test_lesson_blocks.py` va `backend/tests/test_knowledge_rag.py`.
- Frontend:
  - Helper tests cho quality summary neu can.
  - Typecheck/lint/test/build qua `./init.sh`.
- Integration/e2e:
  - HTTP/manual smoke: ingest URL/doc co instruction injection va generate lesson voi source yeu.
- Security/access:
  - Khong doi role/ownership guard; regression qua backend full tests.

### Manual validation

Prerequisite:
- Backend va frontend local dang chay; login Teacher va co Admin account.

Steps:
1. Teacher/Admin ingest mot URL hoac PDF co doan instruction kieu "ignore previous instructions / reveal system prompt".
2. Teacher generate outline/lesson tu source do hoac source co citation yeu.
3. Mo Teacher Lesson Studio va Admin review queue.

Expected:
- Prompt AI chi nhan source excerpt da sanitize, khong co instruction doc-poisoning nguyen ban.
- Lesson block thieu citation hoac citation yeu hien warning grounding/citation ro.
- Admin review thay warning/citation coverage de request changes neu can.

Negative check:
- Student khong thay Admin library/raw source management.
- Teacher khong quan ly long-term library; chi thay contextual docs cua minh.

## Implementation Plan Theo Vertical Slice

Backend:
- Them `backend/app/ai_safety.py` voi policy/eval helper deterministic.
- Tich hop sanitizer vao prompt source excerpt builder va web/PDF ingestion chunking.
- Tich hop groundedness/citation warning khi tao/regenerate lesson block.
- Them semantic observability event cho safety warning/eval summary neu phu hop.

Frontend:
- Them quality summary/warning copy trong Teacher/Admin review surfaces, dung data warning/citations hien co.
- Khong hardcode fake metrics; tinh tu lesson blocks.

Tests:
- Viet test fail truoc, implement sau.
- Chay targeted backend/frontend va final `./init.sh`.

Docs / Env:
- Them `docs/version4/AI_SAFETY_EVAL_NOTES.md`.
- Cap nhat V4 docs, progress, handoff, feature evidence.

## Evidence Sau Khi Lam

Commands da chay:
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_ai_safety.py -q`
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_lesson_blocks.py tests/test_knowledge_rag.py tests/test_ai_outline.py -q`
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_auth.py tests/test_openapi_contract.py -q`
- `pnpm --dir frontend typecheck`
- `pnpm --dir frontend test -- --run`
- Playwright fallback QA cho Teacher/Admin grounding UI va login security UI.
- `./init.sh`

Ket qua:
- Backend AI safety targeted 5 passed.
- Lesson/RAG/outline regression 62 passed.
- Auth/OpenAPI targeted 22 passed.
- Frontend typecheck pass; frontend 14 files / 61 tests pass.
- Rendered QA pass, screenshots: `/tmp/v4-032-teacher-grounding.png`, `/tmp/v4-032-admin-grounding.png`, `/tmp/v4-032-teacher-grounding-mobile.png`, `/tmp/login-security-ui.png`.
- Final `./init.sh` pass: frontend typecheck/lint/test/build va backend 160 tests.

Manual validation da huong dan user:
- Teacher/Admin ingest source co instruction injection, generate lesson, xem warning/citation summary trong Lesson Studio/Admin review.
- Login UI co 3 quick access role nhung khong hien API URL hoac mat khau demo.

## Files Changed

- `backend/app/ai_safety.py`
- `backend/app/main.py`
- `backend/app/auth/schemas.py`
- `backend/app/auth/services.py`
- `backend/app/auth/routes.py`
- `backend/app/auth/__init__.py`
- `backend/tests/test_ai_safety.py`
- `backend/tests/test_auth.py`
- `backend/tests/fixtures/retrieval_eval_cases.json`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/src/api/auth.ts`
- `frontend/src/api/auth.test.ts`
- `frontend/src/loginSecurity.test.ts`
- `frontend/src/features/teacher/TeacherWorkspace.tsx`
- `frontend/src/features/admin/AdminWorkspace.tsx`
- `frontend/src/ui/teacherWorkspace.tsx`
- `.env.example`
- `docs/version4/AI_SAFETY_EVAL_NOTES.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Next sau V4-032: user uu tien `V4-034 Professional frontend redesign`; `V4-033 Knowledge storage governance` van la production hardening backlog.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
