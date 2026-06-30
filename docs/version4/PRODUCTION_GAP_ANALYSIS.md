# Production Gap Analysis - TeachFlow AI V4

Ngay cap nhat: 2026-06-30

## Muc Dich

Tai lieu nay ghi nhan nhung workflow va system capability con thieu so voi mot san pham AI education production. Day khong thay the PRD, ma la audit backlog de tranh lap lai loi product logic nhu tron long-term AI library voi tai lieu upload ngan han cua tung user.

## Nguon Benchmark Chinh

- FastAPI Metadata/OpenAPI/Docs URL: https://fastapi.tiangolo.com/tutorial/metadata/
- OWASP API Security Project / API Security Top 10 2023: https://owasp.org/www-project-api-security/
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- OWASP GenAI Security / LLM Top 10: https://genai.owasp.org/llm-top-10/
- OpenTelemetry concepts: https://opentelemetry.io/docs/concepts/

## Nguyen Tac Audit

- Khong cam knowledge base cua AI. San pham AI can grounding dai han du lon, co provenance va co governance.
- Phan biet ro data theo vong doi:
  - `library`: tri thuc dai han cua to chuc, Admin quan ly, AI dung hidden de grounding.
  - `contextual`: tai lieu ngan han owner-scoped cua Teacher/Student, dung cho task/session/user flow rieng.
  - `generated`: outline, lesson, blocks, citations, audit events, job outputs.
- Client UI khong quyet dinh quyen. Backend service/repository phai enforce role, organization, ownership va scope.
- API contract phai du de tich hop: OpenAPI/Swagger co tags, security scheme, request/response examples va error schema.
- Observability phai bao phu ca app request, AI generation, RAG retrieval, ingestion, moderation va auth.
- Phan quyen production phai tach `system_admin`/Owner he thong voi `admin` cua tung organization. Owner dung de bootstrap/van hanh tenant; Admin to chuc khong phai quyen cao nhat platform.

## Da Co Trong Project

- FastAPI app da expose Swagger/OpenAPI tai `/api/v1/docs` va `/api/v1/openapi.json`.
- Auth foundation da co demo provider va Supabase provider bridge (`AUTH_PROVIDER=demo|supabase`), refresh/logout/get-user, profile role/organization va Admin invite foundation.
- V4-043 da them System Admin/Owner foundation:
  - `profiles.role` co `system_admin`, khong co bang `admin` rieng.
  - Owner duoc bootstrap bang Supabase-authenticated user khop `SYSTEM_ADMIN_EMAILS` hoac `SYSTEM_ADMIN_USER_IDS` trong `.env`.
  - Public demo login van chi co Admin/Teacher/Student.
  - Normal invite flow khong tao duoc `system_admin`; System Admin co API rieng de tao organization va tao invite Admin dau tien.
- V4-045 da them organization Admin user management:
  - Admin list/search/filter Teacher/Student profiles trong organization.
  - Admin disable/enable Teacher/Student ma khong delete auth/user history.
  - Backend reject Admin/System Admin target, cross-org target va non-admin caller.
  - Demo-login seed demo profiles vao repository persistence neu thieu, nhung khong reactivate profile da disabled.
- V4-046 da them CRUD management expansion production-safe:
  - Admin sua name/email/status Teacher/Student trong organization; role immutable va Admin/System Admin khong bi Org Admin sua.
  - Admin rename/archive knowledge library documents; Teacher/Student chi sua/luu tru contextual documents minh thay duoc.
  - Teacher sua/archive class va rename/archive lesson minh so huu; class/lesson archived bi loai khoi active Teacher/Admin/Student/export/progress flows.
  - Delete trong UI la soft archive/disable, khong hard delete du lieu hoc tap/audit.
- Role/organization/class membership guards da co test cho cac flow chinh.
- RAG, upload, ingestion, re-index, generation jobs, audit events va content persistence da co repository boundary va tests.
- V4-028 da sua workflow knowledge:
  - Admin quan ly `library` dai han.
  - Teacher/Student chi thay va quan ly `contextual` owner-scoped.
  - Teacher RAG/generation tu dong dung hidden active library + contextual duoc chon.
- V4-035 da sua usability va runtime flow quan trong:
  - UI co taskbar/workspace navigation theo role.
  - `.env` that la runtime config; `.env.example` chi la template/checklist.
  - Quick demo login 3 role bat rieng bang `ENABLE_DEMO_LOGIN=true`, khong thay the Supabase/Postgres auth/repository mode.
  - Admin invite/account persistence va PDF upload real repository da co regression/smoke evidence.
- V4-036 da dong gap export audit TD-010:
  - Markdown/PPTX/PDF export co backend record/history va lesson audit event.
  - Teacher/Student UI record export truoc khi download/print.
  - Permission backend guard Teacher owner, Student published membership va Admin same organization.
- V4-037 da dong 3 blocker review production:
  - Teacher enrollment dung active auth profiles cung organization, khong chi hard-coded demo accounts, nen invited/Supabase students co the duoc add vao class.
  - URL ingestion validate moi redirect `Location` truoc khi follow, tranh fetch private/loopback target qua public redirect.
  - Postgres document upload jobs ghi `actor_id`/`actor_role`, giu job queue visible cho non-admin actor.
- BUG-004 da dong review tenant/security/reliability moi:
  - Duplicate document lookup trong PDF/URL upload scope theo `organization_id`, `knowledge_scope`, `owner_user_id`, tranh Teacher/Student skip/reuse/leak Admin library hoac contextual docs cua user khac.
  - URL ingestion resolve DNS va reject private/link-local/loopback/reserved/multicast/unspecified IP truoc khi fetch va trong redirect handler.
  - `generation_jobs` co `organization_id`; Admin Postgres job history filter theo organization.
  - Queued PDF upload khi embedding provider/embed_text loi se mark document/job `failed` voi failure message, khong ket `processing`.
  - Swagger create-course example dung `learning_goals`, khop schema runtime.

## Gap P0 Can Bo Sung

### 1. Register / Invite Acceptance / JWT Session Lifecycle

Trang thai hien tai:

- Co demo login/logout va Supabase auth bridge.
- Co Admin invite foundation va V4-029 invite acceptance/register flow.
- Co UI/API `POST /api/v1/auth/invites/accept` cho user nhan invite, set password, map profile role/org va login vao workspace.
- Co profile `status=active|disabled` va current-user guard reject JWT cu khi profile bi disabled.
- Co `system_admin` bootstrap foundation cho owner production, tach khoi Admin to chuc va khong nam trong quick demo login.
- Co Admin UI/API quan ly Teacher/Student active/disabled trong organization, khong chi tao invite pending.
- Con thieu password reset email, MFA, email verification UX tuy theo Supabase project config, revoke-all sessions va security matrix chi tiet cho refresh rotation/session revocation.

Can lam:

- V4-029 da xong foundation: Admin tao invite -> user nhap invite code/email/name/password -> profile mapped role/org -> session duoc luu, disabled profile bi reject.
- V4-045 da xong foundation: Admin list/search/filter Teacher/Student va disable/enable profile cung organization; disabled demo/profile bi chan login/session API request tiep theo.
- V4-046 da xong CRUD an toan cho Admin/Teacher: user editable name/email/status, document title/archive, class edit/archive, lesson rename/archive voi scope guard va active filters.
- Future auth enhancement neu can: password reset, MFA, email verification UX, revoke all sessions, refresh token rotation policy matrix, owner rotation/break-glass process.
- Tieu chuan tiep theo: khong trust role tu user-editable metadata, test role spoofing/wrong org/expired-used invite/disabled user tiep tuc la regression gate.

### 2. API Contract / Swagger Chat Luong Production

Trang thai hien tai:

- V4-030 da nang Swagger/OpenAPI thanh API contract co tag groups, BearerAuth security scheme, protected/public endpoint security metadata, request examples va common error responses.
- Da co API inventory doc `docs/version4/API_CONTRACT_INVENTORY.md` noi ro endpoint public/protected/role groups.
- Tests `backend/tests/test_openapi_contract.py` guard OpenAPI JSON sinh duoc, security scheme, tags, examples va operation id unique.

Can lam:

- V4-030 da xong foundation.
- Future enhancement: them response examples chi tiet hon cho tung domain endpoint neu can SDK/client generation chinh thuc.
- Manual validation tiep tuc: mo `/api/v1/docs`, test auth header va request examples.

### 3. Logging / Observability / Audit Cho AI Va He Thong

Trang thai hien tai:

- V4-031 da xong foundation: request id middleware, contextvars actor/request, structured JSON logger, secret sanitization va workflow event logs cho ingestion/RAG/AI/lesson audit.
- Audit events cho lesson moderation da co.
- Generation jobs co lifecycle.

Can lam:

- V4-031 da xong foundation.
- Future enhancement: OpenTelemetry exporter/collector, metrics dashboard, frontend error surface hien request_id, token/cost estimate chinh xac hon neu provider tra usage.

### 4. AI Safety / RAG Quality / Hallucination Controls

Trang thai hien tai:

- V4-032 da xong foundation: `backend/app/ai_safety.py`, prompt-injection/doc-poisoning detection/sanitization, untrusted-source prompt policy, deterministic groundedness/citation evaluator va retrieval eval fixture.
- AI output schema validation va citation warnings da co.
- RAG co citations va hidden library fallback sau V4-028.

Can lam:

- V4-032 da xong foundation.
- Future enhancement: LLM judge async, org/course-specific citation thresholds, larger eval dataset, richer document trust review workflow.

### 5. Data Governance / Storage / Retention

Trang thai hien tai:

- `data/books/` local-only, khong deploy/commit raw PDFs.
- Supabase/Postgres persistence co nhieu schema path.
- V4-033 da them storage provider boundary `DOCUMENT_STORAGE_PROVIDER=metadata|supabase`, raw storage metadata, Supabase Storage upload server-side opt-in, contextual TTL, library/contextual quota, provenance JSON va Admin export/delete contextual docs owner-scoped.

Can lam:

- V4-033 da xong foundation.
- Future enhancement: scheduled cleanup worker cho contextual docs het han, signed download URL neu user can xem raw file, Supabase Storage bucket/policy migration chinh thuc, backup/restore drill tu dong, va hard-delete workflow co operator confirmation.

## Workflow Logic Rule Sau Audit

- Admin:
  - Quan ly library dai han, invite user, quan ly Teacher/Student active/disabled trong organization, publish/moderate lesson, xem audit/system health.
  - Khong can thay contextual docs rieng cua user tru khi co support/debug/audit permission ro.
- Teacher:
  - Tao course/class, add student, upload contextual docs, RAG/generate/review lesson.
  - Khong quan ly library dai han, nhung AI duoc dung library hidden khi generation/retrieval.
- Student:
  - Xem lesson published, track progress, upload contextual docs cho tutor/learning flow ca nhan.
  - Khong thay Teacher draft/Admin library.

## Ket Luan

V4-028 sua loi product logic lon nhat trong knowledge workflow; V4-029 them auth/register/JWT lifecycle foundation; V4-030 nang Swagger/API contract; V4-031 them structured logging/observability; V4-032 them AI safety/groundedness guardrail; V4-033 them storage governance foundation; V4-034 nang frontend professional hon; V4-035 sua taskbar/usability, `.env` runtime semantics, Admin invite persistence va upload PDF real repository. Version 4 backlog hien tai da co foundation/evidence cho cac gap production chinh; feature moi sau nay can mo backlog/exec plan rieng.

V4-036 bo sung export records/history cho lesson export, dong tech debt TD-010 ma khong them server-side PDF renderer nang. V4-037 sua cac blocker review production ve invited student enrollment, URL redirect SSRF va upload job visibility. BUG-004 tiep tuc dong cac finding tenant/security/reliability moi ve duplicate document scope, DNS SSRF private resolution, Admin job org scope, queued upload embedding failure va OpenAPI example. V4-045 dong gap Admin user management: Admin organization quan ly duoc Teacher/Student that thay vi chi co pending invites. V4-046 dong gap CRUD quan ly co ban cho knowledge/users/classes/lessons bang soft archive/disable de phu hop production. Server-side PDF generation van la future enhancement rieng neu can output consistency tuyet doi giua trinh duyet.
