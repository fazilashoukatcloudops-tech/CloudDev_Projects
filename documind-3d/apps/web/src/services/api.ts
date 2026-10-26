export type HealthResponse = {
  status: string
  service: string
  timestamp?: string
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/v1/health')
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  return res.json()
}