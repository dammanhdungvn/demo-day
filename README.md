# TeachFlow AI MVP

README nay chi huong dan cach cai dat, chay local, verify va test demo. Tai lieu nghiep vu/source-of-truth nam trong `docs/version1/`, `feature_list.json`, `progress.md` va `session-handoff.md`.

## Yeu Cau

- Python 3.11+
- `uv`
- Node.js 20+
- `pnpm`
- Supabase project da co schema/chunks knowledge base
- OpenAI API key hop le cho backend

## Cai Dat Env

Tao file `.env` o root repo tu `.env.example`:

```bash
cp .env.example .env
```

Cap nhat cac bien bat buoc trong `.env`:

```bash
URL_BACKEND=/api/v1
BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

URL_SUPABASE=...
PUBLIC_API_KEY_SUPABASE=...
SECRET_API_KEY_SUPABASE=...
SUPABASE_POOLER_CONNECTING_STRING=...
# hoac SUPABASE_DIRECT_CONNECTING_STRING=...

OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
```

Khi chay local, `URL_BACKEND=/api/v1` se di qua Vite proxy toi backend `127.0.0.1:3000`, tranh loi browser goi nham `localhost` cua may user khi dung forwarded/preview URL. Khi deploy frontend static, doi `URL_BACKEND` thanh public backend base URL co `/api/v1`, vi du `https://your-backend.example.com/api/v1`.

Khong commit `.env` that. Frontend khong duoc chua OpenAI key hoac Supabase secret key.

## Verify Toan Bo Project

Chay tu root repo:

```bash
./init.sh
```

Script nay se:

- Kiem tra harness/docs/env names.
- Cai dependencies frontend bang `pnpm`.
- Chay frontend typecheck, lint, test, build.
- Chay backend `uv sync`, pytest va compile check.
- Kiem tra frontend source khong hardcode backend URL/secret key names.

Ket qua hien tai mong doi: frontend tests pass, backend pytest pass.

## Chay Local

Mo 2 terminal.

Terminal 1 - backend:

```bash
cd backend
uv run fastapi dev main.py --host 127.0.0.1 --port 3000
```

Backend health:

```bash
curl http://127.0.0.1:3000/api/v1/health
```

Terminal 2 - frontend:

```bash
cd frontend
pnpm dev --host 127.0.0.1 --port 5173
```

Mo app:

```text
http://127.0.0.1:5173
```

Neu ban can mo frontend qua preview/forwarded port cua IDE/cloud workspace, co the chay frontend voi host `0.0.0.0`:

```bash
cd frontend
pnpm dev --host 0.0.0.0 --port 5173
```

Voi local dev proxy, frontend se goi API qua cung origin:

```bash
curl http://127.0.0.1:5173/api/v1/auth/demo-accounts
```

## Demo Accounts

Password chung:

```text
teachflow-demo
```

Accounts:

- Admin: `admin@teachflow.local`
- Teacher: `teacher@teachflow.local`
- Student: `student@teachflow.local`

## Demo Flow Nhanh

1. Login Teacher.
2. Tao course va class.
3. Add demo Student vao class.
4. Chon completed knowledge source.
5. Generate outline.
6. Generate lesson blocks.
7. Review/edit/regenerate neu can.
8. Approve tat ca blocks.
9. Submit lesson cho Admin.
10. Login Admin.
11. Mo moderation queue.
12. Approve & Publish, hoac Request changes kem feedback.
13. Login Student.
14. Xem class va published lesson.
15. Mo lesson, presentation, va Export PDF bang browser print.

Runbook chi tiet:

```text
docs/harness/DEMO_RUNBOOK.md
```

## Test Rieng Le

Frontend:

```bash
cd frontend
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Backend:

```bash
cd backend
uv sync
uv run pytest -q
```

## Supabase Knowledge Base

App runtime doc documents/chunks tu Supabase. `data/books/` chi dung local pre-ingest va khong deploy.

Neu can ingest/resume local books:

```bash
cd backend
uv run python scripts/ingest_books.py --schema-only
uv run python scripts/ingest_books.py --start-index 5
```

Chi chay ingest khi `.env` da co Supabase connection string dung va ban hieu minh dang ghi vao DB nao.

## Deploy Notes

Backend production command toi thieu:

```bash
cd backend
uv run fastapi run main.py --host 0.0.0.0 --port 3000
```

Frontend build:

```bash
cd frontend
pnpm build
```

Khi deploy:

- `URL_BACKEND` cua frontend phai tro toi backend deployed base URL co `/api/v1`.
- `BACKEND_CORS_ORIGINS` tren backend phai co frontend production origin.
- OpenAI key va Supabase secret chi dat tren backend runtime.
- Build lai frontend sau khi doi `URL_BACKEND`.

## Luu Y MVP

- Demo auth, course/class, outline, lesson va moderation state hien dang in-memory. Neu backend restart, can tao lai flow demo.
- RAG da doc Supabase, nhung embedding demo hien la deterministic local hash embedding.
- PDF export dung browser print, chua co backend export record.
