import { describe, expect, it, vi } from 'vitest'

import {
  acceptInvite,
  demoLogin,
  fetchCurrentUser,
  fetchDemoAccounts,
  fetchInvites,
  fetchRoleDashboard,
  createInvite,
  login,
  refreshSession,
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

  it('quick logs in a demo account without sending a password', async () => {
    const payload = {
      access_token: 'session-token',
      token_type: 'bearer' as const,
      user: {
        id: 'demo-admin',
        email: 'admin@teachflow.local',
        name: 'Admin Demo',
        role: 'admin' as const,
      },
    }
    const fetcher = vi.fn(async () => Response.json(payload))

    await expect(
      demoLogin({ account_id: 'demo-admin' }, fetcher, backendUrl),
    ).resolves.toEqual(payload)

    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/auth/demo-login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ account_id: 'demo-admin' }),
    })
  })

  it('logs in with JSON credentials and returns token plus user role', async () => {
    const payload = {
      access_token: 'session-token',
        token_type: 'bearer' as const,
        refresh_token: 'refresh-token',
        expires_in: 3600,
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

  it('refreshes a session with refresh token', async () => {
    const payload = {
      access_token: 'next-access-token',
      refresh_token: 'next-refresh-token',
      expires_in: 3600,
      token_type: 'bearer' as const,
      user: {
        id: 'auth-teacher',
        email: 'teacher@example.edu',
        name: 'Teacher Real',
        role: 'teacher' as const,
        organization_id: 'org-demo',
      },
    }
    const fetcher = vi.fn(async () => Response.json(payload))

    await expect(
      refreshSession('refresh-token', fetcher, backendUrl),
    ).resolves.toEqual(payload)

    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: 'refresh-token' }),
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

  it('creates and lists organization invites', async () => {
    const invite = {
      id: 'invite-1',
      email: 'new.teacher@example.edu',
      role: 'teacher' as const,
      status: 'pending' as const,
      organization_id: 'org-demo',
      invited_by: 'demo-admin',
      invite_code: 'invite-code',
      created_at: '2026-06-28T00:00:00+00:00',
      accepted_at: null,
    }
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(invite))
      .mockResolvedValueOnce(Response.json([invite]))

    await expect(
      createInvite(
        { email: invite.email, role: invite.role },
        'admin-token',
        fetcher,
        backendUrl,
      ),
    ).resolves.toEqual(invite)
    await expect(fetchInvites('admin-token', fetcher, backendUrl)).resolves.toEqual([
      invite,
    ])

    expect(fetcher).toHaveBeenNthCalledWith(1, `${backendUrl}/auth/invites`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: invite.email, role: invite.role }),
    })
    expect(fetcher).toHaveBeenNthCalledWith(2, `${backendUrl}/auth/invites`, {
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer admin-token',
      },
    })
  })

  it('accepts an invite and returns a login session', async () => {
    const payload = {
      invite_code: 'invite-code',
      email: 'new.teacher@example.edu',
      name: 'New Teacher',
      password: 'strong-password',
    }
    const response = {
      access_token: 'accepted-session-token',
      token_type: 'bearer' as const,
      refresh_token: null,
      expires_in: null,
      user: {
        id: 'accepted-new-teacher',
        email: payload.email,
        name: payload.name,
        role: 'teacher' as const,
        organization_id: 'org-demo',
      },
    }
    const fetcher = vi.fn(async () => Response.json(response))

    await expect(acceptInvite(payload, fetcher, backendUrl)).resolves.toEqual(
      response,
    )

    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/auth/invites/accept`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  })
})
