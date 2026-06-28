import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { fetchHealth, type HealthResponse } from './api/health'
import { getBackendUrl } from './config'

type HealthState =
  | { status: 'loading' }
  | { status: 'ready'; data: HealthResponse }
  | { status: 'error'; message: string }

function App() {
  const backendUrl = useMemo(() => {
    try {
      return getBackendUrl()
    } catch {
      return ''
    }
  }, [])
  const [health, setHealth] = useState<HealthState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    fetchHealth()
      .then((data) => {
        if (!cancelled) {
          setHealth({ status: 'ready', data })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setHealth({
            status: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Backend health check failed',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="shell">
      <section className="hero-panel" aria-labelledby="page-title">
        <div className="intro">
          <p className="system-label">TeachFlow AI</p>
          <h1 id="page-title">MVP foundation is online</h1>
          <p className="summary">
            Baseline frontend and backend are ready for the next vertical slice:
            role-based auth, source documents, RAG retrieval, and citation-first
            lesson generation.
          </p>
        </div>

        <div className="status-panel" aria-live="polite">
          <div className="status-header">
            <span className="status-dot" data-state={health.status}></span>
            <span>Backend health</span>
          </div>

          {health.status === 'loading' && (
            <p className="status-text">Checking API availability...</p>
          )}

          {health.status === 'ready' && (
            <dl className="health-grid">
              <div>
                <dt>Status</dt>
                <dd>{health.data.status}</dd>
              </div>
              <div>
                <dt>Service</dt>
                <dd>{health.data.service}</dd>
              </div>
              <div>
                <dt>Version</dt>
                <dd>{health.data.version}</dd>
              </div>
            </dl>
          )}

          {health.status === 'error' && (
            <p className="status-text error">{health.message}</p>
          )}

          <p className="backend-url">
            API base: <code>{backendUrl || 'URL_BACKEND missing'}</code>
          </p>
        </div>
      </section>
    </main>
  )
}

export default App
