import { buildApiUrl, getBackendUrl } from '../config'

export type HealthResponse = {
  status: 'ok'
  service: string
  version: string
  timestamp: string
}

export async function fetchHealth(
  fetcher: typeof fetch = fetch,
  backendUrl = getBackendUrl(),
): Promise<HealthResponse> {
  const response = await fetcher(buildApiUrl('/health', backendUrl), {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`)
  }

  return response.json() as Promise<HealthResponse>
}
