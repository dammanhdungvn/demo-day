import { buildApiUrl, getBackendUrl } from '../config'

export type UserRole = 'admin' | 'teacher' | 'student'

export type UserProfile = {
  id: string
  email: string
  name: string
  role: UserRole
}

export type AuthUser = UserProfile

export type PublicDemoAccount = UserProfile & {
  label: string
}

export type LoginCredentials = {
  email: string
  password: string
}

export type AuthSession = {
  access_token: string
  token_type: 'bearer'
  user: UserProfile
}

export type LoginResponse = AuthSession

export type RoleDashboard = {
  workspace: UserRole
  title: string
  current_user: UserProfile
  allowed_actions: string[]
  hidden_actions: string[]
  next_step: string
}

export type DashboardResponse = RoleDashboard

function authHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

function roleLabel(role: UserRole): string {
  return `${role.charAt(0).toUpperCase()}${role.slice(1)}`
}

async function readJson<T>(response: Response, label: string): Promise<T> {
  if (!response.ok) {
    throw new Error(`${label} failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function fetchDemoAccounts(
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<PublicDemoAccount[]> {
  const response = await fetcher(buildApiUrl('/auth/demo-accounts', backendUrl), {
    headers: {
      Accept: 'application/json',
    },
  })

  return readJson<PublicDemoAccount[]>(response, 'Demo accounts')
}

export async function login(
  credentials: LoginCredentials,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<AuthSession> {
  const response = await fetcher(buildApiUrl('/auth/login', backendUrl), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  return readJson<AuthSession>(response, 'Login')
}

export async function logout(
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<void> {
  const response = await fetcher(buildApiUrl('/auth/logout', backendUrl), {
    method: 'POST',
    headers: authHeaders(token),
  })

  await readJson<{ message: string }>(response, 'Logout')
}

export async function fetchCurrentUser(
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<UserProfile> {
  const response = await fetcher(buildApiUrl('/me', backendUrl), {
    headers: authHeaders(token),
  })

  return readJson<UserProfile>(response, 'Current user')
}

export async function fetchRoleDashboard(
  role: UserRole,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<RoleDashboard> {
  const response = await fetcher(buildApiUrl(`/${role}/dashboard`, backendUrl), {
    headers: authHeaders(token),
  })

  return readJson<RoleDashboard>(response, `${roleLabel(role)} dashboard`)
}

export function getRoleRoute(role: UserRole): string {
  return `/${role}`
}
