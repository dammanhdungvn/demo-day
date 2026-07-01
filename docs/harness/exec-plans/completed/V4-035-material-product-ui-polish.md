# Exec Plan - V4-035 Material product UI polish and critical flow repair

## Muc Tieu

- Feature: V4-035 Material product UI polish and critical flow repair
- User stories: US-401, US-402, US-408, US-409, US-410, US-411
- Ket qua user can validate: giao dien TeachFlow AI professional hon, co taskbar/workspace navigation ro, upload tai lieu dung lai, Admin tao invite/account luu vao persistence va hien ma invite de user kich hoat.
- Vertical slice: frontend visual/navigation + backend auth/upload persistence repair + rendered QA + docs/evidence.

## Scope P0

- Lam:
  - Dung concept `docs/version4/assets/v4-035-material-product-polish-concept.png` lam visual reference.
  - Refine login, app shell, topbar, taskbar, panels, buttons, forms, status, list rows, Lesson Studio/Admin/Student surfaces.
  - Them taskbar workspace de user thay ngay cac khu chuc nang chinh va bam scroll/focus den dung section.
  - Sua luong runtime `.env` that: production provider/repository doc tu `.env`, quick demo login chi la cong test 3 role khi `ENABLE_DEMO_LOGIN=true`.
  - Sua Admin invite persistence khi Admin demo tao account/invite trong mode Supabase/Postgres.
  - Sua upload PDF real repository bi loi `knowledge_scope` chua duoc gan truoc khi write DB.
  - Admin UI hien invite code sau khi tao va trong danh sach pending invites; Teacher/Student upload co hint ro ket qua se hien trong danh sach nguon.
  - Chay frontend checks, backend targeted/full regression, Supabase/Postgres smoke, rendered QA va final `./init.sh`.
- Khong lam:
  - Khong hardcode secret, API URL, demo password len UI/source frontend.
  - Khong them fake metrics hoac fake workflow.
  - Khong dung `.env.example` lam runtime config; `.env.example` chi la template/checklist.
- Dependencies da xong:
  - V4-034 Professional frontend redesign
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `feature_list.json`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`, `progress.md`, `session-handoff.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] User da yeu cau khong hoi lai; tu sua theo logic product va evidence that.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend auth:
  - `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_auth.py tests/test_auth_module_boundaries.py -q`
  - Regression demo quick login van hoat dong khi `AUTH_PROVIDER=supabase` va `ENABLE_DEMO_LOGIN=true`.
  - Regression Admin invite upsert current admin profile truoc khi create invite de tranh FK/persistence fail.
- Backend knowledge/upload:
  - `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_knowledge_rag.py::test_supabase_sync_upload_path_assigns_document_scope_before_write tests/test_knowledge_rag.py::test_teacher_uploads_pdf_document_and_receives_job_status -q`
  - Real Supabase/Postgres upload smoke voi `.env` that, khong in secret.
- Frontend:
  - `pnpm --dir frontend typecheck`
  - `pnpm --dir frontend lint`
  - `pnpm --dir frontend test -- --run`
  - Rendered QA bang Playwright fallback: login, Teacher/Admin/Student desktop, Teacher mobile.
- Final:
  - `./init.sh`

### Manual validation

Prerequisite:
- Backend chay voi `.env` that: `AUTH_PROVIDER=supabase`, `AUTH_REPOSITORY=postgres`, `LEARNING_REPOSITORY=postgres`, va `ENABLE_DEMO_LOGIN=true` neu can 3 quick roles.
- Frontend chay voi `URL_BACKEND` tu env, khong hardcode backend URL trong source.

Steps:
1. Mo login, kiem tra 3 quick accounts Admin/Teacher/Student, khong thay API URL/password.
2. Login Teacher, thay taskbar workspace va bam den Roadmap/Tai lieu/RAG/Lesson Studio/Citations.
3. Upload PDF bang Teacher hoac Student, kiem tra response completed/skipped/failed va document hien lai trong danh sach nguon.
4. Login Admin, tao invite Teacher/Student, kiem tra UI hien invite code va refresh/list van con invite trong database.
5. Login Admin/Student, kiem tra surface dong bo, mobile khong overlap nghiem trong.

Expected:
- UI co app shell, topbar/taskbar va visual hierarchy professional hon; user nhin vao biet bam dau.
- Upload document khong crash backend real repository.
- Admin create invite/account co persistence va co ma invite de gui user kich hoat.

Negative check:
- Khong co text `http://127.0.0.1`, `/api/v1`, `teachflow-demo`, `OPENAI_API_KEY`, `SECRET_API_KEY_SUPABASE` tren UI.

## Implementation Plan Theo Vertical Slice

Backend:
- `backend/app/auth/services.py`: tach `ENABLE_DEMO_LOGIN` khoi `AUTH_PROVIDER`, cho demo sessions duoc resolve/logout khi Supabase provider dang bat; upsert current admin profile truoc khi create invite.
- `backend/app/main.py`: gan `knowledge_scope`/`owner_user_id` trong sync Supabase PDF upload path truoc khi write DB.
- `backend/tests/conftest.py`: isolate automated tests ve memory/demo repository de test suite khong vo tinh dung `.env` Supabase that.
- Backend tests them regression cho quick demo login voi Supabase provider, invite profile upsert va upload scope ordering.

Frontend:
- `frontend/src/App.tsx`: them workspace primary actions va `.workspace-taskbar` theo role.
- `frontend/src/App.css`: them V4-035 Material/enterprise polish cho app shell, topbar, taskbar, panels, controls, responsive va focus state.
- `frontend/src/features/admin/AdminWorkspace.tsx`: hien invite code trong success message va invite list.
- `frontend/src/features/knowledge/KnowledgeControls.tsx`: them hint upload/source refresh ro hon.

Docs / Env:
- `.env` that da them non-secret runtime mode: `LEARNING_REPOSITORY=postgres`, `AUTH_PROVIDER=supabase`, `AUTH_REPOSITORY=postgres`, `ENABLE_DEMO_LOGIN=true`.
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`.
- Move exec plan sang completed sau khi pass.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline truoc code: `./init.sh` pass.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_auth.py tests/test_auth_module_boundaries.py -q` pass: 28 tests.
- Supabase/Postgres invite smoke voi `.env` that pass: Admin demo tao invite Teacher va list lai thay invite persisted.
- Supabase/Postgres upload smoke ban dau fail `NameError: knowledge_scope is not defined`; sau fix pass voi `job_status=completed`, `knowledge_scope=contextual`, `owner_user_id=demo-teacher`, `chunk_count=1`.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_knowledge_rag.py::test_supabase_sync_upload_path_assigns_document_scope_before_write tests/test_knowledge_rag.py::test_teacher_uploads_pdf_document_and_receives_job_status -q` pass: 2 tests.
- `pnpm --dir frontend typecheck` pass.
- `pnpm --dir frontend lint` pass.
- `pnpm --dir frontend test -- --run` pass: 14 files / 61 tests.
- `cd backend && UV_CACHE_DIR=.uv-cache uv run pytest tests/test_auth.py tests/test_knowledge_rag.py -q` pass: 53 tests.
- `./init.sh` pass sau core fixes: frontend typecheck/lint/test/build pass, backend 163 tests pass.
- Playwright rendered QA fallback vi Browser plugin khong co: login mock co 3 account quick access; Teacher/Admin/Student desktop co taskbar, console issues empty, UI khong lo API URL/demo password/secret; Teacher mobile co taskbar va console issues empty. Screenshots: `/tmp/v4-035-teacher.png`, `/tmp/v4-035-admin.png`, `/tmp/v4-035-student.png`, `/tmp/v4-035-login-mobile.png`, `/tmp/v4-035-teacher-mobile.png`.

Manual validation da huong dan user:
- Login 3 role quick access, Teacher upload PDF, Admin tao invite va copy invite code, Student/Teacher upload contextual docs, kiem tra UI khong lo API URL/password.

## Files Changed

- `.env`
- `feature_list.json`
- `backend/app/auth/services.py`
- `backend/app/main.py`
- `backend/tests/conftest.py`
- `backend/tests/test_auth.py`
- `backend/tests/test_knowledge_rag.py`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/src/features/admin/AdminWorkspace.tsx`
- `frontend/src/features/knowledge/KnowledgeControls.tsx`
- `docs/harness/exec-plans/active/V4-035-material-product-ui-polish.md`
- `docs/version4/assets/v4-035-material-product-polish-concept.png`

## Blockers / Next Step

- Khong co blocker hien tai.
- Con lai: cap nhat feature/progress/handoff, final `./init.sh`, move exec plan sang completed.

## Quality Gate

- [x] Khong vuot P0 scope da chot lai theo bug user bao.
- [x] Co evidence test/regression va Supabase/Postgres smoke.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL/demo password tren UI.
- [x] Neu co shortcut/debt, khong tao debt moi; `.env.example` chi la template, `.env` that la runtime.
