import { createContext } from 'react'
import type { AuthUser } from '../services/api'

export type AuthContextValue = {
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'error'
  user: AuthUser | null
  errorMessage: string | null
  sessionExpired: boolean
  login: (input: { email: string; password: string }) => Promise<void>
  register: (input: { name: string; email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  retry: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
