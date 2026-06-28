# Exec Plan - P0-006 Lesson blocks, citations, warnings

## Muc Tieu

- Feature: `P0-006 - Lesson blocks, required block types, citations, warnings`
- User stories: `US-011`, `US-012`, `US-013`, `US-014`
- Ket qua user can validate: Teacher chon outline session va generate lesson blocks co block types bat buoc, citations va warning neu thieu citation.
- Vertical slice: backend lesson generation + frontend block preview + tests/manual validation.

## Scope P0

- Lam:
  - Generate lesson blocks tu outline session da co.
  - Demo block types toi thieu: `learning_objectives`, `concept_explanation`, `analogy_or_example`, `quiz`, `slide`.
  - Moi block co type, title, content, order_index, status `needs_review`.
  - Gắn citations toi thieu: document title, page, excerpt, chunk id, confidence/score.
  - Block thieu citation co warning ro.
- Khong lam:
  - Approve/reject/submit Teacher Studio day du (P0-007).
  - Admin publish/Student view/PDF.
- Dependencies da xong: `P0-005`
- Source-of-truth da doc: `docs/version1/MVP.md`, `docs/version1/PRD_MVP.md`, `docs/version1/USER_STORIES_MVP.md`
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong co.
- [ ] Can hoi user:

Decision 2026-06-28:
- User dang can MVP nhanh de test/deploy; P0-006 lam lesson generation toi thieu nhung that bang OpenAI + RAG.
- Lesson session/block store tam thoi in-memory theo debt demo store hien co.

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Generate lesson tu outline session dung teacher owner.
  - AI output validate schema va bat buoc co demo block types.
  - Blocks default `needs_review`, co citations/warnings.
  - Student/Admin khong generate duoc lesson.
- Frontend:
  - API client goi `/lessons/generate` dung bearer token.
- Integration/e2e:
  - Live smoke: outline co san -> generate lesson blocks 5 types.
- Security/access:
  - Teacher ownership check qua outline/session.

### Manual validation

Prerequisite:
- P0-005 outline da generate.

Steps:
1. Login Teacher.
2. Generate outline.
3. Chon session va bam generate lesson blocks.

Expected:
- Co 5 block types demo.
- Moi block co title/content/status needs_review.
- Citations hien document title/page/excerpt.

Negative check:
- Student/Admin khong goi duoc endpoint.

## Implementation Plan Theo Vertical Slice

Backend:
- Them lesson block/session models/store.
- Them AI schema lesson blocks va service generate lesson.
- Them route `POST /lessons/generate`.

Frontend:
- Them API client.
- Them button/render lesson blocks trong outline panel.

Tests:
- Backend fake provider/repository tests.
- Frontend API tests.

Docs / Env:
- Cap nhat feature/progress/handoff/evidence.

## Evidence Sau Khi Lam

Commands da chay:
- `uv run pytest tests/test_lesson_blocks.py -q`
- `pnpm --dir frontend exec vitest run src/api/learning.test.ts`
- `pnpm --dir frontend run typecheck && pnpm --dir frontend run lint && pnpm --dir frontend exec vitest run src/api/learning.test.ts && pnpm --dir frontend run build`
- `uv run pytest -q`
- Live HTTP smoke local voi OpenAI key hien co.

Ket qua:
- Backend P0-006 targeted tests: `3 passed`.
- Frontend API tests: `9 passed`.
- Backend full pytest: `26 passed`.
- Frontend typecheck/lint/build pass.
- Live smoke: Teacher login/create course/create class/documents/generate outline/generate lesson all 200; lesson co 5 blocks dung required demo types va first block co 3 citations.

Manual validation da huong dan user:
Prerequisite:
- Da generate outline trong P0-005.

Steps:
1. Login Teacher.
2. Generate outline.
3. Chon session.
4. Bam `Generate lesson blocks`.

Expected:
- Co 5 block types demo: learning objectives, concept explanation, analogy/example, quiz, slide.
- Moi block co `needs_review`, title/content va citations.
- Warning hien neu block khong co citation.

Negative check:
- Student/Admin khong goi duoc `POST /api/v1/lessons/generate`.

## Files Changed

- `backend/main.py`
- `backend/tests/test_lesson_blocks.py`
- `frontend/src/api/learning.ts`
- `frontend/src/api/learning.test.ts`
- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `feature_list.json`
- `docs/harness/exec-plans/active/P0-006-lesson-blocks.md`
- `docs/harness/exec-plans/tech-debt-tracker.md`

## Blockers / Next Step

- Khong con blocker cho P0-006.
- Next: `P0-007 - Teacher Lesson Studio review flow`.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md`.
