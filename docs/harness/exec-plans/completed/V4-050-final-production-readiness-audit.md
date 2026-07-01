# Exec Plan - V4-050 Final production readiness audit

## Muc Tieu

- Feature: `V4-050 Final production readiness audit for design/fullstack goal`.
- User goal: xac minh 4 yeu cau lon da du evidence:
  1. Frontend da code lai theo design trong `images` HTML/PNG, desktop webapp responsive.
  2. Frontend/backend/database da ket noi thanh san pham fullstack.
  3. Frontend action khong co backend gap P0; neu co thi code API.
  4. Audit production gaps truoc khi ket luan goal.
- Output bat buoc: audit report trong repo, evidence commands, manual validation va status goal ro rang.

## Scope

- Audit source-of-truth va runtime/source hien tai, khong dung `README.md`.
- Dung `images/frontend-design-manifest-v2.md` lam danh sach surface can map.
- Audit backend route/API/database path bang code, tests va docs hien co.
- Neu tim thay blocker P0 co the fix gon trong feature nay thi viet test fail-first va fix.
- Neu tim thay enhancement khong chan production readiness <=1000 users thi ghi debt/future item, khong mo rong scope.

## Ngoai Scope

- Khong build feature V3/growth moi.
- Khong cai worker queue enterprise neu audit chi ra la future enhancement da ghi debt.
- Khong sua design lon neu rendered QA/design contract da pass, tru khi co gap blocker.

## Test Plan Truoc Khi Audit

- Baseline da chay truoc khi mo feature:
  - `./init.sh` pass frontend typecheck/lint/21 files/104 tests/build va backend 221 tests.
- Static audit commands can chay:
  - `python3 -m json.tool feature_list.json`
  - `git diff --check`
  - `rg -n "localhost:3000/api/v1|OPENAI_API_KEY|NVIDIA_OPENAI_API_KEY|SECRET_API_KEY_SUPABASE" frontend/src`
  - `rg -n "tailwindcss.com|unpkg.com|cdn.jsdelivr|images/.+\\.png|teacher-dashboard-overview-design-v2|student-my-classes-dashboard-design-v2" frontend/src`
  - `rg -n "teacher-design-|student-design-|admin-design-|job-center-shell|login-layout|LessonPresentation" frontend/src`
  - `rg -n "generation-jobs|documents|courses|student/lessons|study-state|practice|tutor|exports|system/organizations|auth/users" backend/app frontend/src/api`
- Final gate:
  - `./init.sh`
  - `python3 -m json.tool feature_list.json`
  - `git diff --check`

## Audit Checklist

1. Design coverage:
   - Login: `images/frontend-login-design.html`/`teachflow-login-role-selection-design-v2.png`.
   - System Admin: organization management/admin invite.
   - Admin: review, knowledge, users, jobs.
   - Teacher: overview, setup, documents, outline, studio, jobs.
   - Student: classes, lessons/tutor, practice, documents, presentation.
2. Fullstack/API coverage:
   - Auth/session/role routing.
   - Teacher course/class/documents/RAG/outline/lesson studio/jobs.
   - Admin review/publish/knowledge/users/jobs/system owner.
   - Student classes/lesson/progress/study/tutor/practice/documents.
3. Database/persistence:
   - Auth profiles/invites/orgs, learning, content, knowledge/chunks, jobs, audit, progress, study, exports.
   - Memory default acceptable for local tests; Postgres/Supabase repository path must exist and be tested.
4. Security/reliability:
   - No frontend secrets/backend URL hardcode.
   - Role/org/membership backend guards tested.
   - AI/RAG schema/grounding/safety, job retry/cancel, rate guard, observability/runbooks.
5. Production gaps:
   - Classify as `blocking`, `accepted debt`, or `future enhancement`.

## Planned Files

- `feature_list.json`
- `docs/harness/exec-plans/completed/V4-050-final-production-readiness-audit.md`
- New audit report under `docs/version5/` or `docs/version4/`
- `progress.md`
- `session-handoff.md`
- `docs/harness/exec-plans/tech-debt-tracker.md` if debt classification changes

## Quality Gate

- [x] Audit report committed to repo: `docs/version5/PRODUCTION_READINESS_AUDIT.md`.
- [x] Static audit commands run and evidence recorded.
- [x] Final `./init.sh` pass.
- [x] No unclassified P0 blocker remains.
- [x] Exec plan moved to completed.

## Evidence

- Baseline `./init.sh` pass truoc audit: frontend typecheck/lint, 21 files/104 tests, build; backend 221 tests.
- `python3 -m json.tool feature_list.json` pass.
- `git diff --check` pass.
- `rg -n "localhost:3000/api/v1|OPENAI_API_KEY|NVIDIA_OPENAI_API_KEY|SECRET_API_KEY_SUPABASE" frontend/src` no match.
- Prototype/CDN runtime rg khong co runtime import; chi co negative assertions trong tests.
- Runtime marker rg xac nhan `login-layout`, `teacher-design-*`, `student-design-*`, `job-center-shell`, `LessonPresentation`.
- Backend route inventory xac nhan auth/system/learning/knowledge/RAG/AI lesson/admin/student/export/jobs endpoints duoi `/api/v1`.
- Repository/schema inventory xac nhan Postgres/Supabase path cho auth, learning, content, knowledge, jobs, audit, progress, study va exports.
- Final `./init.sh` pass: frontend typecheck/lint, 21 files/104 tests, build; backend 221 tests.

## Audit Result

- Khong phat hien backend/API gap P0 moi; khong can code endpoint moi trong V4-050.
- User goal 1-4 da co evidence repo tai `docs/version5/PRODUCTION_READINESS_AUDIT.md`.
- Cac production gaps con lai la accepted debt/future enhancement, khong chan pham vi goal hien tai.
