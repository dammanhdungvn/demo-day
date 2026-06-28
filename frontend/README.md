# TeachFlow AI Frontend

Frontend Vite + React + TypeScript cho TeachFlow AI.

## Local

```bash
pnpm install
pnpm dev
```

Frontend đọc API base từ `URL_BACKEND` ở `.env` root hoặc env runtime qua `vite.config.ts`. Không hardcode backend URL trong `src/`.

Local dev nên dùng `URL_BACKEND=/api/v1`; Vite proxy sẽ chuyển `/api` sang backend `127.0.0.1:3000`. Khi deploy static frontend, đổi `URL_BACKEND` thành public backend URL có `/api/v1` rồi build lại.

## Verification

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```
