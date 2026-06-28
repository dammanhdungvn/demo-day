# TeachFlow AI Frontend

Frontend Vite + React + TypeScript cho TeachFlow AI.

## Local

```bash
pnpm install
pnpm dev
```

Frontend đọc API base từ `URL_BACKEND` ở `.env` root hoặc env runtime qua `vite.config.ts`. Không hardcode backend URL trong `src/`.

## Verification

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```
