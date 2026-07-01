# Exec Plan - P1-002 Markdown export

## Muc Tieu

- Feature: P1-002 Markdown export
- User stories: US-033 Markdown export
- Ket qua user can validate: Teacher export lesson sang file Markdown co title, status, blocks va citations.
- Vertical slice: frontend export behavior + tests + manual validation; backend permission reuse tu Teacher lesson ownership/fetch hien co.

## Scope P1

- Lam:
  - Enable Markdown export action trong Teacher Lesson Studio khi lesson da load/generate.
  - Markdown output gom lesson title, status, admin feedback neu co, block type/title/content/status/warning/citations.
  - File download `.md` tao tu browser Blob.
  - Error state neu export fail hoac chua co lesson.
- Khong lam:
  - PPTX export.
  - Server-side export record.
  - Markdown export cho Student neu chua co yeu cau P1 trong US-033.
  - Better PDF layout.
- Dependencies da xong: P0-010, P1-001.
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md` de suy luan nghiep vu.

## Cau Hoi / Context Chua Ro

- [x] Khong co. US-033 chi yeu cau Teacher export lesson sang Markdown.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Khong can route moi; permission reuse tu Teacher lesson ownership/fetch hien co.
- Frontend:
  - Unit test Markdown builder co title/status/blocks/warnings/citations.
  - Unit test file name slug/extension on dinh.
  - API/client khong them backend URL hardcode.
- Integration/e2e:
  - Manual validation trong Teacher UI.
- Security/access:
  - Export chi tu lesson da co trong Teacher UI sau khi backend da authorize.

### Manual validation

Prerequisite:
- Backend/frontend chay local.
- Teacher co lesson da generate hoac load lai trong Lesson Studio.

Steps:
1. Login Teacher.
2. Tao/load lesson co citations trong Lesson Studio.
3. Bam Export Markdown.
4. Mo file `.md` duoc download.

Expected:
- File Markdown co lesson title, status, blocks, warnings neu co, citations/source evidence.
- UI hien thong bao export thanh cong.

Negative check:
- Khi chua co lesson, nut export disabled hoac UI bao chua co lesson.
- Frontend source khong hardcode backend URL/secret.

## Implementation Plan Theo Vertical Slice

Backend:
- Khong them route moi.

Frontend:
- Tao helper Markdown export/serializer trong `frontend/src/lessonMarkdown.ts`.
- Them tests cho serializer.
- Them button Export Markdown trong Teacher Lesson Studio gan lesson controls.
- Dung Blob/object URL de download `.md`.

Tests:
- Vitest unit tests cho helper.
- `./init.sh`.

Docs / Env:
- Cap nhat `feature_list.json`, `progress.md`, `session-handoff.md`.
- Khong them env moi.

## Evidence Sau Khi Lam

Commands da chay:
- `pnpm --dir frontend test -- --run src/lessonMarkdown.test.ts`
- `pnpm --dir frontend typecheck`
- `pnpm --dir frontend lint`
- `./init.sh`

Ket qua:
- Pass: Markdown helper tests pass; frontend typecheck/lint pass.
- Full `./init.sh` pass: frontend 8 files/33 tests + build, backend 44 tests.

Manual validation da huong dan user:
- Prerequisite/Steps/Expected/Negative check nam trong exec plan nay.

## Files Changed

- `frontend/src/lessonMarkdown.ts`
- `frontend/src/lessonMarkdown.test.ts`
- `frontend/src/App.tsx`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`

## Blockers / Next Step

- Khong co blocker. Next: P1-003 PPTX basic export.

## Quality Gate

- [x] Khong vuot P1 scope da chon.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
