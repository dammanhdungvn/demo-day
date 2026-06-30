# TeachFlow AI Version 2 - Production Conversion

## Muc Tieu

Version 2 chuyen TeachFlow AI tu MVP demo sang san pham production that su cho quy mo nho den vua:

```txt
<= 1000 active users
Teacher/Admin/Student dung that
Du lieu ton tai ben vung sau restart/deploy
AI/RAG co job lifecycle, retry, audit va permission ro rang
```

Version 2 khong chi them feature. Uu tien dau tien la thay cac shortcut demo cua version 1 bang nen tang production co the van hanh an toan.

## Source Of Truth

Tai lieu version 2:

1. `docs/version2/PRD_V2_PRODUCTION.md`
2. `docs/version2/USER_STORIES_V2.md`
3. `docs/version2/V1_P2_MIGRATION.md`

Tai lieu version 1 van la lich su MVP/demo:

1. `docs/version1/MVP.md`
2. `docs/version1/PRD_MVP.md`
3. `docs/version1/USER_STORIES_MVP.md`

Khi trien khai version 2, khong dung `README.md` de quyet dinh nghiep vu.

## Nguyen Tac Version 2

- Lam production foundation truoc khi them feature lon.
- Khong de du lieu course/class/lesson/audit nam in-memory.
- Auth, role, organization, ownership va class membership phai enforced o backend.
- AI generation, upload, ingestion phai co job status va retry/co loi ro rang.
- Feature moi phai giu grounding/citation; khong tao chatbot tra loi vu vo.
- Lam tung vertical slice: backend + frontend + tests + manual validation.
- Phu hop <=1000 users: don gian, de van hanh, khong over-engineer thanh enterprise.

## Phan Ky

```txt
Version 1: MVP demo end-to-end
Version 2: Production conversion + mot so feature huu ich da du dieu kien
Version 3: Growth features sau khi production on dinh va co usage data
```

## Version 2 Release Gate

Version 2 chi duoc coi la production-ready khi:

1. Supabase Auth hoac auth production tuong duong thay demo auth.
2. Course/class/membership/outlines/lessons/blocks/audit/jobs ton tai trong DB.
3. Backend restart khong lam mat du lieu.
4. Student direct URL access van bi chan neu sai class/status.
5. Upload/generation chay qua job lifecycle co status/retry/error state.
6. Secrets khong nam frontend va khong commit.
7. Basic monitoring/error logging/backup runbook co tai lieu.
8. Automated tests pass cho role, membership, status transition, RAG, AI schema.
9. Manual production smoke pass voi Admin/Teacher/Student thật.

## Trang Thai Job Reliability

- V2-005 da co generation job lifecycle persistence co ban.
- V2-007 da co async document ingestion toi thieu bang FastAPI `BackgroundTasks`.
- V2-009 da co production embedding provider va re-index path.
- Con debt production TD-013/TD-015/TD-016: retry/cancel/polling UI chua day du, worker chua durable, re-index/generation job dai con xu ly dong bo trong request o mot so path.
- V2-014 da duoc mo de xu ly nhom debt nay. Concept UI Job Center da duoc user duyet tai `images/job-center-design-approval-v1.png`; backend retry/cancel da implement/test targeted, frontend Job Center dang paused theo yeu cau user de uu tien login/backend API readiness.
