# Exec Plan - P0-005 AI provider abstraction and course outline generation

## Muc Tieu

- Feature: `P0-005 - AI provider abstraction and course outline generation`
- User stories: `US-009`, `US-010`
- Ket qua user can validate: Teacher chon course/class/source documents, generate course outline bang AI/RAG, xem sessions, edit title/content co ban va luu.
- Vertical slice: backend AIProvider + outline API + frontend generate/review/edit + tests/manual validation.

## Scope P0

- Lam:
  - AIProvider abstraction toi thieu: `generate_structured`, `generate_text`, `embed_text` interface-ready.
  - Provider doc `OPENAI_API_KEY`, `OPENAI_MODEL` tu `.env`; khong dua key vao frontend.
  - Generate outline dung `session_count` cua class profile, co adaptation theo `student_level`.
  - Retrieve top chunks tu selected documents va dua citations/source references vao outline.
  - Validate schema truoc khi luu.
  - UI Teacher generate/review/edit sessions.
- Khong lam:
  - Lesson blocks chi tiet, Teacher approval, Admin publish, Student view.
  - Upload UI, P1/P2 export nang cao.
- Dependencies da xong: `P0-003`, `P0-004`
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

Decision 2026-06-28:
- User da cho phep dung `OPENAI_API_KEY` hien co.
- Dung OpenAI Responses API cho structured output JSON schema.
- Vi demo gap, outline persistence tam thoi theo in-memory store, phu hop debt P0-003; source docs/chunks van doc tu Supabase.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - AI output schema validation reject mismatch session count.
  - Generate outline dung course/class teacher ownership.
  - Generate outline dung selected documents va luu source references/job id.
  - Edit outline session chi cho Teacher owner va khong sua session khac.
- Frontend:
  - API client goi `/outlines/generate`, `/outlines`, `/outlines/{id}/sessions/{index}` dung URL_BACKEND va bearer token.
- Integration/e2e:
  - Live smoke neu key/model kha dung: Teacher tao course/class, chon document, generate outline 1-12 sessions.
- Security/access:
  - Student/Admin khong goi duoc Teacher outline endpoints.

### Manual validation

Prerequisite:
- P0-004 DB co completed documents.
- `.env` co `OPENAI_API_KEY`, `OPENAI_MODEL`.

Steps:
1. Login Teacher demo.
2. Tao course/class neu chua co.
3. Chon source documents trong Knowledge sources.
4. Generate outline cho topic demo.
5. Chon mot session, sua title/objectives/key topics va save.

Expected:
- Outline co dung so sessions theo class profile.
- Moi session co title, objectives, key topics, activities, exercises, adaptation notes va source references.
- UI hien loading/error state va saved state.

Negative check:
- Chua chon document thi UI canh bao.
- Student/Admin khong thay/goi duoc outline endpoints.

## Implementation Plan Theo Vertical Slice

Backend:
- Them models outline/session.
- Them AIProvider protocol + OpenAIResponsesProvider.
- Them in-memory outline store va routes generate/list/update session.
- Reuse SupabaseKnowledgeRepository retrieval P0-004.

Frontend:
- Them API client outline.
- Them section trong Teacher dashboard de generate/review/edit outline.

Tests:
- Backend service tests voi fake repository/provider.
- Frontend API tests.
- Full `./init.sh`.

Docs / Env:
- Cap nhat progress/handoff/feature evidence.
- Ghi debt neu outline store van in-memory.

## Evidence Sau Khi Lam

Commands da chay:
- `uv run pytest tests/test_ai_outline.py -q`
- `uv run pytest tests/test_knowledge_rag.py -q`
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts`
- `pnpm --dir frontend run typecheck && pnpm --dir frontend run lint && pnpm --dir frontend exec vitest run src/api/learning.test.ts && pnpm --dir frontend run build`
- `uv run pytest -q`
- Live HTTP smoke local voi OpenAI key hien co.

Ket qua:
- Backend P0-005 targeted tests: `4 passed`.
- P0-004 regression tests: `5 passed`.
- Frontend API tests: `8 passed`.
- Backend full pytest: `23 passed`.
- Frontend typecheck/lint/build pass.
- Live smoke: Teacher login 200, create course/class 200, `GET /documents` 200 count 5, `POST /outlines/generate` 200 voi 2 sessions, first session co 3 source refs, `PATCH /outlines/outline-1/sessions/1` 200.
- AI output duoc validate schema va session_count/indexes truoc khi luu.

Manual validation da huong dan user:
Prerequisite:
- Backend/frontend dang chay, `.env` co `OPENAI_API_KEY` va `OPENAI_MODEL`.
- Supabase co completed documents tu P0-004.

Steps:
1. Login Teacher demo.
2. Tao course/class hoac chon course/class hien co.
3. Chon completed source documents trong Knowledge sources.
4. Bam `Generate outline`.
5. Chon mot session, sua title/objectives/key topics va bam `Save session`.

Expected:
- Outline co dung so sessions theo class profile.
- Moi session co objectives, key topics, activities, exercises, adaptation notes va source references.
- Save session cap nhat dung session dang chon.

Negative check:
- Chua chon document/course/class thi UI hien warning/error.
- Student/Admin khong goi duoc outline endpoints.

## Files Changed

- `backend/main.py`
- `backend/tests/test_ai_outline.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `feature_list.json`
- `docs/harness/exec-plans/active/P0-005-ai-outline.md`
- `docs/harness/exec-plans/tech-debt-tracker.md`

## Blockers / Next Step

- Khong con blocker cho P0-005.
- Next: `P0-006 - Lesson blocks, required block types, citations, warnings`.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
