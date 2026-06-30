# TeachFlow AI Version 4 - Product Excellence

## Muc Tieu

Version 4 nang TeachFlow AI tu san pham co flow dung duoc thanh mot san pham co trai nghiem tot hon, dep hon va de duy tri hon.

Trong pham vi hien tai, Version 4 khong thay the Version 2/3:

```txt
Version 1: demo baseline khong duoc pha
Version 2: production foundation phai tiep tuc on dinh
Version 3: learning growth dua tren data that
Version 4: product quality, UI/UX excellence, design system, clean architecture
```

## Source Of Truth

Tai lieu Version 4:

1. `docs/version4/PRD_V4_PRODUCT_EXCELLENCE.md`
2. `docs/version4/USER_STORIES_V4.md`
3. `docs/version4/UX_RESEARCH_NOTES.md`
4. `docs/version4/PRODUCT_REVIEW.md`
5. `docs/version4/PRODUCTION_GAP_ANALYSIS.md`

Tai lieu Version 4 phai duoc doc cung voi:

- `docs/version1/`
- `docs/version2/`
- `docs/version3/`

Khong dung `README.md` de suy luan nghiep vu.

## Nguyen Tac Version 4

- Giao dien la actual app workspace, khong phai landing page.
- Dep nhung phai giup Teacher/Admin/Student lam viec nhanh hon.
- Motion chi dung de bao hieu state, chuyen canh, feedback va hierarchy.
- Khong hardcode demo data trong component UI. Du lieu demo phai di qua API/seed/helper co boundary ro.
- Frontend phai co component architecture ro hon, khong de `App.tsx` thanh monolith.
- Accessibility, keyboard, focus, reduced motion va responsive la acceptance criteria, khong phai polish sau.
- Moi design decision phai gắn voi workflow: Teacher -> RAG -> Lesson Studio -> Admin -> Student.
- Knowledge workflow phai tach `library` dai han do Admin quan ly voi `contextual` ngan han owner-scoped cua Teacher/Student.
- Production trust khong chi la UI: auth/register/JWT lifecycle da co V4-029 foundation, API contract/Swagger da co V4-030 foundation, structured logging/observability da co V4-031, AI safety/eval da co V4-032, storage governance da co V4-033.

## Concept Design

Concept primary Teacher workspace:

```txt
docs/version4/assets/teachflow-v4-teacher-workspace-concept.png
```

Concept nay la reference cho V4-P0 UI direction: workspace density, palette, sidebar, workflow timeline, Lesson Studio editor, citation panel, document strip va job queue.

Concept professional frontend refresh:

```txt
docs/version4/assets/v4-034-professional-frontend-concept.png
```

Concept nay la reference cho V4-034: login co 3 quick role access khong lo API/password, sidebar/topbar app shell, enterprise visual system, Teacher/Admin/Student surfaces dong bo.

Concept Material product polish:

```txt
docs/version4/assets/v4-035-material-product-polish-concept.png
```

Concept nay la reference cho V4-035: taskbar/workspace navigation ro hon, topbar actions, Material/enterprise surfaces, va polish cho cac workflow Teacher/Admin/Student dang dung that.

Concept role page navigation:

```txt
docs/version4/assets/v4-044-page-navigation-workspace-concept.png
```

Concept nay la reference cho V4-044: moi role co sidebar/taskbar menu, moi chuc nang chinh la mot page doc lap, va workspace co alert/skeleton/spinner/switch/table/pagination/toast feedback thay vi don tat ca workflow vao mot trang.

## Release Gate V4

Version 4 chi duoc coi la dat khi:

1. Teacher workspace co app shell moi va Lesson Studio dep/ro hon.
2. UI co design tokens, component primitives va motion guidelines trong code.
3. Core workflow khong bi pha: create course/class, choose sources, generate outline/lesson, submit, admin publish, student view.
4. Frontend khong hardcode backend URL, secret hoac demo state business-critical.
5. Desktop va mobile rendered QA pass, khong co console error lien quan.
6. `./init.sh` pass.
7. Exec plan, feature status, progress va overnight handoff duoc cap nhat.

## Trang Thai Sau V4-038

- Login da professional hon, co 3 quick role access Admin/Teacher/Student nhung khong hien API base URL hoac mat khau demo.
- App shell da chuyen sang sidebar + topbar, role identity, logout, topbar primary actions va taskbar workspace theo role ro hon.
- Admin/Student khong con cac panel demo role-verification tren first screen; vao thang workflow that.
- CSS co token/design system moi cho typography, controls, panels, focus state, motion va responsive.
- Admin invite UI hien invite code sau khi tao va trong list pending, de user Teacher/Student co the kich hoat tai khoan.
- Upload PDF real repository da sua loi `knowledge_scope` trong path Supabase sync; Teacher/Student/Admin upload controls co hint ro document se hien trong danh sach nguon.
- Runtime doc config tu `.env` that; `.env.example` chi la template/checklist. Quick demo login 3 role duoc bat rieng bang `ENABLE_DEMO_LOGIN=true`, khong thay the Supabase/Postgres persistence.
- V4-033 da them knowledge storage governance: raw storage provider boundary metadata/Supabase, contextual TTL/quota, provenance labels va Admin export/delete contextual docs owner-scoped.
- V4-036 da them backend export records/history cho Markdown/PPTX/PDF: Teacher/Student export se ghi record backend truoc khi download/print; Teacher Lesson Studio co export history; API contract co `POST/GET /api/v1/lessons/{lesson_id}/exports`.
- V4-037 da sua 3 production review blockers: invited/Supabase active students cung organization duoc Teacher list/enroll, URL ingestion validate moi redirect target truoc khi follow de chan SSRF redirect sang private/loopback host, va Postgres document upload jobs ghi `actor_id`/`actor_role` de non-admin thay job cua minh.
- V4-038 da them Teacher first-lesson onboarding: guided next-action panel tinh tu state that, CTA focus den section dung, Teacher/App copy doi tu `RAG/job/chunk/contextual/lesson blocks/course` sang ngon ngu giao vien nhu `Tai lieu dung de soan bai`, `Hang doi xu ly`, `Do tin cay nguon`, `Khoa hoc va lop`, va mobile nav khong gay chu.
- V4-039 da them Student notes and bookmarks: Student reader co bookmark block, ghi chu rieng theo block, summary so danh dau/ghi chu va backend persistent study state qua `GET/PUT /api/v1/student/lessons/{lesson_id}/study-state`.
- V4-040 da them Student personal review hub: bookmark/ghi chu cua Student tren cac lesson published duoc gom vao panel `On tap ca nhan`, item click mo dung lesson/block, backend enforce Student role + published membership va khong leak note cua role/lesson khac.
- V4-041 da them Student practice deck from published lessons: panel `Luyen tap` gom quiz/assignment/common misconception blocks tu lesson da publish, click item mo dung lesson/block va navigation Student co shortcut `Luyen tap`; khong goi AI moi va khong fake practice data.
- V4-042 da them Student self-check practice attempts: Student luu cau tra loi va trang thai tu danh gia `Chua lam/Can on lai/Da hieu` cho tung practice item, attempt state persistent qua memory/Postgres, practice deck hien status/attempt count va UI noi ro day la self-check khong phai AI cham diem.
- BUG-004 da sua 5 finding review production: duplicate document lookup owner/scope, DNS SSRF private resolution, Admin generation job history organization scope, queued upload embedding failure stuck `processing`, va OpenAPI create-course example.
- V4-043 da them production System Admin/Owner foundation: role `system_admin` nam trong `profiles`, bootstrap qua Supabase-authenticated user khop `SYSTEM_ADMIN_EMAILS`/`SYSTEM_ADMIN_USER_IDS`, khong xuat hien trong public demo login; Owner co workspace/API rieng de tao organization va moi Admin dau tien, con Admin hien tai van la Admin theo organization.
- V4-044 da sua loi IA/UX lon cua frontend: Teacher/Admin/Student/System Admin khong con nhin tat ca chuc nang trong mot page dai; workspace co page config theo role, sidebar/taskbar navigate page that, page heading rieng, feedback primitives local theo shadcn pattern, table/pagination cho list quan trong, toast khi doi trang, skeleton/alert/loading/empty state ro hon.
- V4-045 da them Admin Teacher/Student user management: page `Nguoi dung` khong con chi tao invite code ma co danh sach member that trong organization, search/filter role/status, table/pagination, disable/enable Teacher/Student co feedback; backend enforce organization scope, khong cho Admin to chuc thao tac Admin/System Admin hay user khac organization.
- V4-046 da them CRUD management expansion: Admin sua Teacher/Student name/email/status va rename/archive knowledge documents; Teacher sua/archive class va rename/archive lesson minh so huu. `Delete` trong UI la archive/disable an toan, giu audit/history va tranh mat du lieu production.
