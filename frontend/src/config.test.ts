import { describe, expect, it } from 'vitest'

import {
  buildApiUrl,
  getBackendUrl,
  getRealAccountShortcuts,
} from './config'

describe('backend URL config', () => {
  it('normalizes the backend URL from configured env value', () => {
    expect(
      getBackendUrl('https://teachflow.example.com/api/v1/'),
    ).toBe('https://teachflow.example.com/api/v1')
  })

  it('builds endpoint URLs without hardcoding the backend host', () => {
    expect(buildApiUrl('/health', 'https://api.example.com/api/v1')).toBe(
      'https://api.example.com/api/v1/health',
    )
  })

  it('supports a same-origin API base for local Vite proxy', () => {
    expect(buildApiUrl('/auth/demo-accounts', '/api/v1')).toBe(
      '/api/v1/auth/demo-accounts',
    )
  })

  it('fails clearly when the backend URL is missing', () => {
    expect(() => getBackendUrl('')).toThrow('URL_BACKEND')
  })

  it('loads only configured real account shortcuts', () => {
    expect(
      getRealAccountShortcuts([
        {
          role: 'admin',
          email: 'admin.qa@example.edu',
          password: 'public-recruiter-password',
        },
        {
          role: 'teacher',
          email: 'teacher.qa@example.edu',
        },
        {
          role: 'system_admin',
          email: 'owner.qa@example.edu',
        },
        {
          role: 'student',
          email: '',
        },
      ]),
    ).toEqual([
      {
        role: 'admin',
        email: 'admin.qa@example.edu',
        password: 'public-recruiter-password',
      },
      {
        role: 'teacher',
        email: 'teacher.qa@example.edu',
      },
    ])
  })
})
