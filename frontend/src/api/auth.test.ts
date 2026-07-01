import { describe, expect, it, vi } from 'vitest'

import {
  acceptInvite,
  bulkResetManagedUserPasswords,
  bulkUpdateManagedUserStatus,
  createSystemAdminInvite,
  createSystemOrganization,
  demoLogin,
  fetchCurrentUser,
  fetchDemoAccounts,
  fetchInvites,
  fetchManagedUsers,
  fetchRoleDashboard,
  fetchSystemOrganizations,
  getRoleRoute,
  createInvite,
  login,
  refreshSession,
  updateManagedUser,
  updateManagedUserStatus,
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

  it('surfaces backend auth error detail instead of a bare status code', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({ detail: 'Invalid demo account credentials' }, { status: 401 }),
    )

    await expect(
      login(
        { email: 'teacher@teachflow.local', password: 'wrong-password' },
        fetcher,
        backendUrl,
      ),
    ).rejects.toThrow('Login failed: Invalid demo account credentials')
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

  it('routes system admin to the system workspace dashboard path', async () => {
    const dashboard = {
      workspace: 'system_admin' as const,
      title: 'System Owner Dashboard',
      current_user: {
        id: 'auth-owner',
        email: 'owner@example.edu',
        name: 'TeachFlow Owner',
        role: 'system_admin' as const,
        organization_id: 'org-platform',
      },
      allowed_actions: ['Tạo tổ chức'],
      hidden_actions: ['Demo role shortcuts'],
      next_step: 'Tạo organization đầu tiên.',
    }
    const fetcher = vi.fn(async () => Response.json(dashboard))

    await expect(
      fetchRoleDashboard('system_admin', 'owner-token', fetcher, backendUrl),
    ).resolves.toEqual(dashboard)

    expect(getRoleRoute('system_admin')).toBe('/system')
    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/system/dashboard`, {
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer owner-token',
      },
    })
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

  it('lets system admin manage organizations and create first admin invites', async () => {
    const organization = {
      id: 'org-training-center',
      name: 'Training Center',
      created_at: '2026-06-30T00:00:00+00:00',
      updated_at: '2026-06-30T00:00:00+00:00',
    }
    const invite = {
      id: 'invite-admin',
      email: 'admin@training.edu',
      role: 'admin' as const,
      status: 'pending' as const,
      organization_id: organization.id,
      invited_by: 'auth-owner',
      invite_code: 'invite-code',
      created_at: '2026-06-30T00:00:00+00:00',
      accepted_at: null,
    }
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json([organization]))
      .mockResolvedValueOnce(Response.json(organization))
      .mockResolvedValueOnce(Response.json(invite))

    await expect(fetchSystemOrganizations('owner-token', fetcher, backendUrl)).resolves.toEqual([
      organization,
    ])
    await expect(
      createSystemOrganization(
        { id: organization.id, name: organization.name },
        'owner-token',
        fetcher,
        backendUrl,
      ),
    ).resolves.toEqual(organization)
    await expect(
      createSystemAdminInvite(
        organization.id,
        { email: invite.email },
        'owner-token',
        fetcher,
        backendUrl,
      ),
    ).resolves.toEqual(invite)

    expect(fetcher).toHaveBeenNthCalledWith(1, `${backendUrl}/system/organizations`, {
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer owner-token',
      },
    })
    expect(fetcher).toHaveBeenNthCalledWith(2, `${backendUrl}/system/organizations`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer owner-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: organization.id, name: organization.name }),
    })
    expect(fetcher).toHaveBeenNthCalledWith(
      3,
      `${backendUrl}/system/organizations/${organization.id}/admin-invites`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer owner-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: invite.email }),
      },
    )
  })

  it('lets admin list and update managed teacher/student users', async () => {
    const teacher = {
      id: 'demo-teacher',
      email: 'teacher@teachflow.local',
      name: 'Teacher Demo',
      role: 'teacher' as const,
      status: 'active' as const,
      organization_id: 'org-demo',
      created_at: '2026-06-30T00:00:00+00:00',
      updated_at: '2026-06-30T00:00:00+00:00',
    }
    const disabledTeacher = {
      ...teacher,
      status: 'disabled' as const,
      updated_at: '2026-06-30T01:00:00+00:00',
    }
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json([teacher]))
      .mockResolvedValueOnce(Response.json(disabledTeacher))

    await expect(
      fetchManagedUsers(
        'admin-token',
        { role: 'teacher', status: 'active' },
        fetcher,
        backendUrl,
      ),
    ).resolves.toEqual([teacher])
    await expect(
      updateManagedUserStatus(
        teacher.id,
        'disabled',
        'admin-token',
        fetcher,
        backendUrl,
      ),
    ).resolves.toEqual(disabledTeacher)

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      `${backendUrl}/auth/users?role=teacher&status=active`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer admin-token',
        },
      },
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      `${backendUrl}/auth/users/${teacher.id}`,
      {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer admin-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'disabled' }),
      },
    )
  })

  it('updates managed user profile fields through the same scoped endpoint', async () => {
    const teacher = {
      id: 'demo-teacher',
      email: 'lead.teacher@example.edu',
      name: 'Lead Teacher',
      role: 'teacher' as const,
      status: 'active' as const,
      organization_id: 'org-demo',
      created_at: '2026-06-30T00:00:00+00:00',
      updated_at: '2026-06-30T02:00:00+00:00',
    }
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json(teacher))

    await expect(
      updateManagedUser(
        teacher.id,
        {
          name: 'Lead Teacher',
          email: 'lead.teacher@example.edu',
          status: 'active',
        },
        'admin-token',
        fetcher,
        backendUrl,
      ),
    ).resolves.toEqual(teacher)

    expect(fetcher).toHaveBeenCalledWith(`${backendUrl}/auth/users/${teacher.id}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Lead Teacher',
        email: 'lead.teacher@example.edu',
        status: 'active',
      }),
    })
  })

  it('supports admin bulk managed user status and password reset actions', async () => {
    const updatedTeacher = {
      id: 'demo-teacher',
      email: 'teacher@teachflow.local',
      name: 'Teacher Demo',
      role: 'teacher' as const,
      status: 'disabled' as const,
      organization_id: 'org-demo',
      created_at: '2026-06-30T00:00:00+00:00',
      updated_at: '2026-06-30T03:00:00+00:00',
    }
    const statusResponse = {
      users: [updatedTeacher],
      updated_count: 1,
    }
    const resetResponse = {
      requested_count: 2,
      sent_count: 1,
      skipped_count: 1,
      skipped_user_ids: ['demo-teacher'],
    }
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(statusResponse))
      .mockResolvedValueOnce(Response.json(resetResponse))

    await expect(
      bulkUpdateManagedUserStatus(
        { user_ids: ['demo-teacher'], status: 'disabled' },
        'admin-token',
        fetcher,
        backendUrl,
      ),
    ).resolves.toEqual(statusResponse)
    await expect(
      bulkResetManagedUserPasswords(
        {
          user_ids: ['demo-teacher', 'supabase-student'],
          redirect_to: 'https://teachflow.example/reset-password',
        },
        'admin-token',
        fetcher,
        backendUrl,
      ),
    ).resolves.toEqual(resetResponse)

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      `${backendUrl}/auth/users/bulk-status`,
      {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer admin-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_ids: ['demo-teacher'],
          status: 'disabled',
        }),
      },
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      `${backendUrl}/auth/users/bulk-password-reset`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer admin-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_ids: ['demo-teacher', 'supabase-student'],
          redirect_to: 'https://teachflow.example/reset-password',
        }),
      },
    )
  })
})
