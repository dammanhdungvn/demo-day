# Exec Plan - V4-028 Knowledge library and contextual document access model

## Muc Tieu

- Feature: `V4-028 Knowledge library and contextual document access model`
- User stories: `US-405`, `US-413`
- Ket qua user can validate: Admin quan ly kho tri thuc dai han cua AI; Teacher/Student khong thay raw library management nhung van upload tai lieu ngu canh ngan han cua rieng minh; RAG/generation cua Teacher co hidden library grounding de giam hallucination.
- Vertical slice: backend access model + frontend wording/visibility + docs policy.

## Scope P0

- Lam:
  - Them scope cho document: `library` cho knowledge dai han, `contextual` cho tai lieu ngan han cua user.
  - Admin-only library management.
  - Teacher/Student contextual upload/list/archive/reindex owner-scoped.
  - Teacher RAG auto-combine hidden active library docs + selected contextual docs.
  - Cap nhat Teacher/Admin/Student UI text/flow de khong nham library voi contextual docs.
  - Cap nhat docs product review/PRD notes.
- Khong lam:
  - Chua them durable deletion TTL cho contextual docs.
  - Chua tao Student AI tutor day du.
  - Chua ingest lai toan bo local books vao Supabase trong slice nay.
- Dependencies da xong: `V4-027`.
- Source-of-truth da doc: version4 docs, backend modularization plan, current code/tests, user feedback moi.
- Khong dung: `README.md`.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Update `tests/test_knowledge_module_boundaries.py` cho `DocumentKnowledgeScope`, `owner_user_id`.
  - Update `tests/test_knowledge_rag.py` cho:
    - Admin list/upload/URL ingest tao `library`.
    - Teacher/Student upload tao `contextual`.
    - Teacher/Student khong list/archive/reindex library docs.
    - Teacher retrieval hidden library fallback khi selected contextual empty.
    - Teacher retrieval chi cho selected contextual docs cua chinh minh.
- Frontend:
  - Update API tests neu schema co field moi.
  - Update workspace tests cho wording: Admin "Kho tri thức dài hạn", Teacher/Student "Tài liệu ngữ cảnh".
- Integration/e2e:
  - `uv run pytest tests/test_knowledge_module_boundaries.py tests/test_knowledge_rag.py tests/test_ai_outline.py tests/test_lesson_blocks.py tests/test_ai_rate_guard.py -q`
  - Frontend typecheck/lint/test/build.
  - Final `./init.sh`.

### Manual validation

1. Admin upload/reindex/archive book library.
2. Teacher mo workspace: khong thay raw library list, thay contextual docs cua minh.
3. Teacher retrieve/generate khi khong chon contextual doc: backend dung active library hidden neu co.
4. Teacher upload contextual PDF, select va retrieve.
5. Student upload contextual PDF va chi thay docs cua minh.

Expected:
- Library khong bi lo thanh management surface cho Teacher/Student.
- Contextual docs khong nhap vao long-term library.
- AI generation khong mat grounding khi org co library.

## Implementation Plan Theo Vertical Slice

Backend:
- Extend schemas va Supabase document lifecycle schema.
- Add helper functions: document scope for uploader, document access filters.
- Change list/upload/URL ingest/archive/reindex/RAG retrieval access rules.
- Keep response backward-compatible by defaulting new fields.

Frontend:
- Rename Teacher surface and remove long-term management wording.
- Admin surface labels library as long-term knowledge.
- Add Student contextual document panel using existing upload/status components.

Docs:
- Update V4 product review and handoff/progress.

## Evidence Sau Khi Lam

Commands da chay:
- `pnpm --dir frontend typecheck`
- `pnpm --dir frontend test -- --run`
- `pnpm --dir frontend lint`
- `pnpm --dir frontend build`
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_knowledge_module_boundaries.py tests/test_knowledge_rag.py -q`
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_ai_outline.py tests/test_lesson_blocks.py tests/test_ai_rate_guard.py tests/test_content_persistence.py -q`
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest -q`
- Rendered QA fallback bang Playwright vi Browser plugin khong co:
  - backend QA: `BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:5174 UV_CACHE_DIR=.uv-cache uv run fastapi dev main.py --host 127.0.0.1 --port 3001`
  - frontend QA: `URL_BACKEND=http://127.0.0.1:3001/api/v1 pnpm --dir frontend run dev --host 127.0.0.1 --port 5174 --strictPort`
  - script tam `/tmp/teachflow-v4-028-qa.mjs`
- `python3 -m json.tool feature_list.json`
- `./init.sh`

Ket qua:
- Frontend typecheck/lint/build pass.
- Frontend Vitest pass 13 files / 58 tests.
- Backend targeted knowledge tests pass 34.
- Backend AI/content regression pass 36.
- Backend full pytest pass 140.
- Playwright rendered QA pass cho Student/Teacher/Admin quick-login va knowledge sections:
  - Student: `Tai lieu ngu canh ca nhan`
  - Teacher: `Tai lieu ngu canh va RAG`
  - Admin: `Kho tri thuc dai han cua AI`
  - Screenshots: `/tmp/teachflow-v4-028-student.png`, `/tmp/teachflow-v4-028-teacher.png`, `/tmp/teachflow-v4-028-admin.png`
- Final `./init.sh` pass voi frontend 13 files/58 tests + build va backend 140 tests.

Manual validation da huong dan user:
- Admin: upload/reindex/archive book vao `Kho tri thuc dai han cua AI`; Teacher/Student khong thay library list nay.
- Teacher: mo `Tai lieu ngu canh va RAG`, khong chon contextual doc van co the retrieve/generate neu organization co active library hidden; upload contextual PDF/URL thi chi hien trong Teacher context.
- Student: mo `Tai lieu ngu canh ca nhan`, upload/list/reindex/archive contextual docs cua minh; khong thay Admin library.
- Verify raw local `data/books/` khong bi xoa; folder nay chi local pre-ingest va khong commit/deploy.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/active/V4-028-knowledge-access-model.md`
- `backend/app/main.py`
- `backend/app/knowledge/__init__.py`
- `backend/app/knowledge/schemas.py`
- `backend/tests/test_knowledge_module_boundaries.py`
- `backend/tests/test_knowledge_rag.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/auth/workspaces.ts`
- `frontend/src/features/admin/AdminWorkspace.tsx`
- `frontend/src/features/knowledge/KnowledgeControls.tsx`
- `frontend/src/features/student/StudentWorkspace.tsx`
- `frontend/src/features/teacher/TeacherWorkspace.tsx`
- `frontend/src/features/teacherWorkspace.test.ts`
- `frontend/src/workspaceActionTargets.ts`
- `frontend/src/workspaceActionTargets.test.ts`
- `docs/version4/README.md`
- `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`
- `docs/version4/PRODUCT_REVIEW.md`
- `docs/version4/PRODUCTION_GAP_ANALYSIS.md`
- `AGENTS.md`
- `docs/harness/SOP.md`
- `init.sh`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Khong co blocker.
- Next: `V4-029 Auth registration and JWT lifecycle hardening` hoac `V4-030 OpenAPI and Swagger contract quality` theo `docs/version4/PRODUCTION_GAP_ANALYSIS.md`.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
