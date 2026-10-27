import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/layout'
import { Alert, Button, Input } from '../components/ui'
import { ApiError, login, register } from '../services/api'
import { validateLogin, validateRegister, type FieldErrors } from '../utils/validation'

// ==================== LOGIN PAGE ====================
export function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors<'email' | 'password'>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setApiError(null)
    const found = validateLogin(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await login(form)
      navigate('/dashboard')
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Unexpected error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Apne account mein login karo"
      footer={
        <>
          Account nahi hai?{' '}
          <Link to="/register" className="text-indigo-300 hover:underline">
            Register karo
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {apiError && <Alert variant="error">{apiError}</Alert>}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          error={errors.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          error={errors.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Button type="submit" loading={submitting} className="w-full">
          Login
        </Button>
        <p className="text-center text-xs text-slate-500">
          Auth Day 6 par implement hogi. Abhi UI dekhne ke liye{' '}
          <Link to="/dashboard" className="text-indigo-300 hover:underline">
            dashboard demo
          </Link>{' '}
          kholo.
        </p>
      </form>
    </AuthLayout>
  )
}

// ==================== REGISTER PAGE ====================
type RegisterField = 'name' | 'email' | 'password' | 'confirmPassword'

export function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<FieldErrors<RegisterField>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (field: RegisterField) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value })

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setApiError(null)
    const found = validateRegister(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await register({ name: form.name, email: form.email, password: form.password })
      navigate('/dashboard')
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Unexpected error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="DocuMind 3D par apna account banao"
      footer={
        <>
          Pehle se account hai?{' '}
          <Link to="/login" className="text-indigo-300 hover:underline">
            Login karo
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {apiError && <Alert variant="error">{apiError}</Alert>}
        <Input label="Naam" autoComplete="name" value={form.name} error={errors.name} onChange={set('name')} />
        <Input label="Email" type="email" autoComplete="email" value={form.email} error={errors.email} onChange={set('email')} />
        <Input label="Password" type="password" autoComplete="new-password" value={form.password} error={errors.password} onChange={set('password')} />
        <Input label="Confirm password" type="password" autoComplete="new-password" value={form.confirmPassword} error={errors.confirmPassword} onChange={set('confirmPassword')} />
        <Button type="submit" loading={submitting} className="w-full">
          Register
        </Button>
      </form>
    </AuthLayout>
  )
}