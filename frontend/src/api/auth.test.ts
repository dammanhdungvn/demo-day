import { describe, expect, it, vi } from 'vitest'

import {
  fetchCurrentUser,
  fetchDemoAccounts,
  fetchRoleDashboard,
  login,
} from './auth'

const backendUrl = 'https://api.example.test/api/v1'

describe('auth API client', () => {
  it('loads demo accounts from the backend API base URL', async () => {
    const payload = [
      {
        id: 'demo-admin',
        email: 'admin@teachflow.local',
        name: 'Admin Demo',
        role: 'admin' as const,
        label: 'Admin',
      },
    ]
    const fetcher = vi.fn(async () => Response.json(payload))

    await expect(fetchDemoAccounts(fetcher, backendUrl)).resolves.toEqual(payload)

    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/auth/demo-accounts`, {
      headers: {
        Accept: 'application/json',
      },
    })
  })

  it('logs in with JSON credentials and returns token plus user role', async () => {
    const payload = {
      access_token: 'session-token',
      token_type: 'bearer' as const,
      user: {
        id: 'demo-teacher',
        email: 'teacher@teachflow.local',
        name: 'Teacher Demo',
        role: 'teacher' as const,
      },
    }
    const fetcher = vi.fn(async () => Response.json(payload))

    await expect(
      login(
        { email: 'teacher@teachflow.local', password: 'teachflow-demo' },
        fetcher,
        backendUrl,
      ),
    ).resolves.toEqual(payload)

    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teacher@teachflow.local',
        password: 'teachflow-demo',
      }),
    })
  })

  it('sends bearer token when loading current user', async () => {
    const payload = {
      id: 'demo-student',
      email: 'student@teachflow.local',
      name: 'Student Demo',
      role: 'student' as const,
    }
    const fetcher = vi.fn(async () => Response.json(payload))

    await expect(fetchCurrentUser('token-123', fetcher, backendUrl)).resolves.toEqual(
      payload,
    )

    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/me`, {
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer token-123',
      },
    })
  })

  it('surfaces protected endpoint failures with status code', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 403 }))

    await expect(
      fetchRoleDashboard('teacher', 'student-token', fetcher, backendUrl),
    ).rejects.toThrow('Teacher dashboard failed with status 403')
  })
})
