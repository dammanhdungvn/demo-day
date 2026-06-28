# Exec Plan - P0-010 Web Presentation and PDF export

## Muc Tieu

- Feature: `P0-010 - Web Presentation and PDF export`
- User stories: `US-027`, `US-028`
- Ket qua user can validate: Teacher/Student mo presentation cho lesson duoc phep xem, next/previous/fullscreen, export PDF qua browser print.
- Vertical slice: frontend presentation/print + tests + manual validation; backend permission reuse tu P0-007/P0-009.

## Scope P0

- Lam:
  - Presentation layout tu lesson blocks/citations.
  - Next/previous, keyboard arrow navigation, fullscreen, progress indicator.
  - Export PDF bang `window.print()` va print CSS doc duoc.
  - Teacher preview draft lesson trong Lesson Studio; Student preview published lesson sau khi fetch detail co permission.
- Khong lam:
  - Backend export record/audit nang cao.
  - Markdown/PPTX export.
  - Persistent export files.
- Dependencies da xong: `P0-007`, `P0-009`.
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Khong them route moi; permission reuse tu P0-007/P0-009 da co tests.
- Frontend:
  - Unit test build slides tu `LessonSession` gom title slide, block slides, citation metadata.
  - Typecheck/lint/build dam bao print/presentation UI khong crash.
- Integration/e2e:
  - Smoke UI/build va manual validation.
- Security/access:
  - Student presentation chi render sau `fetchStudentLesson` pass permission; Teacher presentation chi tu lesson trong Lesson Studio.

### Manual validation

Prerequisite:
- Co lesson Teacher generated hoac Student da mo lesson published.

Steps:
1. Bam Presentation.
2. Bam Next/Previous va thu ArrowRight/ArrowLeft.
3. Bam Fullscreen.
4. Bam Export PDF va chon Save as PDF trong browser print.

Expected:
- Slide doc duoc tren man hinh lon.
- PDF/print preview co tat ca slides va citations.

Negative check:
- Student chua co quyen lesson thi khong co lesson detail/presentation.

## Implementation Plan Theo Vertical Slice

Backend:
- Khong thay doi backend route.

Frontend:
- Them slide builder co test.
- Them `LessonPresentation` component trong Teacher Lesson Studio va Student reading view.
- Them print CSS.

Tests:
- Them unit test slide builder.
- Chay full frontend/backend verification.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`.

## Evidence Sau Khi Lam

Commands da chay:
- `pnpm vitest run src/presentation/slides.test.ts`
- `pnpm vitest run src/presentation/slides.test.ts src/api/learning.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- `uv run pytest -q`
- `pnpm test`
- `pnpm build`
- `git diff --check`

Ket qua:
- Presentation slide builder tests: 2 pass.
- Frontend targeted tests: 2 files/14 tests pass.
- Frontend typecheck/lint clean.
- Backend full pytest: 35 pass.
- Frontend full tests: 7 files/30 tests pass.
- Frontend production build pass.

Manual validation da huong dan user:
- Teacher: generate lesson, bam Presentation trong Lesson Studio, Next/Previous/Fullscreen/Export PDF.
- Student: mo published lesson, dung presentation panel, Next/Previous/Fullscreen/Export PDF.

## Files Changed

- `frontend/src/presentation/slides.ts`
- `frontend/src/presentation/slides.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/harness/exec-plans/active/P0-010-presentation-pdf.md`
- `docs/harness/exec-plans/tech-debt-tracker.md`

## Blockers / Next Step

- Khong con blocker cho P0-010.
- Next: `P0-011 - UX states, demo seed, deployment readiness`.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
