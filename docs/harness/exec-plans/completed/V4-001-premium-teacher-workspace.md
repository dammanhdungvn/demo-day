# Exec Plan - V4-001 Premium Teacher Workspace And Lesson Studio Redesign

## Muc Tieu

- Feature: `V4-001 Premium Teacher workspace and Lesson Studio redesign`
- User stories: `US-401`, `US-402`, `US-403`, `US-404`, `US-405`, `US-406`, `US-407`, `US-408`, `US-409`
- Ket qua user can validate: dang nhap Teacher thay workspace moi dep hon, ro workflow hon, Lesson Studio co block list/editor/citation inspector/source/job strip, animation nhe va khong pha V1 flow.
- Vertical slice: frontend design system + Teacher UI + helper tests + rendered QA + full baseline.

## Scope V4-P0

- Lam:
  - Them UI tokens/primitives dung chung.
  - Them helper tinh workflow steps va quality metrics tu state hien co, khong hardcode fake metric.
  - Redesign Teacher workspace theo concept `docs/version4/assets/teachflow-v4-teacher-workspace-concept.png`.
  - Cai thien Lesson Studio layout: block list, editor, citation inspector, action/status.
  - Them motion CSS co `prefers-reduced-motion`.
  - Rendered QA desktop/mobile bang Playwright neu Browser plugin khong co.
- Khong lam:
  - Supabase Auth production.
  - V2 async job lifecycle that.
  - Student AI tutor/adaptive learning.
  - Full split backend monolith.
  - Fake analytics/metrics khong co data.
- Dependencies da xong:
  - `V2-003`
- Source-of-truth da doc:
  - `docs/version1/*`
  - `docs/version2/*`
  - `docs/version3/*`
  - `docs/version4/*`
- Khong dung: `README.md` cho business scope.

## Cau Hoi / Context Chua Ro

- [x] User da yeu cau khong hoi them, tu research/search khi thieu thong tin.
- [x] Khong co blocker business rule cho UI redesign slice.

## Test Plan Truoc Khi Code

### Automated tests

- Frontend:
  - Helper test cho citation coverage, review progress, warning count, pending admin status.
  - Helper test cho workflow steps Course/Sources/Outline/Lesson Studio/Admin Review/Student Publish tinh tu state.
  - Existing frontend tests pass.
- Backend:
  - Khong doi API contract; chay full `./init.sh`.

### Rendered QA

Flow under test:

```txt
frontend app -> Teacher login -> premium Teacher workspace renders -> sidebar/timeline/Lesson Studio surfaces visible -> one section shortcut/action responds -> mobile viewport khong overlap
```

Checks:

- Page identity va not blank.
- No Vite/framework overlay.
- Console warning/error khong co loi app lien quan.
- Desktop screenshot Teacher workspace.
- Mobile screenshot Teacher workspace.
- At least one interaction proof: Teacher demo login va shortcut/focus hoac block/source selection.

### Manual validation

Prerequisite:

- Backend chay port 3000.
- Frontend chay Vite dev server.

Steps:

1. Login Teacher demo.
2. Tao/open course/class va add Student neu can.
3. Xem workflow timeline co status dung.
4. Chon source, generate outline/lesson nhu flow cu.
5. Chon block trong Lesson Studio, kiem tra editor va citation inspector.
6. Approve/submit, Admin publish, Student xem lesson.

Expected:

- UI ro next action, khong clipped/overlap.
- Metrics tinh tu data hien co.
- No secret/backend URL hardcode.

Negative check:

- Chua co lesson thi hien empty state, khong fake data.
- Reduced motion tat animation lon.

## Implementation Plan Theo Vertical Slice

Frontend:

1. Tao `frontend/src/features/teacherWorkspace.ts` helper tinh metrics/workflow va tests.
2. Tao `frontend/src/ui/` primitives nhe neu can de tranh copy-paste.
3. Refactor phan Teacher workspace trong `App.tsx` theo design system nhung giu API behavior.
4. Cap nhat `App.css` tokens/layout/motion/responsive.

Tests:

1. Chay targeted Vitest helper.
2. Chay frontend typecheck/lint/test/build.
3. Chay `./init.sh`.
4. Chay Playwright rendered QA desktop/mobile.

Docs/state:

1. Cap nhat `feature_list.json` evidence.
2. Cap nhat `progress.md`, `session-handoff.md`, `docs/OVERNIGHT_HANDOFF.md`.

## Evidence Sau Khi Lam

Commands da chay:
- `pnpm --dir frontend exec vitest run src/features/teacherWorkspace.test.ts` -> pass 2.
- `pnpm --dir frontend typecheck` -> pass.
- `pnpm --dir frontend lint` -> pass.
- `pnpm --dir frontend test -- --run` -> pass 12 files / 45 tests.
- `pnpm --dir frontend build` -> pass.
- `uv run pytest tests/test_lesson_blocks.py -q` -> pass 24 sau fix audit route dependency.
- `uv run pytest -q` -> pass 66.
- `./init.sh` -> pass voi frontend 12 files / 45 tests + build, backend 66 tests.
- `git diff --check` -> pass.

Ket qua:
- Da tao `docs/version4/` gom README, PRD, user stories, UX research notes, product review va concept asset.
- Da them helper `frontend/src/features/teacherWorkspace.ts` tinh metric/workflow tu state that, khong hardcode fake metric.
- Da them UI primitives `frontend/src/ui/teacherWorkspace.tsx`.
- Teacher workspace co compact topbar, workflow timeline, metric cards, source strip, job queue, Lesson Studio 3 cot, citation inspector va CSS motion/reduced-motion.
- Backend audit route fix tu dependency sai sang `get_current_user`, het console 422 khi load audit history.

Rendered QA:
- Browser plugin khong co trong tool list; dung Playwright fallback.
- Local URL: `http://127.0.0.1:5173`, backend `http://127.0.0.1:3000/api/v1`.
- Seed QA qua API that: Teacher login, tao course/class, lay completed documents, generate outline va lesson that bang AI provider, lesson co 5 blocks.
- Desktop screenshot 1440x1100 da inspect bang `view_image`: `.tmp/qa/v4-teacher-desktop.png`.
- Mobile screenshot 390x900 da inspect bang `view_image`: `.tmp/qa/v4-teacher-mobile.png`.
- Console error/warning: empty sau fix audit route.
- Fidelity ledger:
  - Concept co app shell + role nav + workflow timeline: implemented voi compact topbar/sidebar/timeline.
  - Concept metric panels: implemented citation coverage/review progress/pending admin/warnings tu state that.
  - Concept Lesson Studio 3 cot: implemented block rail/editor/citation inspector khi co lesson.
  - Concept source/job strip: implemented source cards va job queue tu state loading/action.
  - Intentional deviation: first desktop viewport van giu Course/Class setup visible vi day la core Teacher creation path; khong fake lesson/metrics de ep giong concept.

Manual validation da huong dan user:
- Chay backend/frontend local, login Teacher, xem workspace moi.
- Tao/chon course/class/source, generate outline/lesson, chon block, xem editor/citations/warnings.
- Approve/submit, Admin publish, Student view nhu V1 flow.

## Files Changed

- `docs/version4/`
- `docs/version4/assets/teachflow-v4-teacher-workspace-concept.png`
- `frontend/src/features/teacherWorkspace.ts`
- `frontend/src/features/teacherWorkspace.test.ts`
- `frontend/src/ui/teacherWorkspace.tsx`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/src/labels.ts`
- `backend/main.py`
- `AGENTS.md`
- `docs/harness/SOP.md`
- `init.sh`
- `feature_list.json`

## Blockers / Next Step

- Khong co blocker cho V4-001.
- Next nen tiep tuc V2-P0 production auth/organization, persistent audit events, async job lifecycle; sau do V3 tutor/progress/adaptive.

## Quality Gate

- [x] Khong vuot V4-P0 scope.
- [x] Co helper tests cho metric/workflow.
- [x] Rendered QA desktop/mobile co evidence.
- [x] `./init.sh` pass.
- [x] Khong hardcode secrets/backend URL/fake metrics.
- [x] Cap nhat progress/handoff.
