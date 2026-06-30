import { describe, expect, it } from 'vitest'

import type { AuthSession } from '../api/auth'
import { clearAuthSession, loadAuthSession, saveAuthSession } from './session'

class MemoryStorage implements Storage {
  private items = new Map<string, string>()

  get length() {
    return this.items.size
  }

  clear() {
    this.items.clear()
  }

  getItem(key: string) {
    return this.items.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.items.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.items.delete(key)
  }

  setItem(key: string, value: string) {
    this.items.set(key, value)
  }
}

const session: AuthSession = {
  access_token: 'token',
  token_type: 'bearer',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  user: {
    id: 'demo-admin',
    email: 'admin@teachflow.local',
    name: 'Admin Demo',
    role: 'admin',
    organization_id: 'org-demo',
  },
}

describe('auth session storage', () => {
  it('stores and loads a minimal versioned auth session', () => {
    const storage = new MemoryStorage()

    saveAuthSession(session, storage)

    expect(loadAuthSession(storage)).toEqual(session)
  })

  it('ignores malformed stored sessions', () => {
    const storage = new MemoryStorage()
    storage.setItem('teachflow.auth:v1', JSON.stringify({ access_token: 'bad' }))

    expect(loadAuthSession(storage)).toBeNull()
  })

  it('clears the stored session without throwing', () => {
    const storage = new MemoryStorage()
    saveAuthSession(session, storage)

    clearAuthSession(storage)

    expect(loadAuthSession(storage)).toBeNull()
  })
})
