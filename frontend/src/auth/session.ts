import type { AuthSession, UserProfile, UserRole } from '../api/auth'

const AUTH_SESSION_KEY = 'teachflow.auth:v1'
const VALID_ROLES = new Set<UserRole>([
  'system_admin',
  'admin',
  'teacher',
  'student',
])

type StoredAuthSession = {
  access_token: string
  token_type: 'bearer'
  user: UserProfile
  refresh_token?: string | null
  expires_in?: number | null
}

function getBrowserSessionStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.sessionStorage
}

function isUserProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<UserProfile>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.role === 'string' &&
    VALID_ROLES.has(candidate.role as UserRole) &&
    (candidate.organization_id === undefined ||
      candidate.organization_id === null ||
      typeof candidate.organization_id === 'string')
  )
}

function isStoredAuthSession(value: unknown): value is StoredAuthSession {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<StoredAuthSession>

  return (
    typeof candidate.access_token === 'string' &&
    candidate.token_type === 'bearer' &&
    isUserProfile(candidate.user) &&
    (candidate.refresh_token === undefined ||
      candidate.refresh_token === null ||
      typeof candidate.refresh_token === 'string') &&
    (candidate.expires_in === undefined ||
      candidate.expires_in === null ||
      typeof candidate.expires_in === 'number')
  )
}

export function loadAuthSession(
  storage: Storage | null = getBrowserSessionStorage(),
): AuthSession | null {
  if (!storage) {
    return null
  }

  try {
    const rawSession = storage.getItem(AUTH_SESSION_KEY)
    if (!rawSession) {
      return null
    }

    const parsedSession: unknown = JSON.parse(rawSession)

    return isStoredAuthSession(parsedSession) ? parsedSession : null
  } catch {
    return null
  }
}

export function saveAuthSession(
  session: AuthSession,
  storage: Storage | null = getBrowserSessionStorage(),
): void {
  if (!storage) {
    return
  }

  const minimalSession: StoredAuthSession = {
    access_token: session.access_token,
    token_type: session.token_type,
    user: session.user,
    refresh_token: session.refresh_token ?? null,
    expires_in: session.expires_in ?? null,
  }

  try {
    storage.setItem(AUTH_SESSION_KEY, JSON.stringify(minimalSession))
  } catch {
    // Session storage can be unavailable in private browsing or locked-down demos.
  }
}

export function clearAuthSession(
  storage: Storage | null = getBrowserSessionStorage(),
): void {
  if (!storage) {
    return
  }

  try {
    storage.removeItem(AUTH_SESSION_KEY)
  } catch {
    // Logout should remain best-effort even when storage is unavailable.
  }
}
