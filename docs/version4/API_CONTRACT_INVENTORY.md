# API Contract Inventory - V4-030

Tai lieu nay la ban inventory ngan cho Swagger/OpenAPI production quality. Source-of-truth runtime van la `/api/v1/openapi.json`; file nay giup QA/dev biet endpoint nao public, endpoint nao can bearer token va role nao.

## Docs Endpoints

- Swagger UI: `/api/v1/docs`
- OpenAPI JSON: `/api/v1/openapi.json`
- Security scheme: `BearerAuth`, header `Authorization: Bearer <access_token>`

## Public Endpoints

| Method | Path | Tag | Ghi chu |
|---|---|---|---|
| GET | `/api/v1/health` | Health | Health check, khong can auth. |
| GET | `/api/v1/auth/demo-accounts` | Auth | Local/demo account discovery, khong tra password. |
| POST | `/api/v1/auth/login` | Auth | Login demo/Supabase password flow. |
| POST | `/api/v1/auth/refresh` | Auth | Refresh Supabase session bang refresh token payload. |
| POST | `/api/v1/auth/invites/accept` | Auth | Invited user accept/register bang invite code/email/name/password. |

## Protected Endpoint Groups

| Tag | Role / Actor | Endpoint group |
|---|---|---|
| Auth | Authenticated user | `/api/v1/me`, `/api/v1/auth/logout` |
| Auth | Admin | `/api/v1/auth/invites` |
| Learning | Teacher | `/api/v1/courses`, `/api/v1/courses/{course_id}/classes`, `/api/v1/classes/{class_id}/students`, `/api/v1/students` |
| Student | Student | `/api/v1/student/classes`, `/api/v1/student/lessons`, `/api/v1/student/lessons/{lesson_id}`, `/api/v1/student/lessons/{lesson_id}/progress`, `/api/v1/student/lessons/{lesson_id}/study-state`, `/api/v1/student/lessons/{lesson_id}/practice-attempts/{block_id}`, `/api/v1/student/study-review`, `/api/v1/student/practice-items` |
| Teacher | Teacher | `/api/v1/teacher/dashboard`, `/api/v1/teacher/lessons`, `/api/v1/teacher/classes/{class_id}/progress` |
| Knowledge | Teacher/Admin/Student theo scope policy | `/api/v1/documents`, `/api/v1/documents/upload`, `/api/v1/documents/ingest-url`, `/api/v1/documents/{document_id}/archive`, `/api/v1/documents/{document_id}/reindex` |
| Knowledge | Teacher | `/api/v1/rag/retrieve` |
| AI Generation | Teacher | `/api/v1/outlines`, `/api/v1/outlines/generate`, `/api/v1/outlines/{outline_id}/sessions/{session_index}`, `/api/v1/lessons/generate`, `/api/v1/lesson-blocks/{block_id}/regenerate` |
| Lessons | Teacher owner/Admin same org/Student published membership | `/api/v1/lesson-blocks/{block_id}`, `/api/v1/lesson-blocks/{block_id}/status`, `/api/v1/lessons/{lesson_id}/submit`, `/api/v1/lessons/{lesson_id}/audit-events`, `/api/v1/lessons/{lesson_id}/exports` |
| Admin | Admin | `/api/v1/admin/dashboard`, `/api/v1/admin/review-queue`, `/api/v1/admin/lessons/{lesson_id}/publish`, `/api/v1/admin/lessons/{lesson_id}/request-changes`, `/api/v1/admin/lessons/{lesson_id}/reject` |
| Student | Student | `/api/v1/student/dashboard` |
| Jobs | Teacher/Admin/Student own/org context | `/api/v1/generation-jobs` |

## Contract Rules

- Public endpoints must not include OpenAPI `security`.
- Protected endpoints must include `security: [{"BearerAuth": []}]`.
- Swagger tags must stay stable: Health, Auth, Learning, Knowledge, AI Generation, Lessons, Admin, Teacher, Student, Jobs.
- `operationId` values must remain unique.
- Primary endpoint request examples and common error responses must stay present in `/api/v1/openapi.json`.
- Tests: `backend/tests/test_openapi_contract.py` guards the rules above.
