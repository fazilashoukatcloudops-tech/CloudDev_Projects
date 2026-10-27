const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      ...init,
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Server se connection nahi ho saka')
  }

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    const e = body?.error
    throw new ApiError(
      res.status,
      e?.code ?? 'UNKNOWN',
      e?.message ?? `Request failed (${res.status})`,
      e?.details,
    )
  }
  return body as T
}

export type HealthResponse = {
  status: string
  service: string
  timestamp?: string
}

export type AuthUser = { id: string; name: string; email: string }
export type AuthResponse = { user: AuthUser }

export const getHealth = () => request<HealthResponse>('/health')

export const login = (input: { email: string; password: string }) =>
  request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) })

export const register = (input: { name: string; email: string; password: string }) =>
  request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) })