# Exec Plan - P1-003 PPTX basic export

## Muc Tieu

- Feature: P1-003 PPTX basic export
- User stories: US-034 PPTX Basic export
- Ket qua user can validate: Teacher export lesson dang presentation thanh file `.pptx` co slide title/content/citation co ban.
- Vertical slice: frontend PPTX export behavior + tests + manual validation; backend permission reuse tu Teacher lesson ownership/fetch hien co.

## Scope P1

- Lam:
  - Enable PPTX basic export trong Teacher Lesson Studio khi lesson da load/generate.
  - Tao PPTX co cover slide va mot slide moi lesson block, content ngan gon, citation summary co ban.
  - File download `.pptx` khong crash app.
  - Unit test cho logic map lesson -> PPTX slide payload/filename.
- Khong lam:
  - PPTX advanced theme/layout/phu hop moi projector.
  - Server-side PPTX rendering/export record.
  - Student PPTX export neu chua co yeu cau.
  - Audit event export.
- Dependencies da xong: P0-010, P1-002.
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md` de suy luan nghiep vu.

## Cau Hoi / Context Chua Ro

- [x] Khong co. US-034 chi yeu cau Teacher export slide co ban sang PPTX.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Khong can route moi; permission reuse tu Teacher lesson ownership/fetch hien co.
- Frontend:
  - Unit test slide payload gom cover + block slides.
  - Unit test file name `.pptx` on dinh.
  - Typecheck/lint/build voi dependency PPTX.
- Integration/e2e:
  - Manual validation download file `.pptx`.
- Security/access:
  - Export chi tu lesson da co trong Teacher UI sau khi backend da authorize.

### Manual validation

Prerequisite:
- Backend/frontend chay local.
- Teacher co lesson da generate hoac load lai trong Lesson Studio.

Steps:
1. Login Teacher.
2. Tao/load lesson co blocks trong Lesson Studio.
3. Bam Export PPTX.
4. Mo file `.pptx` trong PowerPoint/Keynote/LibreOffice.

Expected:
- File co cover slide va slide theo lesson blocks.
- Noi dung va citation summary co ban doc duoc.
- UI hien thong bao export thanh cong.

Negative check:
- Khi chua co lesson, nut export disabled hoac UI bao chua co lesson.
- Frontend source khong hardcode backend URL/secret.

## Implementation Plan Theo Vertical Slice

Backend:
- Khong them route moi.

Frontend:
- Them dependency `pptxgenjs`.
- Tao helper `frontend/src/lessonPptx.ts` cho slide payload/file name/export.
- Them tests `frontend/src/lessonPptx.test.ts`.
- Them button Export PPTX trong Teacher Lesson Studio.

Tests:
- Vitest unit tests cho helper.
- `./init.sh`.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`.
- Khong them env moi.

## Evidence Sau Khi Lam

Commands da chay:
- `pnpm --dir frontend add pptxgenjs`
- `pnpm --dir frontend exec vitest run src/lessonPptx.test.ts`
- `pnpm --dir frontend typecheck`
- `pnpm --dir frontend lint`
- `./init.sh`

Ket qua:
- Pass: PPTX helper tests 2 passed, frontend typecheck/lint pass.
- Full `./init.sh` pass: frontend 9 files/35 tests + build, backend 44 tests.

Manual validation da huong dan user:
- Prerequisite/Steps/Expected/Negative check nam trong exec plan nay.

## Files Changed

- `frontend/package.json`
- `frontend/pnpm-lock.yaml`
- `frontend/src/lessonPptx.ts`
- `frontend/src/lessonPptx.test.ts`
- `frontend/src/App.tsx`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Khong co blocker. Next: P1-004 Audit events day du hon.

## Quality Gate

- [x] Khong vuot P1 scope da chon.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
