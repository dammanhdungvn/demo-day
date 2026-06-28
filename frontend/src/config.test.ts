import { describe, expect, it } from 'vitest'

import { buildApiUrl, getBackendUrl } from './config'

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

  it('fails clearly when the backend URL is missing', () => {
    expect(() => getBackendUrl('')).toThrow('URL_BACKEND')
  })
})
