import { Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute } from './components/auth'
import { LandingPage } from './pages/LandingPage'
import { LoginPage, RegisterPage } from './pages/auth'
import { DashboardPage, NotFoundPage } from './pages/dashboard'
import ExplorerPage from './pages/ExplorerPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/explorer" element={<ExplorerPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
