# Exec Plan - P0-002 Auth, demo accounts, role routing

## Muc Tieu

- Feature: `P0-002 - Auth, demo accounts, role routing`
- User stories: `US-002`, `US-031`
- Ket qua user can validate: Admin, Teacher, Student dang nhap demo duoc, vao dung dashboard, va API protected bi chan neu sai role.
- Vertical slice: backend auth/session + role guard, frontend login/dashboard theo role, automated tests role permission, manual validation.

## Scope P0

- Lam:
  - Tao demo accounts cho 3 role `admin`, `teacher`, `student`.
  - API login/logout/me va cac endpoint protected mau de verify role guard.
  - Frontend login UI, quick demo login, redirect/render dashboard theo role.
  - Frontend an action ngoai quyen tren tung dashboard.
  - Tests cho login, `/me`, role guard backend va API client frontend.
- Khong lam:
  - Supabase Auth production integration.
  - User management, password reset, signup, invitation, audit history.
  - Course/class/RAG/Admin publish/Student lesson workflow cua P0 sau.
- Dependencies da xong: `P0-001`
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co blocker cho P0 demo auth.
- [ ] Can hoi user:

Ghi chu quyet dinh: P0-002 dung demo auth noi bo backend de dat acceptance criteria va co role guard that trong API. Neu user yeu cau Supabase Auth bat buoc cho P0-002, can doi scope va can Supabase project/credentials.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Login thanh cong voi demo account tra user role va token.
  - Login sai credential tra loi 401.
  - `/api/v1/me` can bearer token hop le.
  - Protected role endpoint cho dung role pass va sai role bi 403.
  - Token khong hop le bi 401.
- Frontend:
  - `login()` goi `/auth/login` qua `URL_BACKEND`.
  - `fetchCurrentUser()` gui bearer token den `/me`.
  - Protected endpoint client gui bearer token va surfacing error ro khi 403.
- Integration/e2e:
  - Chua them browser e2e trong P0-002; dung manual validation sau khi dev server chay.
- Security/access:
  - Khong dua API secret/Supabase service key/AI key vao frontend.
  - Backend la noi enforce role guard, khong chi an UI.

### Manual validation

Prerequisite:
- Backend chay `uv run fastapi dev main.py --host 0.0.0.0 --port 3000` trong `backend/`.
- Frontend chay `pnpm --dir frontend run dev`.
- `.env` co `URL_BACKEND=http://localhost:3000/api/v1`.

Steps:
1. Mo frontend, dang nhap bang demo Admin, xac nhan Admin Dashboard hien.
2. Logout, dang nhap demo Teacher, xac nhan Teacher Dashboard hien.
3. Logout, dang nhap demo Student, xac nhan Student Dashboard hien.

Expected:
- Moi role vao dung dashboard.
- UI hien thong tin current user va action dung role.
- Loading/empty/error state dang nhap ro rang.

Negative check:
- Goi endpoint teacher-only bang token student bi 403.
- Goi endpoint admin-only bang token teacher/student bi 403.
- Token sai hoac thieu token bi 401.

## Implementation Plan Theo Vertical Slice

Backend:
- Them user role model, demo account store, session token creation/lookup, auth dependency.
- Them routes `/api/v1/auth/demo-accounts`, `/api/v1/auth/login`, `/api/v1/me`, va protected sample endpoints theo role.

Frontend:
- Them auth API client.
- Thay health landing bang login/dashboard shell P0-002.
- Luu session token trong state/localStorage co version nho va logout.

Tests:
- Them backend auth tests.
- Them frontend auth API client tests va giu config/health tests pass.

Docs / Env:
- Cap nhat evidence trong exec plan sau khi verify.
- Ghi debt neu demo auth noi bo can thay bang Supabase Auth sau.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` truoc khi code: pass baseline.
- `env XDG_CACHE_HOME=... UV_CACHE_DIR=... uv run pytest tests/test_auth.py`: 6 passed.
- `pnpm --dir frontend exec vitest run src/api/auth.test.ts`: 4 passed.
- `pnpm --dir frontend run typecheck`: pass.
- `./init.sh` sau implementation/review fixes: pass.
- Local HTTP smoke against `http://127.0.0.1:3000/api/v1`: demo accounts 200 count 3; teacher login 200; teacher dashboard 200; teacher goi admin dashboard 403; invalid token /me 401.
- Frontend dev server page load `http://127.0.0.1:5173/`: 200 va co root app.

Ket qua:
- Backend: demo accounts, login/logout/me, bearer token session, role guard dependency va protected dashboards da chay.
- Frontend: login UI, one-click demo login, session storage, role dashboard, route push theo role va guarded non-clickable out-of-role actions da chay.
- Review findings da fix: quick demo login fill password, login/logout push route, future role actions khong render thanh active button.

Manual validation da huong dan user:
- Backend dev server dang chay tai `http://localhost:3000`.
- Frontend dev server dang chay tai `http://localhost:5173/`.
- Demo password: `teachflow-demo`.
- Steps: login Admin/Teacher/Student bang account tu UI, xac nhan vao dung dashboard; logout giua moi role; negative API check da co evidence 403/401.

## Files Changed

- `backend/main.py`
- `backend/tests/test_auth.py`
- `frontend/src/api/auth.ts`
- `frontend/src/api/auth.test.ts`
- `frontend/src/auth/session.ts`
- `frontend/src/auth/session.test.ts`
- `frontend/src/auth/workspaces.ts`
- `frontend/src/auth/workspaces.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/index.html`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/harness/exec-plans/tech-debt-tracker.md`

## Blockers / Next Step

- Khong co blocker cho P0-002.
- Next: `P0-003 - Course, class profile, student membership`.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
