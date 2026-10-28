import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ApiError,
  getMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  setUnauthorizedHandler,
  type AuthUser,
} from '../services/api'

export type AuthContextValue = {
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'error'
  user: AuthUser | null
  errorMessage: string | null
  login: (input: { email: string; password: string }) => Promise<void>
  register: (input: { name: string; email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  retry: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

type State =
  | { status: 'loading' }
  | { status: 'authenticated'; user: AuthUser }
  | { status: 'unauthenticated' }
  | { status: 'error'; message: string }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    getMe()
      .then(({ user }) => {
        if (!cancelled) setState({ status: 'authenticated', user })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          setState({ status: 'unauthenticated' })
        } else {
          const message = err instanceof Error ? err.message : 'Unknown error'
          setState({ status: 'error', message })
        }
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  useEffect(() => {
    setUnauthorizedHandler(() => setState({ status: 'unauthenticated' }))
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = useCallback<AuthContextValue['login']>(async (input) => {
    const { user } = await apiLogin(input)
    setState({ status: 'authenticated', user })
  }, [])

  const register = useCallback<AuthContextValue['register']>(async (input) => {
    const { user } = await apiRegister(input)
    setState({ status: 'authenticated', user })
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setState({ status: 'unauthenticated' })
  }, [])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      user: state.status === 'authenticated' ? state.user : null,
      errorMessage: state.status === 'error' ? state.message : null,
      login,
      register,
      logout,
      retry,
    }),
    [state, login, register, logout, retry],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
