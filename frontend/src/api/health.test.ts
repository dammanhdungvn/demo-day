import { describe, expect, it, vi } from 'vitest'

import { fetchHealth } from './health'

describe('fetchHealth', () => {
  it('calls the health endpoint and returns the payload', async () => {
    const backendUrl = 'https://api.example.test/api/v1'
    const payload = {
      status: 'ok' as const,
      service: 'teachflow-api',
      version: '0.1.0',
      timestamp: '2026-06-28T00:00:00.000Z',
    }
    const fetcher = vi.fn(async () => Response.json(payload))

    await expect(fetchHealth(fetcher, backendUrl)).resolves.toEqual(payload)

    expect(fetcher).toHaveBeenCalledWith(
      `${backendUrl}/health`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
    )
  })

  it('throws a clear error when the health endpoint is unavailable', async () => {
    const backendUrl = 'https://api.example.test/api/v1'
    const fetcher = vi.fn(async () => new Response(null, { status: 503 }))

    await expect(fetchHealth(fetcher, backendUrl)).rejects.toThrow(
      'Health check failed with status 503',
    )
  })
})
