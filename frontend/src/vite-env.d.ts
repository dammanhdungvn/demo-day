/// <reference types="vite/client" />

declare const __TEACHFLOW_URL_BACKEND__: string | undefined
declare const __TEACHFLOW_REAL_ACCOUNT_SHORTCUTS__:
  | ReadonlyArray<{
    role?: string
    email?: string
    password?: string
  }>
  | undefined
