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
