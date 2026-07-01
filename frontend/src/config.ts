export function getBackendUrl(value = __TEACHFLOW_URL_BACKEND__): string {
  const backendUrl = value?.trim()

  if (!backendUrl) {
    throw new Error('URL_BACKEND is not configured')
  }

  return backendUrl.replace(/\/+$/, '')
}

export function buildApiUrl(path: string, backendUrl = getBackendUrl()): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${backendUrl}${normalizedPath}`
}

export type RealAccountShortcutRole = 'admin' | 'teacher' | 'student'

export type RealAccountShortcut = {
  role: RealAccountShortcutRole
  email: string
  password?: string
}

const REAL_ACCOUNT_ROLES = new Set<RealAccountShortcutRole>([
  'admin',
  'teacher',
  'student',
])

export function getRealAccountShortcuts(
  value = __TEACHFLOW_REAL_ACCOUNT_SHORTCUTS__,
): RealAccountShortcut[] {
  return (value ?? []).flatMap((account) => {
    const role = account.role?.trim() as RealAccountShortcutRole | undefined
    const email = account.email?.trim() ?? ''
    const password = account.password?.trim() ?? ''

    if (!role || !REAL_ACCOUNT_ROLES.has(role) || !email) {
      return []
    }

    return [
      {
        role,
        email,
        ...(password ? { password } : {}),
      },
    ]
  })
}
