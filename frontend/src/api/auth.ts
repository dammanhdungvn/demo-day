import { buildApiUrl, getBackendUrl } from '../config'

export type UserRole = 'admin' | 'teacher' | 'student'

export type UserProfile = {
  id: string
  email: string
  name: string
  role: UserRole
  organization_id?: string | null
}

export type AuthUser = UserProfile

export type PublicDemoAccount = UserProfile & {
  label: string
}

export type LoginCredentials = {
  email: string
  password: string
}

export type DemoLoginPayload = {
  account_id: string
}

export type AuthSession = {
  access_token: string
  token_type: 'bearer'
  user: UserProfile
  refresh_token?: string | null
  expires_in?: number | null
}

export type LoginResponse = AuthSession

export type InviteStatus = 'pending' | 'accepted' | 'revoked'

export type InviteCreatePayload = {
  email: string
  role: UserRole
}

export type InviteAcceptPayload = {
  invite_code: string
  email: string
  name: string
  password: string
}

export type OrganizationInvite = {
  id: string
  email: string
  role: UserRole
  status: InviteStatus
  organization_id: string
  invited_by: string
  invite_code: string
  created_at: string
  expires_at?: string | null
  accepted_at: string | null
}

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

export async function demoLogin(
  payload: DemoLoginPayload,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<AuthSession> {
  const response = await fetcher(buildApiUrl('/auth/demo-login', backendUrl), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return readJson<AuthSession>(response, 'Demo login')
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

export async function refreshSession(
  refreshToken: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<AuthSession> {
  const response = await fetcher(buildApiUrl('/auth/refresh', backendUrl), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  return readJson<AuthSession>(response, 'Session refresh')
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

export async function createInvite(
  payload: InviteCreatePayload,
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<OrganizationInvite> {
  const response = await fetcher(buildApiUrl('/auth/invites', backendUrl), {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return readJson<OrganizationInvite>(response, 'Create invite')
}

export async function fetchInvites(
  token: string,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<OrganizationInvite[]> {
  const response = await fetcher(buildApiUrl('/auth/invites', backendUrl), {
    headers: authHeaders(token),
  })

  return readJson<OrganizationInvite[]>(response, 'Organization invites')
}

export async function acceptInvite(
  payload: InviteAcceptPayload,
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<AuthSession> {
  const response = await fetcher(buildApiUrl('/auth/invites/accept', backendUrl), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return readJson<AuthSession>(response, 'Accept invite')
}

export function getRoleRoute(role: UserRole): string {
  return `/${role}`
}
