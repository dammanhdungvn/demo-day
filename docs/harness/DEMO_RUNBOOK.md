# Demo Runbook - TeachFlow AI MVP

## Muc Tieu

Checklist nay dung de user testing MVP truoc deploy. Khong dua secret vao tai lieu nay; chi dung ten bien env.

## Dieu Kien Truoc Khi Chay

- Root `.env` da co cac bien bat buoc:
  - `URL_BACKEND`
  - `URL_SUPABASE`
  - `PUBLIC_API_KEY_SUPABASE`
  - `SECRET_API_KEY_SUPABASE`
  - `SUPABASE_POOLER_CONNECTING_STRING` hoac `SUPABASE_DIRECT_CONNECTING_STRING`
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
- Supabase knowledge base da co documents/chunks. Evidence hien tai: 5 completed documents va 4,256 chunks.
- `data/books/` chi dung local pre-ingest, khong deploy folder nay.

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

Local `.env` nen dung `URL_BACKEND=/api/v1`; Vite se proxy API sang backend `127.0.0.1:3000`. Smoke test:

```bash
curl http://127.0.0.1:5173/api/v1/auth/demo-accounts
```

Demo accounts:
- Admin: `admin@teachflow.local`
- Teacher: `teacher@teachflow.local`
- Student: `student@teachflow.local`
- Password demo: `teachflow-demo`

## Manual Demo Flow

1. Login Teacher.
2. Tao course `Introduction to Artificial Intelligence`.
3. Tao class `KTPM-K18`, level `average`, 1-12 sessions.
4. Add demo Student vao class.
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

- Auth/course/class/outline/lesson/moderation state dang in-memory cho demo. Neu backend restart, phai tao lai course/class/outline/lesson trong demo flow.
- RAG da doc Supabase, nhung embedding hien la local hash embedding va chi ingest 5 PDFs dau tien.
- PDF export dung browser print, chua co backend export record.

## Stop Criteria Cho User Testing

User co the bat dau testing khi:
- `./init.sh` pass.
- Backend va frontend local chay duoc.
- Manual demo flow den Student presentation/PDF pass.
