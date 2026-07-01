import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const frontendDir = dirname(fileURLToPath(import.meta.url))
const rootEnvDir = resolve(frontendDir, '..')

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootEnvDir, '')
  const backendUrl = (process.env.URL_BACKEND ?? env.URL_BACKEND ?? '').trim()
  const realAccountSharedPassword = (
    process.env.TEACHFLOW_PUBLIC_REAL_ACCOUNT_PASSWORD
    ?? env.TEACHFLOW_PUBLIC_REAL_ACCOUNT_PASSWORD
    ?? ''
  ).trim()
  const realAccountShortcuts = [
    {
      role: 'admin',
      email: (
        process.env.TEACHFLOW_PUBLIC_ADMIN_EMAIL
        ?? env.TEACHFLOW_PUBLIC_ADMIN_EMAIL
        ?? ''
      ).trim(),
      password: (
        process.env.TEACHFLOW_PUBLIC_ADMIN_PASSWORD
        ?? env.TEACHFLOW_PUBLIC_ADMIN_PASSWORD
        ?? realAccountSharedPassword
      ).trim(),
    },
    {
      role: 'teacher',
      email: (
        process.env.TEACHFLOW_PUBLIC_TEACHER_EMAIL
        ?? env.TEACHFLOW_PUBLIC_TEACHER_EMAIL
        ?? ''
      ).trim(),
      password: (
        process.env.TEACHFLOW_PUBLIC_TEACHER_PASSWORD
        ?? env.TEACHFLOW_PUBLIC_TEACHER_PASSWORD
        ?? realAccountSharedPassword
      ).trim(),
    },
    {
      role: 'student',
      email: (
        process.env.TEACHFLOW_PUBLIC_STUDENT_EMAIL
        ?? env.TEACHFLOW_PUBLIC_STUDENT_EMAIL
        ?? ''
      ).trim(),
      password: (
        process.env.TEACHFLOW_PUBLIC_STUDENT_PASSWORD
        ?? env.TEACHFLOW_PUBLIC_STUDENT_PASSWORD
        ?? realAccountSharedPassword
      ).trim(),
    },
  ]

  return {
    envDir: rootEnvDir,
    define: {
      __TEACHFLOW_URL_BACKEND__: JSON.stringify(backendUrl),
      __TEACHFLOW_REAL_ACCOUNT_SHORTCUTS__: JSON.stringify(realAccountShortcuts),
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
  }
})
