import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Alert, Button, Spinner } from './ui'
import { useAuth } from '../hooks/useAuth'

// ==================== AUTH LOADING ====================
function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
      <Spinner />
    </div>
  )
}

// ==================== PROTECTED ROUTE ====================
export function ProtectedRoute() {
  const { status, errorMessage, retry } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <AuthLoading />

  if (status === 'error') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-6">
        <div className="max-w-md">
          <Alert variant="error">{errorMessage}</Alert>
        </div>
        <Button variant="secondary" onClick={retry}>
          Dobara try karo
        </Button>
      </main>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}

// ==================== GUEST ROUTE ====================
export function GuestRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <AuthLoading />

  if (status === 'authenticated') {
    const from = (location.state as { from?: unknown } | null)?.from
    const target = typeof from === 'string' && /^\/(?!\/)/.test(from) ? from : '/dashboard'
    return <Navigate to={target} replace />
  }

  return <Outlet />
}
