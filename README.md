# TeachFlow AI

README nay chi la huong dan nhanh de cai dat, chay local va verify project. README khong phai source-of-truth nghiep vu, scope, backlog hay product direction.

Source-of-truth hien tai:

- `AGENTS.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `docs/version1/` den `docs/version5/`
- `docs/harness/`

## Project Hien Tai

TeachFlow AI la workspace cho nhom dao tao/department nho co tai lieu noi bo rieng:

```text
Admin quan ly long-term knowledge library
-> Teacher tao course/class va upload contextual docs
-> AI tao outline/lesson co citation
-> Teacher review va submit
-> Admin publish
-> Student hoc lesson, ghi chu, luyen tap va hoi AI Tutor co citation
```

Ngach san pham V5: small training centers/departments can bien PDF/SOP/slide noi bo thanh lesson co citation va learner support co kiem soat, khong can mua LMS/AI platform enterprise nang.

## Tech Stack

- Frontend: Vite + React + TypeScript, `pnpm`
- Backend: FastAPI + Python 3.11, `uv`
- Persistence: memory mode cho local demo nhanh, Postgres/Supabase mode cho production conversion
- Knowledge/RAG: Supabase Postgres/pgvector, document chunks, citations
- AI: OpenAI-compatible provider qua backend only
- API docs: FastAPI Swagger tai `/api/v1/docs`

## Yeu Cau

- Python 3.11+
- `uv`
- Node.js 20+
- `pnpm`
- Supabase project neu chay Postgres/RAG production path
- OpenAI-compatible API key neu chay AI generation/tutor that

## Cai Dat Env

Tao `.env` tu template:

```bash
cp .env.example .env
```

Bien quan trong:

```env
# Frontend
URL_BACKEND=/api/v1

# Backend local/demo
BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
LEARNING_REPOSITORY=memory
AUTH_PROVIDER=demo
AUTH_REPOSITORY=memory
ENABLE_DEMO_LOGIN=true

# Supabase/Postgres
URL_SUPABASE=...
PUBLIC_API_KEY_SUPABASE=...
SECRET_API_KEY_SUPABASE=...
SUPABASE_POOLER_CONNECTING_STRING=...
# hoac SUPABASE_DIRECT_CONNECTING_STRING=...

# AI
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
EMBEDDING_PROVIDER=local-hash
```

Local dev mac dinh dung `URL_BACKEND=/api/v1` de Vite proxy API sang backend `127.0.0.1:3000`. Khi deploy frontend static, doi `URL_BACKEND` thanh public backend base URL co `/api/v1`, vi du:

```env
URL_BACKEND=https://your-backend.example.com/api/v1
```

Khong commit `.env` that. Frontend khong duoc chua OpenAI key, Supabase service role key, database URL hay secret nao.

## Verify Toan Bo Project

Chay tu root repo:

```bash
./init.sh
```

Script nay se:

- Kiem tra harness files va `feature_list.json`.
- Kiem tra `.env.example` va local `.env` neu co.
- Cai/check frontend dependencies.
- Chay frontend typecheck, lint, tests va build.
- Chay backend dependency sync, pytest va compile check.
- Kiem tra frontend source khong hardcode backend URL/secret key names.

Baseline gan nhat: frontend 15 files/72 tests + build pass, backend 199 tests pass.

## Chay Local

Mo 2 terminal.

Terminal 1 - backend:

```bash
cd backend
uv run fastapi dev main.py --host 127.0.0.1 --port 3000
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

Smoke checks:

```bash
curl http://127.0.0.1:3000/api/v1/health
curl http://127.0.0.1:5173/api/v1/auth/demo-accounts
```

Neu chay trong IDE/cloud workspace can forwarded port:

```bash
cd frontend
pnpm dev --host 0.0.0.0 --port 5173
```

## Demo Accounts

Quick demo login chi nen bat local/demo bang `ENABLE_DEMO_LOGIN=true`.

Accounts:

- Admin: `admin@teachflow.local`
- Teacher: `teacher@teachflow.local`
- Student: `student@teachflow.local`

Password demo:

```text
teachflow-demo
```

## Demo Flow Nhanh

1. Login Teacher.
2. Tao course va class.
3. Add demo Student vao class.
4. Upload/chon tai lieu soan bai.
5. Generate outline.
6. Generate lesson blocks.
7. Review citations/warnings.
8. Edit/regenerate neu can.
9. Approve tat ca blocks.
10. Submit lesson cho Admin.
11. Login Admin.
12. Mo moderation queue.
13. Publish hoac request changes/reject.
14. Login Student.
15. Xem class va published lesson.
16. Ghi chu/bookmark block.
17. Lam practice/self-check.
18. Hoi `AI Tutor co citation` trong lesson.
19. Mo presentation hoac export PDF/Markdown/PPTX.

Runbook chi tiet:

```text
docs/harness/DEMO_RUNBOOK.md
```

## Cac Workflow Da Co

- Auth demo/Supabase foundation, invite acceptance, JWT/session guard.
- Course/class/student membership voi org scope.
- Admin long-term knowledge library hidden voi Teacher/Student.
- Teacher/Student contextual documents owner-scoped.
- PDF upload, URL ingestion, document lifecycle, re-index embeddings.
- RAG retrieval voi citation metadata va AI safety sanitizer.
- Outline/lesson generation, Lesson Studio review, block status, regenerate.
- Admin moderation: publish, request changes, reject.
- Student published lesson access, progress, notes, bookmarks.
- Student review hub, practice deck, self-check attempts.
- Student grounded tutor cho lesson da publish.
- Export records/history cho Markdown/PPTX/PDF.
- OpenAPI/Swagger contract, structured logging, generation jobs, audit events.

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

API docs local:

```text
http://127.0.0.1:3000/api/v1/docs
```

## Supabase Va Knowledge Base

`data/books/` chi dung local pre-ingest, duoc ignore khoi git va khong deploy.

Neu can tao schema hoac ingest/resume local books:

```bash
cd backend
uv run python scripts/ingest_books.py --schema-only
uv run python scripts/ingest_books.py --start-index 5
```

Chi chay ingest khi `.env` da tro dung Supabase project va ban hieu minh dang ghi vao database nao.

## Production Mode Notes

Local default dung memory repository de demo/test nhanh. Production conversion dung Postgres/Supabase:

```env
LEARNING_REPOSITORY=postgres
AUTH_PROVIDER=supabase
AUTH_REPOSITORY=postgres
ENABLE_DEMO_LOGIN=false
EMBEDDING_PROVIDER=openai
```

Can set:

- `BACKEND_CORS_ORIGINS` bang frontend production origin.
- Supabase service role/database connection tren backend runtime only.
- OpenAI/NVIDIA key tren backend runtime only.
- `URL_BACKEND` cua frontend bang backend public URL co `/api/v1`, sau do build lai frontend.

Operations runbook:

```text
docs/harness/OPERATIONS_RUNBOOK.md
```

## Guardrails

- Khong dung README de suy luan backlog/scope. Doc `docs/version*/`, `feature_list.json`, `progress.md`, `session-handoff.md`.
- Khong commit `.env`, raw PDFs/books, backups, exported CSV, database dumps.
- Khong dua AI provider key/Supabase service key vao frontend.
- Backend la noi enforce role, organization, ownership, membership va lesson status.
- Moi task code moi phai tao/cap nhat exec plan trong `docs/harness/exec-plans/` va chay `./init.sh`.

## Trang Thai Hien Tai

- `feature_list.json`: 77/77 features done, khong co feature active.
- V1-V5 backlog hien tai da co evidence.
- Final verification gan nhat: `./init.sh` pass voi frontend 15 files/72 tests + build va backend 199 tests.
