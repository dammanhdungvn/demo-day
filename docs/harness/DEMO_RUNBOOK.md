# Runbook Local - TeachFlow AI

## Muc Tieu

Checklist nay dung de user testing TeachFlow AI bang account that truoc deploy. Khong dua secret vao tai lieu nay; chi dung ten bien env.

## Dieu Kien Truoc Khi Chay

- Root `.env.local` hoac `.env` da co cac bien bat buoc:
  - `URL_BACKEND`
  - `AUTH_PROVIDER=supabase`
  - `AUTH_REPOSITORY=postgres`
  - `LEARNING_REPOSITORY=postgres`
  - `ENABLE_DEMO_LOGIN=false`
  - `URL_SUPABASE`
  - `PUBLIC_API_KEY_SUPABASE`
  - `SECRET_API_KEY_SUPABASE`
  - `SUPABASE_POOLER_CONNECTING_STRING` hoac `SUPABASE_DIRECT_CONNECTING_STRING`
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
- Supabase knowledge base da co documents/chunks. Evidence hien tai: 5 completed documents va 4,256 chunks.
- `data/books/` chi dung local pre-ingest, khong deploy folder nay.
- De bootstrap Owner he thong, `.env.local`/`.env` phai co `SYSTEM_ADMIN_EMAILS` hoac `SYSTEM_ADMIN_USER_IDS` khop user Supabase Auth that.

## Verification Bat Buoc

```bash
./init.sh
```

Expected:
- Frontend typecheck/lint/test/build pass.
- Backend pytest pass.
- Frontend source khong hardcode backend URL hoac secret key names.

## Chay Local De Test

Terminal 1:

```bash
cd backend
uv run fastapi dev main.py --host 127.0.0.1 --port 3000
```

Terminal 2:

```bash
cd frontend
pnpm dev --host 127.0.0.1 --port 5173
```

Mo `http://127.0.0.1:5173`.

Neu mo frontend qua preview/forwarded port cua IDE/cloud workspace, chay frontend voi host `0.0.0.0`:

```bash
cd frontend
pnpm dev --host 0.0.0.0 --port 5173
```

Local `.env.local`/`.env` nen dung `URL_BACKEND=/api/v1`; Vite se proxy API sang backend `127.0.0.1:3000`. Smoke test:

```bash
curl http://127.0.0.1:5173/api/v1/health
curl http://127.0.0.1:5173/api/v1/auth/demo-accounts
```

Expected:
- `/health` tra `status: ok`.
- `/auth/demo-accounts` tra `[]` khi `ENABLE_DEMO_LOGIN=false`.

## Bootstrap Account That

### Cach 1 - UI Owner/Invite Flow

1. Tao user Owner trong Supabase Auth bang email that.
2. Them email hoac user id do vao `SYSTEM_ADMIN_EMAILS` hoac `SYSTEM_ADMIN_USER_IDS` trong `.env.local`/`.env`.
3. Restart backend.
4. Dang nhap Owner tren UI bang email/password Supabase.
5. Vao workspace `/system`, tao organization.
6. Tao ma moi Admin dau tien cho organization.
7. Admin dung ma moi de tao account that.
8. Admin moi Teacher/Student; Teacher/Student dung ma moi de tao account that.

Expected:
- Owner co role `system_admin` va organization platform.
- Admin/Teacher/Student co profile trong Postgres, `auth_provider=supabase`, status `active`.
- Login email/password dung Supabase Auth; role va organization doc tu profile database.

### Cach 2 - Script Bootstrap Cho QA

Dung khi can tao nhanh account that tren Supabase Auth + Postgres de rendered QA. Script mac dinh dry-run, khong ghi DB neu thieu `--apply`.

Neu muon script tu tao email QA mac dinh va password manh vao `.env.local` local ignored file, chay:

```bash
cd backend
uv run python scripts/bootstrap_real_accounts.py --prepare-qa-env-local
```

Neu password da tung bi lo trong log local, rotate lai password trong `.env.local` ma khong in value:

```bash
cd backend
uv run python scripts/bootstrap_real_accounts.py --rotate-qa-env-local
```

Dat password bang shell env hoac `.env.local`, khong ghi vao docs/chat/log:

```bash
export TEACHFLOW_BOOTSTRAP_OWNER_PASSWORD="<set-in-shell-only>"
export TEACHFLOW_BOOTSTRAP_ADMIN_PASSWORD="<set-in-shell-only>"
export TEACHFLOW_BOOTSTRAP_TEACHER_PASSWORD="<set-in-shell-only>"
export TEACHFLOW_BOOTSTRAP_STUDENT_PASSWORD="<set-in-shell-only>"
```

Dry-run truoc:

```bash
cd backend
uv run python scripts/bootstrap_real_accounts.py \
  --organization-id org-demo \
  --organization-name "TeachFlow Demo Organization" \
  --owner-email owner@example.edu \
  --admin-email admin@example.edu \
  --teacher-email teacher@example.edu \
  --student-email student@example.edu
```

Neu dry-run dung, moi chay apply:

```bash
cd backend
uv run python scripts/bootstrap_real_accounts.py --apply \
  --organization-id org-demo \
  --organization-name "TeachFlow Demo Organization" \
  --owner-email owner@example.edu \
  --admin-email admin@example.edu \
  --teacher-email teacher@example.edu \
  --student-email student@example.edu
```

Expected:
- Script tao Supabase Auth user server-side bang `SECRET_API_KEY_SUPABASE`, khong dua service key vao frontend.
- Script upsert `organizations` va `profiles` trong Postgres voi `auth_provider=supabase`, `status=active`.
- Neu email da co profile, script skip profile do va khong tao user Auth lan nua.
- Neu network/DB loi, script tra message `ERROR: bootstrap apply failed: ...` va redact secret/password/connection string.

## Rendered QA Admin Account That

Sau khi co Admin account that va backend/frontend dang chay, dat credential QA bang shell env hoac `.env.local`:

```bash
export TEACHFLOW_QA_ADMIN_EMAIL="<admin-email>"
export TEACHFLOW_QA_ADMIN_PASSWORD="<set-in-shell-only>"
export TEACHFLOW_QA_FRONTEND_URL="http://127.0.0.1:5173"
```

Chay desktop QA 1440px:

```bash
pnpm --dir frontend run qa:admin-real
```

Expected:
- Script dang nhap bang `/auth/login` that, khong mock API.
- Script click tung trang Admin: Tong quan, Hang doi duyet, Bai giang mau, Kho tri thuc, Nguoi dung, Tac vu, Bao cao, Nhat ky, Cai dat.
- Script fail neu co API 4xx/5xx bat thuong, console/page error, horizontal overflow, hoac secret key name hien tren UI.
- Screenshot luu mac dinh tai `/tmp/teachflow-admin-real-qa`.

## Manual Product Flow

1. Login Teacher.
2. Tao course `Introduction to Artificial Intelligence`.
3. Tao class `KTPM-K18`, level `average`, 1-12 sessions.
4. Add Student account that vao class.
5. Chon completed knowledge source.
6. Generate outline.
7. Chon session va generate lesson blocks.
8. Review citations/warnings.
9. Edit/regenerate neu can.
10. Approve tat ca blocks.
11. Submit lesson cho Admin.
12. Login Admin.
13. Mo Admin moderation queue.
14. Xem blocks/citations/warnings.
15. Approve & Publish.
16. Login Student.
17. Xem My classes va Published lessons.
18. Open lesson detail.
19. Mo presentation, dung Previous/Next/Fullscreen.
20. Bam Export PDF va chon Save as PDF trong browser print.

Expected:
- Teacher chi thay Teacher controls.
- Admin chi publish/request changes, khong sua truc tiep content.
- Student chi thay lesson `published` thuoc class membership.
- Draft/submitted/changes_requested khong hien trong Student lessons.
- Presentation/PDF co blocks va citations.

## Manual Revision Flow

Dung flow nay de kiem tra Admin request changes va Teacher revise:

1. Teacher tao/generate/review lesson va submit cho Admin.
2. Admin mo moderation queue.
3. Nhap feedback va bam Request changes.
4. Login lai Teacher.
5. Chon class, mo Existing lesson co status `changes_requested`.
6. Xac nhan Admin feedback hien trong Lesson Studio.
7. Edit mot block; block phai ve `needs_review`.
8. Approve lai block va submit lai cho Admin.
9. Admin publish.
10. Student moi thay lesson trong Published lessons.

Expected:
- Teacher khong sua duoc lesson khi status `submitted_for_admin_review` hoac `published`.
- Teacher khong submit lai lesson da `published`.
- Student visibility khong bi go bo neu Teacher bam submit tu UI stale.

## Deploy Notes

Backend:
- Start command production toi thieu: `uv run fastapi run main.py --host 0.0.0.0 --port 3000`.
- Set `BACKEND_CORS_ORIGINS` bang frontend production origin.
- Set Supabase/OpenAI env tren backend runtime, khong dua vao frontend.

Frontend:
- Build command: `pnpm build`.
- Khi deploy frontend static, `URL_BACKEND` phai tro toi backend deployed base URL co `/api/v1`.
- Sau khi doi `URL_BACKEND`, build lai frontend.

## Known MVP Debt

- Demo quick login da tat mac dinh; chi bat lai tam thoi cho regression local neu explicit `ENABLE_DEMO_LOGIN=true`.
- Neu chua set repository env ve `postgres`, mot so store co the fallback memory trong local test. Production/local user testing phai dung `AUTH_REPOSITORY=postgres` va `LEARNING_REPOSITORY=postgres`.
- RAG da doc Supabase, nhung embedding hien la local hash embedding va chi ingest 5 PDFs dau tien.
- PDF delivery van dung browser print; backend da ghi export record/history.

## Stop Criteria Cho User Testing

User co the bat dau testing khi:
- `./init.sh` pass.
- Backend va frontend local chay duoc.
- Manual demo flow den Student presentation/PDF pass.
