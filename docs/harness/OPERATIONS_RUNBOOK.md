# Operations Runbook - TeachFlow AI V2

Runbook nay ap dung cho production conversion V2. Muc tieu la du cho nhom nho van hanh <=1000 active users, khong phai enterprise ops nang.

Nguon tham chieu chinh:

- `docs/version2/PRD_V2_PRODUCTION.md`
- `docs/version2/USER_STORIES_V2.md`
- Supabase docs: `https://supabase.com/docs/guides/platform/backups.md`

## 1. Nguyen Tac Van Hanh

- Repo khong luu secret, database password, service role key, access token, raw backup hoac raw PDF/books.
- Backend doc secret tu `.env`/deployment secrets; frontend khong bao gio co service role key hoac AI provider key.
- Thao tac destructive nhu restore production, delete user data, drop table hoac truncate phai co operator confirm ben ngoai app.
- Moi restore production phai co planned downtime va thong bao user neu co user that.
- Neu co the, restore smoke tren staging/clone truoc khi restore production.

## 2. Backup Process

### Supabase managed backup

Voi Supabase Pro/Team/Enterprise:

- Vao Dashboard -> Database -> Backups de xem scheduled backups.
- Supabase docs hien tai ghi Pro co 7 ngay daily backup, Team co 14 ngay, Enterprise toi da 30 ngay.
- Neu can RPO ngan hon, xem Point-in-Time Recovery (PITR). PITR co chi phi rieng va yeu cau compute phu hop.

### Logical export cho free tier hoac off-site copy

Dung Supabase CLI hoac `pg_dump` tu may operator. Khong commit output vao repo.

```bash
supabase --help
supabase db --help
supabase db dump --help
```

Command mau:

```bash
export SUPABASE_ACCESS_TOKEN="<set-in-shell-only>"
export PROJECT_REF="<project-ref>"
supabase db dump --project-ref "$PROJECT_REF" --file "/secure/offsite/teachflow-$(date +%F).sql"
```

Neu dung direct connection:

```bash
export DATABASE_URL="<set-in-shell-only>"
pg_dump "$DATABASE_URL" --format=custom --file "/secure/offsite/teachflow-$(date +%F).dump"
```

Checklist:

- [ ] Backup file nam ngoai repo.
- [ ] Backup duoc encrypt hoac nam trong storage noi bo co access control.
- [ ] Khong paste `DATABASE_URL`, `SUPABASE_ACCESS_TOKEN`, service role key vao log/chat.
- [ ] Ghi ngay gio backup va operator trong issue/run log, khong ghi secret.

## 3. Restore Smoke

Restore co the lam project inaccessible trong thoi gian xu ly. Khong restore production neu chua co approval ben ngoai app.

Quy trinh khuyen nghi:

1. Tao staging/clone project hoac dung project test.
2. Restore backup gan nhat vao staging/clone.
3. Dat env staging:

```env
LEARNING_REPOSITORY=postgres
URL_BACKEND=/api/v1
```

4. Chay backend staging va `./init.sh`.
5. Smoke data:
   - Teacher login.
   - Teacher list course/class.
   - Student list class membership.
   - Teacher retrieve documents/RAG.
   - Neu lesson persistence da lam trong V2 tiep theo, Student open published lesson.
6. Neu smoke pass, moi lap ke hoach restore production.

Production restore checklist:

- [ ] Chon restore point truoc thoi diem su co.
- [ ] Thong bao downtime.
- [ ] Dung Dashboard Backup/PITR hoac Supabase Management API theo docs.
- [ ] Sau restore, chay `./init.sh`.
- [ ] Chay manual smoke Admin/Teacher/Student.
- [ ] Reset password custom DB roles neu daily backup khong bao gom password role custom.

## 4. User Data Export

Muc tieu la xuat du lieu lien quan den mot user/organization ma khong lam lo secret.

Du lieu core can xem xet theo tien do V2:

- `profiles`, `organizations`, `organization_members` khi production auth/organization duoc lam.
- `courses`, `classes`, `class_students` da co production repository trong V2-001.
- `documents`, `document_chunks`, `generation_jobs`.
- `course_outlines`, `outline_sessions`, `lesson_sessions`, `lesson_blocks`, `lesson_block_citations` khi duoc persist trong V2 tiep theo.
- `audit_events`, `exports`, `student_progress`, `tutor_messages` khi cac feature do ton tai.

Command mau server-side, khong in secret:

```bash
export DATABASE_URL="<set-in-shell-only>"
psql "$DATABASE_URL" \
  --set=teacher_id='<teacher-id>' \
  --command="copy (select * from courses where teacher_id = :'teacher_id') to stdout with csv header" \
  > "/secure/export/courses-<teacher-id>.csv"
```

Checklist:

- [ ] Xac dinh user/organization scope.
- [ ] Export vao folder secure ngoai repo.
- [ ] Khong export raw secrets hoac env vars.
- [ ] Neu export cho Student, chi include du lieu Student duoc phep xem va private notes/progress cua Student do.
- [ ] Ghi log action vao ops note/audit, khong ghi data nhay cam vao chat.

## 5. User Data Delete

Thao tac delete can co approval ro ben ngoai app.

Quy trinh:

1. Xac dinh user id/email va organization scope.
2. Chay export truoc khi delete neu policy yeu cau.
3. Xac dinh dependency:
   - Teacher co course/class/lesson.
   - Student co class membership/progress/notes/submissions.
   - Admin co moderation/audit events.
4. Neu co Supabase Auth user, revoke/sign out sessions truoc khi delete user.
5. Delete theo transaction co log:

```sql
begin;
-- replace placeholders before running in SQL editor or psql
-- delete from class_students where student_id = '<user-id>';
-- update courses set teacher_id = '<replacement-teacher-id>' where teacher_id = '<user-id>';
commit;
```

Rules:

- Khong hard-delete audit events neu compliance can trace; co the pseudonymize actor id/email thay vi xoa.
- Khong xoa documents neu citations cu van can doc; archive/deactivate source neu phu hop.
- Khong chay delete production bang command copy-paste khi chua review `where` clause.

## 6. Secret Safety

Khong bao gio in cac gia tri nay vao log/chat:

- `SECRET_API_KEY_SUPABASE`
- service role key
- `OPENAI_API_KEY`
- `NVIDIA_OPENAI_API_KEY`
- `DATABASE_URL`
- `SUPABASE_POOLER_CONNECTING_STRING`
- `SUPABASE_DIRECT_CONNECTING_STRING`
- `SUPABASE_ACCESS_TOKEN`

Duoc phep log:

- Ten env var.
- Project ref da mask mot phan.
- Status command.
- Count rows, job id, document id, course id, lesson id.

Khong commit:

- `.env`
- raw `data/books/`
- backup `.sql`, `.dump`, `.tar`, `.zip`
- exported CSV user data.

## 7. Health And Smoke Commands

Baseline:

```bash
./init.sh
```

Backend health:

```bash
curl http://127.0.0.1:3000/api/v1/health
```

Production persistence smoke:

```bash
export LEARNING_REPOSITORY=postgres
cd backend
uv run pytest tests/test_learning_persistence.py -q
```

Manual smoke:

1. Teacher tao course/class.
2. Teacher add Student demo.
3. Restart backend.
4. Teacher/Student dang nhap lai va xac nhan membership con ton tai.

## 8. Khi Gap Su Co

- Neu DB khong ket noi: kiem tra pooler/direct connection, DNS/network, va secret deployment. Khong in connection string.
- Neu Data API tra 404/42501: kiem tra table expose/grants/RLS theo docs Supabase. Backend production hien dung DB server-side, khong can expose public Data API cho core tables.
- Neu restore fail: dung thao tac destructive tiep theo, giu log loi, kiem tra Supabase dashboard/backups, va restore staging truoc khi retry production.
- Neu AI cost/job tang bat thuong: tam thoi disable endpoint generate bang config/deploy rule hoac rate limit reverse proxy cho den khi co V2 rate guard.
