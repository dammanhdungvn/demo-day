# Exec Plan - BUG-001 Frontend action controls

## Muc Tieu

- Feature: sua cac control tren dashboard nhin nhu button/nav nhung khong co handler, khien user tuong frontend khong lien ket backend.
- User stories: bugfix UX cho demo flow P0/P1 da xong.
- Ket qua user can validate: Teacher/Admin/Student bam cac shortcut trong dashboard thi nhay den dung section thao tac; cac nut workflow chinh van goi API backend qua `/api/v1`.
- Vertical slice: frontend UI + frontend test + Playwright smoke; backend khong doi vi API/proxy health da pass.

## Scope P0

- Lam:
  - Doi sidebar/workflow action tu span trang tri sang button co handler scroll/focus section.
  - Gan id/target ro rang cho cac section Teacher/Admin/Student.
  - Them helper/test de action target khong bi roi.
- Khong lam:
  - Khong doi business rule, API contract, deploy, persistence.
  - Khong them feature P2.
- Dependencies da xong: P0-001 den P0-011, P1-001 den P1-006.
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend: khong doi backend; `./init.sh` phai pass backend pytest.
- Frontend: unit test cho action-target mapping va `./init.sh`.
- Integration/e2e: Playwright local smoke Teacher login -> click shortcut -> section focus/visible -> course/class/member/RAG API calls qua `/api/v1`.
- Security/access: khong doi auth/role guard; confirm frontend van khong hardcode backend URL/secret qua `./init.sh`.

### Manual validation

Prerequisite:
- Backend `http://127.0.0.1:3000` va frontend `http://127.0.0.1:5173` dang chay.

Steps:
1. Dang nhap Teacher bang demo account.
2. Bam cac shortcut trong sidebar va khu "Luồng thao tác".
3. Bam `Tạo course`, `Tạo lớp`, `Thêm sinh viên`, `Truy xuất chunks`.

Expected:
- Shortcut cuon den dung section thay vi bam khong co phan hoi.
- Cac nut form hien status thanh cong va API goi qua `/api/v1`.

Negative check:
- Khong co console error/framework overlay; role sai van bi backend chan nhu truoc.

## Implementation Plan Theo Vertical Slice

Backend:
- Khong doi.

Frontend:
- Tao helper mapping action/nav item sang section id.
- Render shortcut la `<button type="button">` co `onClick` scroll/focus.
- Gan `id`/`tabIndex` cho section dich.

Tests:
- Them Vitest helper test.
- Chay Playwright smoke sau khi sua.

Docs / Env:
- Cap nhat progress/session-handoff/feature_list evidence.

## Evidence Sau Khi Lam

Commands da chay:
- `./init.sh` baseline truoc khi sua: pass.
- `curl http://127.0.0.1:3000/api/v1/health`: 200.
- `curl http://127.0.0.1:5173/api/v1/health`: 200 qua Vite proxy.
- `pnpm --dir frontend exec vitest run src/workspaceActionTargets.test.ts`: pass 3 tests.
- `pnpm --dir frontend typecheck`: pass.
- `pnpm --dir frontend lint`: pass.
- Playwright smoke `http://127.0.0.1:5173`: pass.

Ket qua:
- Shortcut sidebar/workflow render thanh button co `aria-controls`, click focus dung section.
- Teacher form actions bi khoa trong luc initial data hydrate de tranh race selected course/class.
- Rendered QA: Teacher login, shortcut `Kho tri thuc` focus `teacher-knowledge`, shortcut `Tao course` focus `teacher-setup`, API calls qua `/api/v1` tra 200 cho course/class/add-student/RAG.
- Playwright network evidence: `POST /api/v1/courses`, `POST /api/v1/courses/course-6/classes`, `POST /api/v1/classes/class-6/students`, `POST /api/v1/rag/retrieve` deu 200; console issues none.

Manual validation da huong dan user:
- Chay backend/frontend local, dang nhap Teacher, bam shortcut trong sidebar/`Luồng thao tác`, xac nhan cuon den dung section.
- Bam `Tạo course`, `Tạo lớp`, `Thêm sinh viên`, `Truy xuất chunks`; expected status thanh cong va RAG hien chunk.

## Files Changed

- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/src/workspaceActionTargets.ts`
- `frontend/src/workspaceActionTargets.test.ts`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Khong co.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
