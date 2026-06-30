# Exec Plan - V2-011 Organization-scoped service authorization

## Muc Tieu

- Feature: Organization-scoped service authorization
- User stories: `US-202`, `US-207`, `US-208`
- Ket qua user can validate: User/profile co `organization_id`; course/class/document/lesson moderation khong leak cross-org; demo org `org-demo` van chay binh thuong.
- Vertical slice: backend service-layer org policy + minimal frontend type compatibility + tests + Postgres smoke.

## Scope P0

- Lam:
  - Gan `organization_id` vao course/class/document responses va repository storage paths.
  - Teacher create/list course/class theo `current_user.organization_id`.
  - Student class/lesson access loc theo organization cua Student.
  - Admin review queue/publish/request-changes/reject/audit chi cho lesson trong organization cua Admin.
  - Teacher/Admin document list va RAG selected documents chi cho source documents cung organization.
  - Postgres schema migration idempotent: add org columns/indexes cho core tables can thiet.
- Khong lam:
  - Khong viet full Supabase RLS policy per end-user trong slice nay; strategy la backend service-layer + service role DB access.
  - Khong migrate multi-org historical production data phuc tap; existing null/missing org se duoc default `org-demo` cho demo continuity.
  - Khong them UI org management/organization switcher.
- Dependencies da xong: `V2-010`
- Source-of-truth da doc: `docs/version2/PRD_V2_PRODUCTION.md`, `docs/version2/USER_STORIES_V2.md`, harness architecture/security.
- Khong dung: `README.md`

## Cau Hoi / Context Chua Ro

- [x] Khong hoi user vi user yeu cau agent tu quyet dinh; ap dung service-layer policy toi thieu de giam blast radius.
- [ ] Can hoi user:

## Test Plan Truoc Khi Code

### Automated tests

- Backend:
  - Admin org A khong thay lesson submitted cua org B trong review queue.
  - Admin org A khong publish/request/reject lesson org B.
  - Admin org A khong xem audit lesson org B.
  - Teacher org A khong list/get class/course org B du cross id.
  - Student org A khong nhan membership/lesson org B.
  - Teacher/Admin chi list/retrieve documents cung organization.
- Persistence/schema:
  - Postgres learning schema co `organization_id` cho `courses`/`classes` va filter org.
  - Postgres knowledge schema co `organization_id` cho `documents` va filter org.
- Regression:
  - Demo `org-demo` auth/course/RAG/Admin/Student tests van pass.
  - Full `./init.sh` pass.

### Manual validation

1. Local demo `AUTH_PROVIDER=demo`, login Teacher va tao course/class/lesson.
2. Login Admin demo, xac nhan review queue van thay lesson org-demo.
3. Tao profile/user test org khac bang backend test script hoac Postgres smoke.
4. Goi Admin queue/publish org-demo lesson bang user org khac, expect 404/empty.
5. Goi documents/RAG bang org khac voi document org-demo, expect khong thay hoac 400 missing.

## Implementation Plan Theo Vertical Slice

Backend:
- Them org field optional vao response models can thiet.
- Update LearningRepository signatures va memory/Postgres implementations de write/filter org.
- Update KnowledgeRepository signatures va memory/Postgres document paths de write/filter org.
- Them helper service `_require_user_organization`, `_same_organization`, `_ensure_lesson_in_user_organization`.
- Filter Admin moderation/audit va Student membership/lesson access qua learning repository.

Frontend:
- Update TS types optional `organization_id` cho course/class/document neu can.
- Khong doi UI surface.

Tests:
- Mo rong `tests/test_learning.py`, `tests/test_lesson_blocks.py`, `tests/test_knowledge_rag.py`.
- Postgres smoke script sau implementation.

Docs / Env:
- Cap nhat feature evidence, progress/handoff/overnight.
- Neu co shortcut, cap nhat tech debt.

## Evidence Sau Khi Lam

Commands da chay:
- `uv run pytest tests/test_learning.py tests/test_lesson_blocks.py tests/test_knowledge_rag.py -q` truoc implementation -> fail 6 tests org scope dung ky vong.
- `uv run pytest tests/test_learning.py tests/test_lesson_blocks.py tests/test_knowledge_rag.py -q` sau implementation -> pass 59.
- `uv run pytest tests/test_learning.py tests/test_lesson_blocks.py tests/test_knowledge_rag.py tests/test_audit_persistence.py -q` -> pass 62.
- `uv run pytest -q` -> pass 94.
- `pnpm run typecheck && pnpm run lint && pnpm test -- --run` -> pass frontend 12 files / 53 tests.
- Postgres smoke -> `organization_scope_smoke_ok learning_filter=true document_filter=true cross_org_retrieval=blocked`.
- `./init.sh` -> pass frontend 12 files / 53 tests + build, backend 94 tests.

Ket qua:
- Course/class/document responses co optional `organization_id`.
- LearningRepository memory/Postgres write/filter theo organization cua current user.
- Student class membership va published lesson access loc theo organization.
- Admin moderation queue/publish/request/reject/audit chi cho lesson cung organization.
- Teacher/Admin document list va RAG selected documents loc theo organization; cross-org document id bi xu ly nhu missing.
- Frontend types updated, khong doi UI flow.

Manual validation da huong dan user:
- Demo org `org-demo`: login Teacher/Admin/Student va chay V1 flow nhu cu.
- Cross-org smoke: user org B khong thay course/document org A, retrieval org A doc id tra missing, Admin org B khong publish lesson org A.

## Files Changed

- `feature_list.json`
- `docs/harness/exec-plans/active/V2-011-organization-scoped-authorization.md`
- `backend/main.py`
- `backend/tests/test_learning.py`
- `backend/tests/test_lesson_blocks.py`
- `backend/tests/test_knowledge_rag.py`
- `frontend/src/api/learning.ts`
- `progress.md`
- `session-handoff.md`
- `docs/OVERNIGHT_HANDOFF.md`

## Blockers / Next Step

- Khong co blocker cua V2-011.
- Next recommended feature: durable worker/retry/cancel cho ingestion/re-index hoac V2-P1 web URL ingestion, tuy theo uu tien san pham.

## Quality Gate

- [x] Khong vuot P0 scope.
- [x] Co evidence test hoac ly do chua co test automation.
- [x] Co manual validation steps cho user.
- [x] Khong hardcode secrets/backend URL.
- [x] Neu co shortcut/debt, da ghi vao `docs/harness/exec-plans/tech-debt-tracker.md` hoac xac nhan khong co.
