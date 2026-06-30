# Product Review - TeachFlow AI Before V4 Implementation

## Diem Manh Hien Tai

- V1 demo flow da chay end-to-end: Teacher -> RAG -> Lesson Studio -> Admin -> Student -> Presentation/PDF.
- Backend co test kha tot cho role, membership, RAG, AI schema, lesson status, admin flow.
- V2 da bat dau co repository boundary cho course/class/membership.
- P1 exports/upload/audit da co, giup demo co chieu sau hon MVP ban dau.

## Van De Chinh

### 1. Frontend dang co cam giac demo hon la product

`frontend/src/App.tsx` qua lon va giu nhieu surface/state trong mot file. UI da co redesign truoc do nhung van thieu design system va component boundaries ro.

Tac dong:

- Kho nang chat luong UI tiep.
- Kho them V2/V3 features nhu job lifecycle, progress, tutor, analytics.
- De tao layout/state bug khi them action moi.

### 2. Teacher workflow chua du ro ve next action

San pham co nhieu buoc nhung UI chua bien no thanh mot workflow timeline/command surface ro rang.

Tac dong:

- User moi co the khong biet can tao course, chon source, generate outline hay approve block tiep theo.
- AI/RAG state chua tao du trust.

### 3. Lesson Studio chua xung tam san pham

Lesson Studio la core value nhung can cam giac nhu editor production: block list, editor, citation inspector, warning, autosave/job status.

Tac dong:

- Demo co the chay nhung chua thuyet phuc ve chat luong san pham.
- Citation/warning khong tao du cam giac governance.

### 4. Backend van con monolith va demo auth/in-memory debt

`backend/main.py` qua lon. V2 da them repository boundary nhung auth, jobs, audit, content persistence chua hoan tat het.

Tac dong:

- Neu them V3/V4 features nhanh se tang rui ro regression.
- Clean architecture can tien theo vertical slice, khong tach toan bo mot lan.

### 5. Hardcoded UI demo copy/data can duoc co lap

Mot so default/demo values hien nam trong frontend constants. Default form data duoc chap nhan cho demo seed, nhung khong duoc lan thanh harddata product.

Tac dong:

- De nham giua seed/demo va production state.
- Kho test voi data that.

## Review Ket Luan

Version 4 nen uu tien theo thu tu:

1. Hoan tat V2-003 content persistence dang active de khong de repo dang do.
2. Tao UI design system va Teacher workspace moi theo concept.
3. QA browser desktop/mobile.
4. Cap nhat backlog V4/V2/V3 ro rang thay vi danh dau tat ca production/growth features la xong.

## Design Reference

- Concept: `docs/version4/assets/teachflow-v4-teacher-workspace-concept.png`
- Concept V4-P1 Admin/Student: `docs/version4/assets/teachflow-v4-admin-student-concept.png`

## Quality Bar V4

- UI phai pass rendered QA, khong chi pass test.
- Code phai tách reusable components/tokens o muc vua du, khong over-refactor.
- V1 demo flow phai tiep tuc pass qua `./init.sh`.

## Review Sau V4-001

Da cai thien:

- Teacher khong con vao generic role cards truoc; first screen la workspace soan giang.
- Timeline va metric panels da tinh tu state that thay vi fake metric.
- Lesson Studio co block rail, editor va citation inspector rieng.
- Source strip va job queue giup trang thai RAG/AI ro hon.
- Motion CSS co reduced-motion.
- Route audit events khong con tao console 422.

Con lech concept:

- First viewport van giu course/class setup visible de dam bao Teacher tao du lieu nhanh; concept goc dat Lesson Studio cao hon.
- Admin/Student surface chua duoc redesign V4-P1.
- `App.tsx` van lon; V4-001 da them helper/UI primitives nhung V4-P2 can tiep tuc split feature modules.

Ket luan:

- V4-001 dat muc product polish dau tien, nhung chua dong nghia "toan bo Version 4 da xong". Sau V4-002, Admin/Student polish da duoc nang cap; neu tiep tuc Version 4, uu tien V4-P2 frontend split/backend modularization plan.

## Review Sau V4-002

Da cai thien:

- Admin review surface da co queue/detail rieng, thay status, warning count, citation coverage va evidence truoc khi publish/request/reject.
- Admin action panel co feedback ro, khong tron voi block content dai.
- Student dashboard/reading surface da co class context, continue learning, reading canvas, block navigation, citation panel va presentation/PDF controls ro hon.
- Future progress/tutor surface chi la disabled slot co copy ro, khong fake progress/tutor data.
- Admin/Student dung chung V4 visual language voi Teacher workspace: metric cards, evidence panels, focus states, responsive collapse.

Con lech concept:

- DashboardShell phia tren van giu role verification/allowed-action cards cua MVP; V4-P2 co the tach shell va giam redundancy neu khong can trong demo.
- `App.tsx` van lon; V4-002 them helper logic nhung chua tach Admin/Student component module rieng.
- Student progress/tutor moi la slot UI, chua implement V2-P1 progress/tutor backend.

Ket luan:

- V4-P0/P1 UI polish chinh da co: Teacher, Admin va Student deu co surface tot hon va rendered QA pass. Neu tiep tuc Version 4, uu tien V4-P2 split frontend monolith va backend modularization plan; neu uu tien product value, mo V2-P1 Student progress hoac grounded tutor theo docs version 2.

## Review Sau V4-003

Da cai thien:

- Student workspace khong con nam trong `App.tsx`; da tach sang `frontend/src/features/student/StudentWorkspace.tsx` voi typed prop `token`.
- Presentation component dung chung cho Teacher/Student da tach sang `frontend/src/presentation/LessonPresentation.tsx`.
- Error helper duoc tach sang `frontend/src/errors.ts`, giam duplicate khi tiep tuc tach feature modules.
- `App.tsx` giam xuong 3334 lines va role Student chi compose `StudentWorkspace`, phu hop huong V4-P2 `US-412`.
- Rendered QA Student progress sau refactor pass desktop/mobile, console issues va bad API responses empty.

Con lech:

- Teacher workspace va Admin moderation van con nam trong `App.tsx`, can tach theo module rieng neu tiep tuc V4-P2.
- Backend `main.py` van monolith; nen lam `US-413` bang plan/module split truoc khi tach code hang loat.

Ket luan:

- V4-003 la buoc architecture cleanup dau tien, behavior-preserving. Nen tiep tuc tach Admin/Teacher module hoac viet backend modularization plan truoc khi them V3 tutor/adaptive features lon.

## Review Sau V4-004

Da cai thien:

- Da co `docs/version4/BACKEND_MODULARIZATION_PLAN.md` lam migration plan cho `backend/main.py` monolith.
- Plan map current backend areas sang target modules: auth, learning, progress, content, audit, jobs, knowledge, AI, admin, export va API routes.
- Plan dinh nghia dependency direction `api/routes -> services/use_cases -> repositories/providers protocols -> infrastructure adapters`, giu business rules o service layer.
- Moi migration slice co verification command va rollback note, giup tach code theo tung buoc thay vi refactor hang loat.
- API compatibility rules giu `/api/v1`, auth/course/class/document/RAG/lesson/admin/student/progress/job routes va response model backward-compatible.

Con lech:

- `backend/main.py` van chua duoc tach code; V4-004 la planning/architecture slice de giam rui ro.
- Teacher workspace va Admin moderation van con nam trong `App.tsx`; V4-P2 van can tach tiep module frontend.
- Durable worker/retry/cancel va V3 adaptive/tutor van phu thuoc V2/V4 architecture cleanup tiep theo.

Ket luan:

- V4-004 hoan thanh phan plan cho `US-413`. Buoc coding nen bat dau bang app factory/core config hoac learning/progress module split theo plan, kem `./init.sh` va targeted backend tests sau moi slice.

## Review Sau V4-005

Da cai thien:

- Admin moderation/invite/knowledge surface da tach khoi `App.tsx` sang `frontend/src/features/admin/AdminWorkspace.tsx`.
- Shared knowledge upload/document status controls da tach sang `frontend/src/features/knowledge/`, giup Teacher/Admin dung chung thay vi copy component trong app shell.
- `App.tsx` giam tu 3334 xuong 2561 lines va role Admin chi compose module moi.
- Behavior Admin duoc giu nguyen: review queue, block rail, citation evidence, publish/request/reject controls, knowledge panel va invite panel van render pass desktop/mobile.
- Rendered QA Admin desktop/mobile pass voi console issues va bad API responses empty.

Con lech:

- Teacher workspace va Lesson Studio van con nam trong `App.tsx`; day la block lon tiep theo cua `US-412`.
- Backend code van chua tach theo V4-004 plan; moi co migration plan.

Ket luan:

- V4-005 tiep tuc giam frontend monolith dung huong. Next V4-P2 nen tach Teacher workspace thanh module rieng truoc khi them V3 adaptive/tutor UI, hoac bat dau backend app factory slice nho.

## Review Sau V4-006

Da cai thien:

- Teacher workflow/Lesson Studio da tach khoi `App.tsx` sang `frontend/src/features/teacher/TeacherWorkspace.tsx`.
- Teacher-only default data, draft converters va audit label nam trong module Teacher thay vi app shell.
- `displayName` thanh shared label helper trong `frontend/src/labels.ts`, giam duplicate giua shell va feature modules.
- `App.tsx` giam xuong 627 lines va chi con app shell/auth/role composition: Teacher/Admin/Student modules duoc compose rieng.
- Rendered QA Teacher desktop/mobile pass voi workflow timeline, source strip, Lesson Studio, citation inspector, progress panel va job queue.

Con lech:

- Backend code van chua tach theo V4-004 plan; V4-P2 frontend split chinh da xong nhung backend modularization moi o muc plan.
- Teacher module con lon vi Lesson Studio la surface phuc tap; neu can toi uu tiep, tach Lesson Studio subcomponents trong feature Teacher.

Ket luan:

- V4-P2 `US-412` da dat muc chinh: `App.tsx` khong con giu detail logic cho Teacher/Admin/Student. Next nen uu tien backend app factory/core config slice theo V4-004 hoac quay ve V2 durable worker/tutor neu uu tien product value.

## Review Sau V4-007

Da cai thien:

- Backend da co package entrypoint `backend/app/main.py` va root `backend/main.py` compatibility re-export.
- Dev command cu `uv run fastapi dev main.py ...` van chay duoc, vi root entrypoint van expose `app`.
- Tests import `main` tiep tuc pass, giam rui ro cho migration slices sau.
- Day la coding slice dau tien cua V4-004 backend modularization plan, khong doi API/route/service behavior.

Con lech:

- Backend route/service/repository van con nam chung trong `backend/app/main.py`; moi tach duoc package/entrypoint.
- Slice tiep theo nen tach auth hoac learning/progress module nho, co compatibility exports neu tests cu can.

Ket luan:

- V4-007 tao restart path sach cho backend modularization. Next nen lam Slice 2 Auth module hoac Slice 3 Learning/progress module theo plan, khong refactor hang loat.

## Review Sau V4-008

Da cai thien:

- Backend core config boundary da co tai `backend/app/core/config.py`.
- Env reader/parser, CORS origins, API base/version, embedding dimensions, AI rate-limit defaults va database conninfo khong con nam truc tiep trong `backend/app/main.py`.
- `backend/app/main.py` van giu behavior/API routes hien co bang import compatibility, nen tests cu khong can doi.
- Day la buoc phu hop Slice 1 cua backend modularization plan, tao nen cho Slice 2 Auth hoac Slice 3 Learning/progress.

Con lech:

- Domain schemas/routes/services/repositories van con trong `backend/app/main.py`.
- Mot so mode selection van doc `os.getenv("LEARNING_REPOSITORY", ...)` tai call site; co the chuyen tiep khi tach repository module tuong ung.

Ket luan:

- V4-008 giam rui ro env/config scatter. Next backend slice nen tach auth module hoac learning/progress module nho, giu compatibility exports den khi tests duoc cap nhat.

## Review Sau V4-009

Da cai thien:

- Backend core helper boundary da co them `backend/app/core/time.py`, `backend/app/core/errors.py` va `backend/app/core/security.py`.
- `_now_iso`, common HTTP auth/not-found errors, Bearer token parsing, generation job error sanitization va organization fallback/scope helpers khong con nam truc tiep trong `backend/app/main.py`.
- Da them `backend/tests/test_core_helpers.py` de khoa behavior helper core: timestamp timezone-aware, status code/header, token parsing, org-demo fallback va khong leak unexpected exception detail.
- Auth/role/course-class/student-progress regression targeted va full backend suite pass, giup slice nay an toan truoc khi tach auth/learning/progress lon hon.

Con lech:

- Domain schemas, repositories, services va FastAPI route handlers van con trong `backend/app/main.py`.
- Auth module chua tach rieng; `get_current_user`, route dependencies va auth repository/provider van o monolith.
- Learning/progress repository/service module split van la buoc tiep theo trong backend modularization plan.

Ket luan:

- V4-009 la slice core cleanup nho, behavior-preserving, hoan tat them mot phan Slice 1 cua backend modularization. Next nen tach auth module hoac learning/progress module theo `docs/version4/BACKEND_MODULARIZATION_PLAN.md`, giu compatibility exports va targeted tests cho role/org-scope.

## Review Sau V4-010

Da cai thien:

- Backend auth package da co `backend/app/auth/schemas.py` va `backend/app/auth/ports.py`.
- `Role`, `UserProfile`, login/session/profile/invite/Supabase auth schemas va auth provider/repository protocols khong con dinh nghia truc tiep trong `backend/app/main.py`.
- `backend/app/main.py` van import/re-export compatibility names, nen route response models va tests import `main` khong can doi.
- `backend/tests/test_auth_module_boundaries.py` khoa module boundary moi va compatibility export tu `main`.

Con lech:

- `InMemoryAuthRepository`, `PostgresAuthRepository`, `SupabaseAuthRestClient`, auth service functions va auth routes van con trong `backend/app/main.py`.
- `UserProfile`/`Role` van duoc nhieu domain dung chung; khi tach learning/progress can quyet dinh dat identity models trong auth hay shared identity boundary.

Ket luan:

- V4-010 la buoc dau cua Slice 2 Auth module, giu behavior an toan. Next backend slice nen tach auth repositories/Supabase client hoac tach learning/progress schemas/ports, nhung moi slice van can compatibility exports va targeted auth/role/org-scope tests.

## Review Sau V4-011

Da cai thien:

- Auth demo seed, schema SQL, memory/Postgres auth repository adapters va Supabase Auth REST client da tach sang `backend/app/auth/`.
- `backend/app/main.py` khong con dinh nghia truc tiep `InMemoryAuthRepository`, `PostgresAuthRepository`, `SupabaseAuthRestClient` hoac auth schema SQL, nhung van import/re-export de giu compatibility.
- `backend/tests/test_auth_module_boundaries.py` cover them memory invite idempotency, schema SQL va adapter compatibility exports.
- Auth targeted, role/ownership/lesson/student-progress regression va full backend suite deu pass sau refactor.

Con lech:

- Auth service functions va FastAPI auth routes van con trong `backend/app/main.py`.
- `get_auth_repository`, `get_supabase_auth_client`, `get_current_user` va `require_roles` van la dependency/service glue trong monolith.

Ket luan:

- V4-011 hoan tat phan adapter dau tien cua auth module. Next nen tach auth services/dependencies ra module rieng hoac chuyen sang learning/progress module split, tuy theo rui ro cua slice tiep theo.

## Review Sau V4-012

Da cai thien:

- Auth service/session logic da tach sang `backend/app/auth/services.py`.
- Demo session store, login/refresh/current-user/logout, invite service helpers, auth provider/repository/client factories va `require_role` khong con dinh nghia truc tiep trong `backend/app/main.py`.
- `MessageResponse` da nam trong auth schemas de logout service khong phu thuoc nguoc vao monolith.
- `backend/app/main.py` hien con giu FastAPI route decorators/dependency wrappers va import/re-export compatibility names.

Con lech:

- `get_current_user` va `require_roles` FastAPI dependency wrappers van con trong `backend/app/main.py`.
- Auth routes van dang register truc tiep trong monolith; slice tiep theo co the tach `app/api/routes/auth.py` sau khi dependency boundary on dinh.

Ket luan:

- V4-012 hoan thanh phan service cua auth module theo huong behavior-preserving. Next nen tach FastAPI auth dependencies/routes hoac chuyen sang learning/progress module split neu muon giam rui ro route refactor.

## Review Sau V4-013

Da cai thien:

- FastAPI auth dependency wrappers `get_current_user` va `require_roles` da tach sang `backend/app/auth/dependencies.py`.
- `backend/app/main.py` van import/re-export dependency names de route decorators hien co khong doi.
- Boundary test cover dependency module import, `require_roles` 403 behavior va compatibility exports tu `main`.

Con lech:

- Auth route handlers van register truc tiep trong `backend/app/main.py`.
- Route split sang `app/api/routes/auth.py` la buoc tiep theo neu tiep tuc auth module; can can than voi FastAPI app registration va response models.

Ket luan:

- V4-013 hoan tat auth module boundary o muc schemas/ports/adapters/services/dependencies. Next nen tach auth routes neu tiep tuc Slice 2, hoac chuyen sang learning/progress module split theo plan de giam monolith theo domain khac.

## Review Sau V4-014

Da cai thien:

- Auth API routes `/auth/demo-accounts`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/invites` va `/me` da tach sang `backend/app/auth/routes.py`.
- `backend/app/main.py` include auth router va khong con dinh nghia truc tiep auth route handlers.
- Auth module hien co boundary day du cho schemas, ports, demo seed, repositories, Supabase client, services, dependencies va routes.
- Boundary test verify router paths va included-router registration tren app chinh.

Con lech:

- Dashboard routes van o `backend/app/main.py` vi chung lien quan workspace shell hon la auth module thuan.
- Learning/progress/content/knowledge routes va services van con trong monolith.

Ket luan:

- V4-014 hoan tat Slice 2 Auth module o muc an toan. Next nen chuyen sang learning/progress module split theo `docs/version4/BACKEND_MODULARIZATION_PLAN.md` de tiep tuc giam backend monolith ma khong refactor route qua rong.

## Review Sau V4-015

Da cai thien:

- Learning package da co `backend/app/learning/schemas.py` va `backend/app/learning/ports.py`.
- `StudentLevel`, course/class/membership request-response schemas va `LearningRepository` protocol khong con dinh nghia truc tiep trong `backend/app/main.py`.
- `backend/app/main.py` van import/re-export compatibility names, nen route handlers, root `main.py` compatibility va tests hien co khong doi.
- Boundary test moi verify learning schema/port imports va `main` compatibility exports.

Con lech:

- `InMemoryLearningRepository`, `PostgresLearningRepository`, learning service functions va learning routes van con trong `backend/app/main.py`.
- Progress schemas/repository/service van con o monolith; can tach bang slice rieng de tranh refactor qua rong.

Ket luan:

- V4-015 bat dau Slice 3 Learning/progress module o muc schemas/ports an toan. Next nen tach learning repository/service hoac progress schemas/ports, tiep tuc giu API compatibility va targeted tests cho ownership, membership, org scope.

## Review Sau V4-016

Da cai thien:

- Learning repository adapters da tach sang `backend/app/learning/repositories.py`.
- `learning_schema_sql`, `InMemoryLearningRepository`, `PostgresLearningRepository`, memory singleton va `get_learning_repository` khong con dinh nghia truc tiep trong `backend/app/main.py`.
- Memory learning store hien nam trong learning module; `reset_learning_store_for_tests()` reset qua repository method, giu test/demo behavior on dinh.
- Boundary test verify repository module exports, schema SQL guard, memory/postgres factory mode va compatibility exports tu `main`.

Con lech:

- Learning service functions (`create_course`, `create_class_profile`, membership/list summaries) va FastAPI learning routes van con trong `backend/app/main.py`.
- Progress schemas/repository/service/routes van con o monolith.

Ket luan:

- V4-016 tiep tuc Slice 3 theo huong adapter boundary sach va khong doi contract. Next nen tach learning service functions hoac progress schemas/ports, giu targeted tests cho ownership, membership va org scope.

## Review Sau V4-017

Da cai thien:

- Learning service layer da tach sang `backend/app/learning/services.py`.
- Ownership guards, course/class CRUD services, available student helper, membership add/list va `_class_ids_for_student` khong con dinh nghia truc tiep trong `backend/app/main.py`.
- `backend/app/main.py` van import compatibility names de FastAPI learning routes va content/student lesson logic hien co khong doi.
- Boundary test verify service module behavior bang `InMemoryLearningRepository`, main compatibility exports cho public service functions va membership summary.

Con lech:

- FastAPI learning routes `/courses`, `/classes/{class_id}/students`, `/student/classes` van con trong `backend/app/main.py`.
- Progress schemas/repository/service/routes van con o monolith.

Ket luan:

- V4-017 hoan tat learning module boundary o muc schemas/ports/repositories/services. Next nen tach learning routes thanh router rieng hoac bat dau progress module split, giu API path va response contract.

## Review Sau V4-018

Da cai thien:

- Learning API routes da tach sang `backend/app/learning/routes.py`.
- `backend/app/main.py` include learning router va khong con dinh nghia truc tiep cac route `/students`, `/courses`, `/courses/{course_id}/classes`, `/classes/{class_id}/students`, `/student/classes`.
- Learning module hien co boundary day du cho schemas, ports, repositories, services va routes.
- Boundary test verify router paths va included-router registration tren app chinh.

Con lech:

- Student lesson/progress routes van con trong `backend/app/main.py` vi thuoc progress/content boundary tiep theo.
- Progress schemas/repository/service/routes, content/audit/jobs/knowledge/AI modules van con o monolith.

Ket luan:

- V4-018 hoan tat learning module split o muc an toan. Next nen bat dau progress module split theo Slice 3 hoac chuyen sang content/audit/jobs Slice 4 neu uu tien tiep tuc giam monolith.

## Review Sau V4-019

Da cai thien:

- Progress package da co `backend/app/progress/schemas.py` va `backend/app/progress/ports.py`.
- Student progress request/record/response/Teacher aggregate summary schemas va `ProgressRepository` protocol khong con dinh nghia truc tiep trong `backend/app/main.py`.
- `backend/app/main.py` van import/re-export compatibility names, nen progress repositories/services/routes hien co khong doi.
- Boundary test verify progress schema/port imports, validation va `main` compatibility exports.

Con lech:

- `InMemoryProgressRepository`, `PostgresProgressRepository`, `get_progress_repository`, progress service functions va FastAPI progress routes van con trong `backend/app/main.py`.
- Student lesson list/detail routes van con trong monolith vi thuoc content/student boundary tiep theo.

Ket luan:

- V4-019 bat dau progress module split o muc schemas/ports an toan. Next nen tach progress repository adapters hoac service functions theo Slice 3, giu Student membership/org-scope regression va API path `/api/v1` khong doi.

## Review Sau V4-020

Da cai thien:

- Progress repository adapters da tach sang `backend/app/progress/repositories.py`.
- `progress_schema_sql`, `InMemoryProgressRepository`, `PostgresProgressRepository`, memory singleton va `get_progress_repository` khong con dinh nghia truc tiep trong `backend/app/main.py`.
- Memory progress store hien nam trong progress module; reset test/demo dung repository `reset()` method.
- Boundary test verify schema SQL guard, memory adapter behavior, factory mode va compatibility exports tu `main`.

Con lech:

- Progress service functions (`get_student_lesson_progress`, `update_student_lesson_progress`, `list_teacher_class_progress`) va FastAPI progress routes van con trong `backend/app/main.py`.
- Student lesson list/detail routes van con trong content/student boundary tiep theo.

Ket luan:

- V4-020 hoan tat progress boundary o muc schemas/ports/repositories. Next nen tach progress service functions hoac progress routes theo Slice 3, giu Student membership/org-scope regression va response contract.

## Review Sau V4-021

Da cai thien:

- Audit package da co `backend/app/audit/schemas.py` va `backend/app/audit/ports.py`.
- `LessonAuditEventResponse` va `AuditRepository` protocol khong con dinh nghia truc tiep trong `backend/app/main.py`.
- `backend/app/main.py` van import/re-export compatibility names, nen audit repositories/services/routes hien co khong doi.
- Boundary test verify audit schema/port imports va compatibility exports tu `main`.

Con lech:

- `InMemoryAuditEventRepository`, `PostgresAuditEventRepository`, `audit_schema_sql`, `get_audit_repository`, audit service functions va audit route van con trong `backend/app/main.py`.
- Content schemas/repository van con trong monolith; can tach content/shared citation boundary truoc khi tach progress/content routes sau.

Ket luan:

- V4-021 bat dau Slice 4 o muc audit schemas/ports an toan. Next nen tach audit repository adapters hoac chuan bi content/shared citation schema boundary de giam monolith tiep.

## Review Sau V4-022

Da cai thien:

- Audit repository adapters da tach sang `backend/app/audit/repositories.py`.
- `audit_schema_sql`, `InMemoryAuditEventRepository`, `PostgresAuditEventRepository`, memory singleton va `get_audit_repository` khong con dinh nghia truc tiep trong `backend/app/main.py`.
- Memory audit store hien nam trong audit module; reset test/demo dung repository `reset()` method.
- Boundary test verify schema SQL guard, memory adapter behavior, factory mode va compatibility exports tu `main`.

Con lech:

- Audit service functions va audit route van con trong `backend/app/main.py`.
- Content schemas/repository van con trong monolith; can tach content/shared citation boundary truoc khi tach content/progress routes sau.

Ket luan:

- V4-022 hoan tat audit boundary o muc schemas/ports/repositories. Next nen chuan bi content/shared citation schema boundary hoac tach audit service functions neu dependency risk thap.

## Review Sau V4-023

Da cai thien:

- Jobs package da co `backend/app/jobs/schemas.py` va `backend/app/jobs/ports.py`.
- `GenerationJobStatus`, `GenerationJobResponse` va `GenerationJobRepository` protocol khong con dinh nghia truc tiep trong `backend/app/main.py`.
- `backend/app/main.py` van import/re-export compatibility names, nen generation job repositories/services/routes hien co khong doi.
- Boundary test verify job status literals, response schema va compatibility exports tu `main`.

Con lech:

- `InMemoryGenerationJobRepository`, `PostgresGenerationJobRepository`, `generation_job_schema_sql`, `get_generation_job_repository`, rate guard/job services va job route van con trong `backend/app/main.py`.
- Content/knowledge/AI schemas van con trong monolith; can tach tiep theo dependency-safe order.

Ket luan:

- V4-023 bat dau jobs module o muc schemas/ports an toan. Next nen tach jobs repository adapters hoac content/shared citation schema boundary de tiep tuc giam monolith.

## Review Sau V4-024

Da cai thien:

- Jobs repository adapters da tach sang `backend/app/jobs/repositories.py`.
- `generation_job_schema_sql`, `InMemoryGenerationJobRepository`, `PostgresGenerationJobRepository`, memory singleton va `get_generation_job_repository` khong con dinh nghia truc tiep trong `backend/app/main.py`.
- Memory generation job store hien nam trong jobs module; reset test/demo dung repository `reset()` method.
- Boundary test verify schema SQL guard, memory adapter behavior, factory mode va compatibility exports tu `main`.

Con lech:

- Rate guard/job service functions va job route van con trong `backend/app/main.py`.
- Content/knowledge/AI schemas van con trong monolith; can tach tiep theo dependency-safe order.

Ket luan:

- V4-024 hoan tat jobs boundary o muc schemas/ports/repositories. Next nen tach content/shared citation schema boundary hoac jobs services/routes neu dependency risk thap.

## Review Sau V4-025

Da cai thien:

- Jobs service layer da co `backend/app/jobs/services.py`.
- `list_generation_jobs` khong con dinh nghia truc tiep trong `backend/app/main.py`; main chi import/re-export compatibility name cho route va tests hien co.
- Role guard Teacher/Admin/Student cua job queue nam trong service moi va duoc boundary test cover bang `InMemoryGenerationJobRepository`.
- API `GET /api/v1/generation-jobs` giu nguyen path, status code, response payload va lifecycle semantics.

Con lech:

- FastAPI job route van con trong `backend/app/main.py`.
- Rate guard, generation flow helpers va cac content/knowledge/AI schemas van con trong monolith.

Ket luan:

- V4-025 hoan tat jobs boundary o muc schemas/ports/repositories/services cho list job queue. Next nen tach jobs routes neu muon dong gon module jobs, hoac tach content/shared citation schema boundary de giam dependency trung tam truoc khi tach AI generation flow.

## Review Sau V4-026

Da cai thien:

- Jobs route module da co `backend/app/jobs/routes.py`.
- `GET /api/v1/generation-jobs` khong con decorator truc tiep trong `backend/app/main.py`; app main include `jobs_router` tu jobs package.
- `generation_jobs_route` van duoc import/re-export trong `main.py` de giu compatibility cho tests/agent cu.
- Boundary test verify router co path job queue, app chinh include dung `jobs_router`, va API regression tiep tuc cover role guard Teacher/Admin/Student.

Con lech:

- Rate guard va generation flow helpers van con trong `backend/app/main.py`.
- Content/knowledge/AI schemas, repositories va routes van con trong monolith.
- FastAPI version hien tai giu included routers trong `app.routes` dang `_IncludedRouter`, nen route registration tests nen kiem tra `original_router` thay vi tim path truc tiep tren `main_app.routes`.

Ket luan:

- V4-026 dong gon jobs module cho list job queue o muc schemas/ports/repositories/services/routes. Next nen tach content/shared citation schema boundary de giam dependency trung tam truoc khi tach generation flow, hoac tach jobs lifecycle service write paths neu tiep tuc module jobs.

## Review Sau V4-027

Da cai thien:

- Knowledge package da co `backend/app/knowledge/schemas.py`.
- Document, upload job, web ingestion, embedding metadata, re-index, retrieval va citation schemas khong con dinh nghia truc tiep trong `backend/app/main.py`.
- `RetrievedChunkRecord` tro thanh schema dung chung cho RAG, outline source references va lesson block citations, chuan bi tach content schemas an toan hon.
- `backend/app/main.py` van import/re-export compatibility names de API, repositories, services va tests hien co khong doi.

Con lech:

- Knowledge repository, ingestion services, embedding providers va RAG routes van con trong `backend/app/main.py`.
- Product policy moi can tach ro long-term knowledge base do Admin quan ly voi short-term user-provided grounding documents cua Teacher/Student.

Ket luan:

- V4-027 hoan tat shared knowledge/citation schema boundary. Next nen implement access model moi: Admin-only long-term knowledge library hidden voi Teacher/Student raw management, Teacher/Student contextual uploads la short-term grounding source rieng, khong tro thanh knowledge base dai han.

## Review Sau V4-028

Da cai thien:

- Knowledge workflow da tach dung vong doi data:
  - `library`: kho tri thuc dai han cua AI theo organization, Admin-only list/upload/URL ingest/archive/reindex.
  - `contextual`: tai lieu ngữ canh ngan han owner-scoped cua Teacher/Student, dung cho user/task rieng va khong nhap vao library dai han.
- Backend document schema/persistence co `knowledge_scope` va `owner_user_id`, mac dinh backward-compatible cho document cu la `library`.
- `list_source_documents`, archive, re-index, upload va URL ingest enforce role/scope o service layer, khong dua vao client UI.
- Teacher RAG/generation khong con bat buoc chon library document. Backend tu dong ket hop hidden active completed library docs voi contextual docs Teacher chon, giup giam hallucination ma khong lo raw library management.
- Teacher UI doi thanh "Tai lieu ngu canh va RAG"; Admin UI ghi ro "Kho tri thuc dai han cua AI"; Student co panel "Tai lieu ngu canh ca nhan".
- Action targets/header shortcuts khong con dung label "Kho tri thuc" cho Teacher, tranh hieu nham Teacher dang quan tri long-term library.
- Them `docs/version4/PRODUCTION_GAP_ANALYSIS.md` de ghi nhan cac gap production con lai: register/JWT lifecycle, OpenAPI/Swagger contract, structured logging/observability, AI safety/eval va storage governance.

Con lech:

- Chua co TTL/cleanup/quota cho contextual documents.
- Chua co raw file storage durable cho upload library/contextual; raw local `data/books/` van chi la local pre-ingest, khong commit/deploy.
- FastAPI da co Swagger tai `/api/v1/docs`, nhung route tags/security examples/error schema chua dat quality API contract production.
- Auth foundation da co demo/Supabase bridge va invite, nhung chua co invite acceptance/register/password reset/session revocation UX day du.
- Logging hien moi o muc audit events/generation jobs; chua co request id, structured app logs, OpenTelemetry-ready telemetry va AI usage/cost/retrieval quality logs.

Ket luan:

- V4-028 sua loi product logic lon: khong duoc "cam knowledge" cua AI, ma phai co Admin-managed long-term library va user-scoped contextual docs.
- V4-029 sua gap auth/register/JWT foundation: invited Teacher/Student co UI/API accept invite, set password, map role/org, login vao workspace; disabled profile bi reject ke ca khi JWT cu con ton tai.
- V4-030 sua gap API contract: `/api/v1/openapi.json` co tag groups, BearerAuth security scheme, protected/public endpoint metadata, request examples, common error responses va API inventory doc.
- Backlog tiep theo nen uu tien theo `PRODUCTION_GAP_ANALYSIS.md`: V4-031 structured logging/observability, V4-032 AI safety/evaluation, V4-033 knowledge storage governance. Password reset/MFA/revoke-all sessions la auth enhancement rieng neu can.

## Review Sau V4-034

Da cai thien:

- Frontend khong con cam giac demo login lo thong tin ky thuat: login khong hien API base URL, khong hien mat khau demo, nhung van giu 3 quick role access Admin/Teacher/Student.
- App shell chuyen sang pattern enterprise ro hon: sidebar co brand/nav/context, topbar co workspace title, user role va logout.
- Admin/Student first screen khong con cac panel role-verification demo; vao thang workflow duyet lesson/hoc lesson that.
- Visual system moi trong `frontend/src/App.css` dong bo token mau, typography, form controls, button, status chip, panel, metric cards, lesson studio, citation inspector va responsive.
- Rendered QA desktop/mobile bang Playwright fallback pass console/page errors empty; forbidden API/password text khong visible.

Con lech:

- CSS van tap trung trong `App.css`; neu tiep tuc UI architecture nen tach token/base/components/features thanh file rieng hoac CSS modules sau khi feature surface on dinh.
- File upload control da polish bang `::file-selector-button`, nhung browser native file input van gioi han styling.
- Tai thoi diem V4-034, storage governance chua lam: raw storage durable, TTL/quota/provenance/export-delete cho contextual/library docs. Muc nay da duoc xu ly tiep trong V4-033.

Ket luan:

- V4-034 sua dung feedback user ve chat luong giao dien: frontend nhin gan hon voi mot app enterprise/Google-like va bot dau vet demo/security leak. Gap storage governance sau do da duoc xu ly trong V4-033.

## Review Sau V4-035

Da cai thien:

- Frontend co them topbar primary actions va taskbar workspace theo role, giup user nhin vao biet cac khu chuc nang chinh va bam den dung section thay vi phai doan workflow.
- Visual system tiep tuc polish theo Material/enterprise, nhung van giu app workspace that thay vi landing page.
- Admin invite workflow ro hon: sau khi tao invite, UI hien invite code de Admin gui cho Teacher/Student kich hoat tai khoan; danh sach pending invites cung hien code.
- Teacher/Student/Admin upload controls co hint ro document upload/URL ingest se hien lai trong danh sach nguon sau khi xu ly.
- Runtime khong dung `.env.example` lam config chinh. `.env` that doc `AUTH_PROVIDER=supabase`, `AUTH_REPOSITORY=postgres`, `LEARNING_REPOSITORY=postgres`; `ENABLE_DEMO_LOGIN=true` chi bat quick access 3 role de test.
- Backend sua loi persistence that: Admin demo tao invite trong mode Supabase/Postgres upsert current admin profile truoc khi create invite; PDF upload sync path gan `knowledge_scope`/`owner_user_id` truoc khi write DB.
- Rendered QA desktop/mobile pass cho login/Teacher/Admin/Student taskbar; Supabase/Postgres smoke pass cho invite persistence va upload PDF.

Con lech:

- Tai thoi diem V4-035, storage governance chua lam; muc nay da duoc xu ly tiep trong V4-033.
- Taskbar hien tai scroll/focus den section trong single-page workspace; neu app lon hon, nen tien hoa thanh route-level IA co breadcrumbs/deep links.
- Invite code hien trong Admin UI de demo/manual activation; production co the bo sung email delivery/password reset/MFA/revoke sessions trong auth hardening rieng.

Ket luan:

- V4-035 sua cac loi product logic va usability user vua phat hien: app phai co taskbar/huong dan thao tac ro, upload tai lieu phai chay voi repository that, Admin tao account/invite phai persist va co code de user kich hoat. Sau do V4-033 da dong gap storage governance foundation.

## Review Sau V4-033

Da cai thien:

- Document API co governance metadata ro: file size, raw storage provider/bucket/path/status, retention expiry, quota limit/used va provenance JSON.
- Upload/URL ingest enforce quota va retention o backend service layer, khong dua logic quyen/quota len client.
- Local/dev default `DOCUMENT_STORAGE_PROVIDER=metadata` giu raw upload khong vao git/deploy; production co provider `supabase` de upload raw PDF qua Supabase Storage server-side bang secret key backend-only.
- Admin co export/delete contextual knowledge cua user theo owner/org scope. Delete hien la archive soft-delete de giu audit/history va tranh xoa nham hard-delete.
- Frontend hien governance labels trong document rows va Teacher source picker: raw storage status, quota, retention va provenance.
- Rendered QA Teacher governance pass, console empty.

Con lech:

- Chua co scheduled cleanup worker thuc thi auto archive/delete khi `retention_expires_at` qua han.
- Chua co signed download URL UI cho raw object da store trong Supabase Storage.
- Supabase Storage bucket/policy setup can migration/runbook rieng neu deploy production day du; code app da co provider boundary va server-side upload path.

Ket luan:

- V4-033 dong gap storage governance foundation cho roadmap hien tai. Future production hardening nen mo feature moi cho cleanup scheduler, signed raw-download UI, storage bucket migration va hard-delete workflow co operator confirmation.

## Review Sau V4-038

Da cai thien:

- Teacher first viewport khong con chi la dashboard metric khô; co guided next-action panel tinh tu state that de chi ro buoc tiep theo: thiet lap khoa hoc/lop, chon tai lieu, tao dan y, tao noi dung, gui Admin duyet hoac xem tien do hoc.
- Framing UI Teacher da bot thuat ngu ky thuat: `RAG/job/chunk/contextual/lesson blocks/course` duoc doi tren surface chinh thanh `Tai lieu dung de soan bai`, `Nguon kien thuc`, `Hang doi xu ly`, `Do tin cay nguon`, `Khoa hoc va lop`, `Tao noi dung bai giang`.
- CTA cua guide scroll/focus den dung section nen user khong phai doan nen bam dau.
- Mobile nav trong sidebar chuyen sang hang cuon ngang, khong con gay chu nhieu dong lam UI trong kem chuyen nghiep.
- Playwright QA desktop/mobile xac nhan khong visible cac text gay lo/lang phi nhu `/api/v1`, `Mat khau demo`, `Teacher -> RAG`, `Tai lieu/RAG`, `job AI`, `lesson blocks`, `Truy xuat RAG`.

Con lech:

- Day moi la onboarding/labeling cho Teacher first-lesson flow; Student experience van can AI tutor grounded, practice questions, bookmark/note va resume-learning sau de tang retention.
- Solo publish mode cho Teacher ca nhan van chua co; hien tai workflow Institution/Admin approval van la default.
- RAG production quality van phu thuoc embedding provider/env va eval dataset; V4-038 khong doi retrieval algorithm.
- CSS van tap trung trong `App.css`; nen tach design tokens/base/components/features neu tiep tuc mo rong UI surface.

Ket luan:

- V4-038 giam dung gap product UX ma user feedback: Teacher moi nhin vao biet lam gi tiep va khong bi ep hieu RAG/job/chunk. Day la polish dung huong cho B2B education product, nhung Student growth va solo-teacher friction van nen la feature moi rieng.

## Review Sau V4-039

Da cai thien:

- Student surface khong con chi la viewer doc lesson/export PDF; da co study state ca nhan cho bookmark block quan trong va ghi chu rieng theo block.
- Backend luu study state qua memory/Postgres repository `lesson_study_state`, owner-scoped theo `(student_id, lesson_id)`, khong luu local-only tren client.
- API `GET/PUT /api/v1/student/lessons/{lesson_id}/study-state` enforce role Student, class membership, organization scope, lesson status `published` va block id thuoc lesson.
- Frontend Student reader load study state cung progress, hien summary so danh dau/ghi chu, bookmark toggle, note editor, saving/error state va timestamp than thien.
- Rendered QA desktop/mobile xac nhan luong quick Student login -> open published lesson -> bookmark block -> save note render dung, console/page issues empty.

Con lech:

- AI Tutor grounded co citation va practice questions van chua lam; V4-039 chi la layer hoc tap ca nhan persistent, khong goi AI provider.
- Teacher/Admin chua co insight tu note/bookmark cua Student; trong slice nay note la private de tranh thay doi privacy/workflow qua lon.
- Chua co search/filter danh sach bookmark/ghi chu tren nhieu lesson; neu Student co nhieu bai, nen mo feature rieng cho review hub.

Ket luan:

- V4-039 sua mot gap product quan trong cua Student: hoc vien co ly do quay lai lesson va tiep tuc on tap bang ngu canh rieng. Day la buoc production-friendly truoc khi them tutor/practice AI lon hon vi da co persistence, permission va UI validation ro.

## Review Sau V4-040

Da cai thien:

- Student khong can mo tung lesson de tim lai noi da bookmark/ghi chu; workspace co panel `On tap ca nhan` gom cac block can quay lai.
- Backend co endpoint Student-only `GET /api/v1/student/study-review`, tong hop study state tren lesson `published` ma Student co class membership/org scope.
- Review item gom lesson title, block title, block type, note, bookmark flag, citation count va `updated_at`, nen UI co du context de Student quyet dinh bam vao dau.
- Service bo qua stale block ids, khong hien draft/unpublished lesson, khong hien lesson ngoai membership va role Teacher/Admin bi 403.
- Frontend click item review mo dung lesson/block trong reader; mobile layout da QA de item khong bi co hep kho doc.
- Rendered QA desktop/mobile pass voi mock quick Student login, review hub visible, click item mo dung block va console/page issues empty.

Con lech:

- Review hub hien danh sach phang, chua co search/filter/tag/priority khi Student co rat nhieu bookmark/ghi chu.
- AI Tutor grounded va practice questions van chua lam; V4-040 chi dong luong on tap thu cong dua tren note/bookmark da co.
- Chua co notification/reminder/review schedule cho spaced repetition.
- Note hien van la private; neu sau nay Teacher insight tu note/bookmark thi can mo privacy/business rule rieng, khong nen mac dinh expose.

Ket luan:

- V4-040 tang gia tri that cho Student retention: bookmark/note khong con la du lieu roi rac trong tung lesson ma thanh mot luong quay lai hoc tiep ro rang. Day la buoc hop ly truoc khi them AI Tutor/practice vi san pham da co persistence, permission va UX review co the validate duoc.

## Review Sau V4-041

Da cai thien:

- Student khong chi doc lai lesson; workspace co panel `Luyen tap` gom quiz/assignment/common misconception blocks tu lesson da publish.
- Backend co endpoint Student-only `GET /api/v1/student/practice-items`, enforce role Student, class membership, organization scope va lesson status `published`.
- Practice item hien lesson title, block title/type, prompt/content va citation count, nen Student co the bat dau luyen tap ma khong mo tung lesson.
- Click practice item mo dung lesson/block trong reader va presentation; bug slide-index da duoc sua de target block khong bi presentation callback ghi de ve block resume cu.
- Student navigation/taskbar co shortcut `Luyen tap`, giup feature moi discoverable thay vi nam an trong page.
- Rendered QA desktop/mobile pass voi mock quick Student login, practice deck visible, click item mo `Checkpoint`, console/page issues empty.

Con lech:

- Chua co persistent attempt state, dap an/feedback tu dong, diem so hoac spaced repetition scheduler.
- Practice deck hien danh sach phang; neu nhieu lesson can search/filter theo lesson/block type/hoan thanh.
- AI Tutor grounded va practice generation moi van chua lam vi can API key/prompt/eval workflow rieng.

Ket luan:

- V4-041 tang gia tri hoc tap truc tiep cho Student bang cach tai su dung noi dung quiz/assignment da duoc Teacher/Admin publish. Day la buoc production-friendly truoc AI Tutor: khong them AI tu do, khong fake data, nhung Student co hanh dong hoc chu dong ro rang.

## Review Sau V4-042

Da cai thien:

- `Luyen tap` khong con chi la danh sach prompt tinh; Student co the nhap cau tra loi/cach giai va luu self-check cho tung quiz/assignment/common misconception block.
- Backend co endpoint Student-only `GET/PUT /api/v1/student/lessons/{lesson_id}/practice-attempts/{block_id}`, persistent qua memory/Postgres `lesson_practice_attempts`.
- Permission guard ro: chi Student cua class co lesson `published` moi doc/sua attempt; block phai thuoc lesson va phai la practice type.
- Practice deck nay hien `Chua lam/Can on lai/Da hieu`, attempt count va thoi gian cap nhat tu API that, giup Student biet bai nao da lam va bai nao can on lai.
- UI copy noi ro day la tu danh gia cua hoc vien, khong phai AI cham diem. Quyet dinh nay tranh fake scoring khi lesson block chua co answer schema/rubric.
- Rendered QA desktop/mobile pass voi quick Student mocked API: click practice item, nhap answer, chon `Da hieu`, luu self-check, item cap nhat status/attempt count va console/page issues empty.

Con lech:

- Chua co dap an mau, rubric, AI feedback hoac score; muon lam dung can them answer schema/eval workflow thay vi suy luan tu prompt tu do.
- Chua co filter practice theo trang thai hoac lesson khi danh sach lon.
- Chua co spaced repetition scheduler hoac notification dua tren `needs_review`.
- Teacher/Admin chua co analytics tu attempt; neu them can privacy/business rule rieng.

Ket luan:

- V4-042 bien Student practice thanh workflow hoc co state, co persistence va co feedback tu nguoi hoc ma khong overpromise AI. Day la nen mong hop ly de sau nay them AI Tutor grounded, rubric scoring va spaced repetition tren du lieu that.

## Review Sau V4-043

Da cai thien:

- He thong khong con coi `admin` la quyen cao nhat toan platform. `admin` duoc giu dung nghia la Admin cua mot organization; role moi `system_admin` la Owner he thong dung cho production setup.
- `system_admin` khong nam trong public quick demo login. Owner that chi duoc bootstrap sau khi Supabase Auth xac thuc user va email/id cua user khop allowlist `SYSTEM_ADMIN_EMAILS` hoac `SYSTEM_ADMIN_USER_IDS` trong `.env`.
- Database profile role model da mo rong tren `profiles.role`; normal organization invite van chi gioi han `admin/teacher/student`, nen Admin to chuc khong the tao owner he thong qua form invite.
- System Admin co API/workspace rieng de tao organization va tao invite Admin dau tien cho organization: `/api/v1/system/organizations` va `/api/v1/system/organizations/{organization_id}/admin-invites`.
- Frontend session/router/workspace da hieu role `system_admin` va dua owner vao `/system`, tranh roi vao workspace Admin to chuc hoac crash session.

Con lech:

- Chua co UI quan ly disable/delete organization, rotate owner, MFA/password reset bat buoc, impersonation co audit, hoac billing/plan management. Cac muc nay nen la future production ops feature rieng.
- System Admin khong tu dong bypass cac Admin endpoint theo organization de tranh cross-tenant leak; neu can support/debug tenant thi nen them flow chon organization/impersonation co audit ro rang.

Ket luan:

- V4-043 sua gap production trust ma user chi ra: san pham can owner he thong that, tach khoi demo login va tach khoi Admin cua to chuc. Day la nen tang dung de van hanh multi-organization ma khong lam roi Teacher/Student/Admin workflow chinh.

## Review Sau V4-044

Da cai thien:

- Frontend khong con don moi chuc nang Teacher/Admin/Student vao mot surface dai. Moi role co page menu rieng, page heading rieng va content chi render theo page dang chon.
- Teacher co cac page `Tong quan`, `Khoa hoc & lop`, `Tai lieu`, `Dan y`, `Lesson Studio`, `Hang doi xu ly`; day la luong lam viec tu thiet lap lop den tao bai giang thay vi mot dashboard kho scan.
- Admin co cac page `Hang doi duyet`, `Kho tri thuc`, `Nguoi dung`, tach moderation khoi upload knowledge va invite user.
- Student co cac page `Lop cua toi`, `Lesson`, `Luyen tap`, `Tai lieu ca nhan`, giup hoc vien thay app nay giup hoc/hoc tiep/luyen tap thay vi nhin thay cong cu ky thuat.
- App shell co feedback primitives local theo shadcn composition pattern: alert, spinner, skeleton, switch, table, pagination va toast. User biet khi dang tai, dang chuyen trang, list rong, list co nhieu trang, hoac tac vu dang xu ly.
- Admin invite va System Admin organization list dung data table + pagination, giam cam giac card/list vo han khi du lieu tang.
- QA bang Playwright click 3 role pass va screenshot xac nhan page jobs Teacher khong con blank sau khi bo opacity animation khoi content panel.

Con lech:

- Project chua initialize Tailwind/shadcn CLI (`components.json` va Tailwind config chua co), nen V4-044 dung local primitives theo pattern thay vi full shadcn upstream. Neu muon dung shadcn components chinh thuc, can mot slice migration rieng de khong pha CSS hien co.
- Mot so page van chia lai component lon ben trong `TeacherWorkspace.tsx`, `AdminWorkspace.tsx`, `StudentWorkspace.tsx`; IA da dung hon nhung code-splitting theo page component nen tiep tuc lam sau.
- Page-level URL/hash da co cho active page, nhung chua co full route nested (`/teacher/documents`, `/student/practice`). Neu can share link/deep-link production, nen lam router slice rieng.

Ket luan:

- V4-044 sua dung van de user-facing: user khong can hieu ky thuat, ho chi can menu ro rang de biet vao dau lam viec. Day la buoc quan trong de TeachFlow AI giong mot san pham co information architecture that thay vi demo gom tat ca workflow vao mot man hinh.

## Review Sau V4-045

Da cai thien:

- Admin `Nguoi dung` khong con la trang invite-code don gian; Admin thay duoc Teacher/Student that trong organization, trang thai active/disabled, role va thoi diem cap nhat.
- Admin co search/filter/table/pagination nen quan ly duoc organization lon hon demo 2-3 user.
- Disable/enable profile la hanh dong an toan hon delete user: giu lich su course/lesson/audit, nhung chan login/session request tiep theo.
- Backend enforce dung model tenant: Admin chi quan ly Teacher/Student cung organization, khong thao tac Admin/System Admin va khong cross-org.
- Demo-login trong persistence mode tu seed demo profiles neu thieu, nen trang Admin user management khong bi rong khi chay voi Postgres/Supabase repository; seed nay khong mo lai user da disabled.
- Rendered QA xac nhan Admin quick login -> `Nguoi dung` -> filter Teacher -> tam khoa/mo lai `Teacher Demo` chay duoc end-to-end.

Con lech:

- Chua co revoke refresh token/session server-side that cho Supabase sau khi disable; hien current-user guard chan request API tiep theo. Production nen them Supabase admin revoke/session policy neu yeu cau bao mat cao.
- Chua co edit role/move organization/password reset/MFA; day nen la feature rieng de tranh Admin organization co qua nhieu quyen nguy hiem trong mot page.
- Email invite delivery van chua co; Admin van can copy invite code cho user kich hoat.

Ket luan:

- V4-045 sua gap product logic ro: Admin cua trung tam/bo mon phai quan ly duoc con nguoi that, khong phai chi tao invite roi mat dau vet. Day la workflow can thiet cho san pham B2B education nho/trung binh va giu phan quyen tenant an toan.
