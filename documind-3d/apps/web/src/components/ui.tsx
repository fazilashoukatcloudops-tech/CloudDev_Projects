import {
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import { Box, X } from 'lucide-react'
import { getHealth, type HealthResponse } from '../services/api'
import type { DocumentStatus } from '../types/document'

// ============ buttonClasses (helper) ============
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-500 text-white hover:bg-indigo-400',
  secondary: 'border border-slate-600 bg-slate-900/60 text-slate-100 hover:bg-slate-800',
  ghost: 'text-slate-300 hover:bg-slate-800 hover:text-white',
  danger: 'bg-red-500 text-white hover:bg-red-400',
}

export function buttonClasses(variant: ButtonVariant = 'primary', extra = '') {
  return `${buttonBase} ${buttonVariants[variant]} ${extra}`.trim()
}

// ============ Spinner ============
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dims = size === 'sm' ? 'h-4 w-4' : 'h-8 w-8'
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block ${dims} animate-spin rounded-full border-2 border-current border-t-transparent`}
    />
  )
}

// ============ Button ============
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  loading?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={buttonClasses(variant, className)}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}

// ============ Card ============
export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/60 p-4 ${className}`}
      {...rest}
    />
  )
}

// ============ Input ============
type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function Input({ label, error, className = '', ...rest }: InputProps) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-200">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-lg border bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
          error ? 'border-red-500' : 'border-slate-700'
        } ${className}`}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

// ============ Alert ============
type AlertProps = { variant: 'success' | 'error' | 'info'; children: ReactNode }

const alertStyles = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  error: 'border-red-500/40 bg-red-500/10 text-red-200',
  info: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
}

export function Alert({ variant, children }: AlertProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-4 py-3 text-sm ${alertStyles[variant]}`}
    >
      {children}
    </div>
  )
}

// ============ StatusBadge ============
const statusConfig: Record<DocumentStatus, { label: string; classes: string }> = {
  queued: { label: 'Queued', classes: 'bg-slate-500/15 text-slate-300' },
  processing: { label: 'Processing', classes: 'bg-amber-500/15 text-amber-300' },
  ready: { label: 'Ready', classes: 'bg-emerald-500/15 text-emerald-300' },
  failed: { label: 'Failed', classes: 'bg-red-500/15 text-red-300' },
}

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const { label, classes } = statusConfig[status]
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>{label}</span>
  )
}

// ============ EmptyState ============
type EmptyStateProps = {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-700 px-6 py-14 text-center">
      <div className="text-slate-500">{icon}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-slate-400">{description}</p>
      {action}
    </div>
  )
}

// ============ Modal ============
type ModalProps = { title: string; onClose: () => void; children: ReactNode }

export function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ============ Logo ============
export function Logo() {
  return (
    <Link to="/" className="inline-flex items-center gap-2 font-semibold text-white">
      <Box className="h-6 w-6 text-indigo-400" />
      <span>DocuMind 3D</span>
    </Link>
  )
}

// ============ ApiStatus ============
type ApiState =
  | { kind: 'loading' }
  | { kind: 'ok'; data: HealthResponse }
  | { kind: 'error'; message: string }

export function ApiStatus() {
  const [state, setState] = useState<ApiState>({ kind: 'loading' })

  useEffect(() => {
    getHealth()
      .then((data) => setState({ kind: 'ok', data }))
      .catch((err: Error) => setState({ kind: 'error', message: err.message }))
  }, [])

  const dot =
    state.kind === 'ok' ? 'bg-emerald-400' : state.kind === 'error' ? 'bg-red-400' : 'bg-amber-400'

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-xs backdrop-blur">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {state.kind === 'loading' && <span>Checking API...</span>}
      {state.kind === 'ok' && (
        <span className="text-emerald-300">
          API {state.data.status} · {state.data.service}
        </span>
      )}
      {state.kind === 'error' && <span className="text-red-300">API unreachable: {state.message}</span>}
    </div>
  )
}