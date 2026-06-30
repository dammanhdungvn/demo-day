# Exec Plan - V4-038 Teacher first lesson onboarding

## Muc Tieu

- Feature: `V4-038 Teacher first-lesson onboarding and user-friendly framing`
- User stories: `US-401`, `US-403`, `US-404`, `US-405`, `US-409`
- Ket qua user can validate: Teacher moi thay ngay buoc tiep theo de tao bai giang dau tien, khong bi day vao thuat ngu RAG/job/contextual tren first screen.
- Vertical slice: frontend helper + Teacher workspace UI + tests + rendered QA; backend dung API hien co.

## Scope P0

- Lam:
  - Them helper tinh next action tu real state: course/class, source documents, outline, lesson, admin publish.
  - Hien guided panel "Tao bai giang dau tien" trong Teacher first viewport.
  - Doi framing UI Teacher/App nav tu "RAG/job/contextual/chunks" sang "nguon kien thuc/tai lieu soan bai/dang xu ly/do tin cay nguon" o first-screen va primary action.
  - Giu technical controls nhu re-index/chunk metadata o cap chi tiet neu can.
- Khong lam:
  - Khong them AI tutor, solo publish mode, production embedding change, worker queue hoac schema moi trong slice nay.
  - Khong doi auth/role/backend permission.
- Dependencies da xong: `V4-034`, `V4-035`, `V4-037`.
- Source-of-truth da doc: `docs/version4/README.md`, `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`, `docs/version4/USER_STORIES_V4.md`, `docs/version4/UX_RESEARCH_NOTES.md`, `docs/version4/PRODUCT_REVIEW.md`, `docs/version4/PRODUCTION_GAP_ANALYSIS.md`, `docs/harness/SOP.md`, `docs/harness/ARCHITECTURE.md`, `docs/harness/QUALITY_SCORE.md`, `docs/harness/RELIABILITY_SECURITY.md`.
- Khong dung: `README.md`.

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Khong doi backend; backend se duoc verify qua `./init.sh`.
- Frontend:
  - `frontend/src/features/teacherWorkspace.test.ts`: helper `buildTeacherFirstLessonGuide` tra dung next action cho empty, source, outline, lesson review, submitted/published states.
  - `frontend/src/features/teacherWorkspace.test.ts`: workflow labels/detail khong dung "Sources/Admin Review/Student Publish" lam primary teacher-facing copy.
  - Existing frontend tests/build pass.
- Integration/e2e:
  - Playwright rendered QA Teacher desktop/mobile neu dev server chay duoc.
- Security/access:
  - Khong doi backend permission; `./init.sh` giu full backend regression.

### Manual validation

Prerequisite:
- Backend/frontend local chay voi demo login enabled.

Steps:
1. Login Teacher.
2. Xem first viewport Teacher workspace.
3. Bam CTA trong guide theo state hien tai.
4. Tiep tuc tao/chon tai lieu, dàn ý, lesson va quan sat guide cap nhat.

Expected:
- Panel "Tạo bài giảng đầu tiên" cho biết buoc tiep theo bang ngon ngu giao vien.
- CTA focus den dung section.
- First screen khong con framing "Teacher -> RAG -> Admin -> Student", "Tài liệu/RAG", "job AI".

Negative check:
- Khong hien fake progress neu chua co course/class/doc/lesson.
- Mobile khong overlap/clipped text.

## Implementation Plan Theo Vertical Slice

Backend:
- Khong doi.

Frontend:
- Add type/helper `TeacherFirstLessonGuide` trong `frontend/src/features/teacherWorkspace.ts`.
- Render guide panel trong `TeacherWorkspace.tsx` sau hero/status.
- Doi copy trong `App.tsx`, `TeacherWorkspace.tsx`, va CSS nho cho guide.

Tests:
- Add helper tests fail-first, sau do implement.
- Chay targeted frontend tests, full frontend tests/build, final `./init.sh`.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`, `docs/version4/README.md`/`PRODUCT_REVIEW.md` neu done.

## Evidence Sau Khi Lam

Commands da chay:
- Baseline `./init.sh` pass truoc code: frontend 15 files/64 tests + build, backend 174 tests.
- `pnpm --dir frontend exec vitest run src/features/teacherWorkspace.test.ts` pass 4 tests.
- `pnpm --dir frontend exec vitest run src/workspaceActionTargets.test.ts` pass 5 tests.
- `pnpm --dir frontend test -- --run` pass 15 files/67 tests.
- `pnpm --dir frontend lint` pass.
- `pnpm --dir frontend typecheck` pass.
- `pnpm --dir frontend build` pass.
- Playwright fallback QA `pnpm --dir frontend exec node /tmp/v4-038-teacher-qa.mjs` pass desktop 1440x1100 va mobile 390x900; screenshots `/tmp/v4-038-teacher-onboarding-desktop.png`, `/tmp/v4-038-teacher-onboarding-mobile.png`.
- Final `./init.sh` pass: frontend 15 files/67 tests + build, backend 174 tests.

Ket qua:
- Done. Teacher workspace co guided next-action panel tinh tu real state, App/Teacher labels doi sang ngon ngu giao vien, mobile nav khong gay chu, va QA xac nhan khong visible cac text cam: `/api/v1`, `Mat khau demo`, `Teacher -> RAG`, `Tai lieu/RAG`, `job AI`, `lesson blocks`, `Truy xuat RAG`.

Manual validation da huong dan user:
- Login Teacher bang quick role access.
- Xem first viewport co workflow timeline + guided panel "Thiet lap lop hoc"/buoc tiep theo tuy state.
- Click CTA trong guided panel va xac nhan focus/scroll den section dung.
- Kiem tra mobile 390px khong overlap/clipped text; nav chuyen thanh hang cuon ngang.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/completed/V4-038-teacher-first-lesson-onboarding.md`
- `frontend/src/features/teacherWorkspace.ts`
- `frontend/src/features/teacherWorkspace.test.ts`
- `frontend/src/features/teacher/TeacherWorkspace.tsx`
- `frontend/src/ui/teacherWorkspace.tsx`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/src/auth/workspaces.ts`
- `frontend/src/workspaceActionTargets.ts`
- `frontend/src/workspaceActionTargets.test.ts`
- `progress.md`
- `session-handoff.md`
- `docs/version4/README.md`
- `docs/version4/PRODUCT_REVIEW.md`

## Blockers / Next Step

- Khong co.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md` hoac xac nhan khong co debt moi.
