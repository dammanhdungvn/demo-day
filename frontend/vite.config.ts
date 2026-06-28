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

  return {
    envDir: rootEnvDir,
    define: {
      __TEACHFLOW_URL_BACKEND__: JSON.stringify(backendUrl),
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
