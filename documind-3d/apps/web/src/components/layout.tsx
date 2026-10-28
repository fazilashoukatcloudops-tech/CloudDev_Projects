import { useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, Box, FileText, LogOut, Settings } from 'lucide-react'
import { Logo, buttonClasses } from './ui'

// ==================== NAVBAR ====================
const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed inset-x-0 top-0 z-40 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />

        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-slate-300 hover:text-white">
              {l.label}
            </a>
          ))}
          <Link to="/login" className={buttonClasses('ghost')}>
            Login
          </Link>
          <Link to="/register" className={buttonClasses('primary')}>
            Get started
          </Link>
        </div>

        <button
          className="rounded-md p-2 text-slate-300 hover:bg-slate-800 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-2 border-t border-slate-800 px-4 py-3 md:hidden">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              {l.label}
            </a>
          ))}
          <Link to="/login" className={buttonClasses('secondary')}>
            Login
          </Link>
          <Link to="/register" className={buttonClasses('primary')}>
            Get started
          </Link>
        </div>
      )}
    </nav>
  )
}

// ==================== FOOTER ====================
export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-slate-400 sm:flex-row sm:px-6">
        <Logo />
        <p>© {new Date().getFullYear()} DocuMind 3D. Portfolio project.</p>
      </div>
    </footer>
  )
}

// ==================== SIDEBAR ====================
const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
    isActive ? 'bg-indigo-500/15 text-indigo-200' : 'text-slate-300 hover:bg-slate-800'
  }`

function Disabled({ icon, label, hint }: { icon: ReactNode; label: string; hint: string }) {
  return (
    <div className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500">
      {icon}
      <span className="flex-1">{label}</span>
      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px]">{hint}</span>
    </div>
  )
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} aria-hidden />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-900 p-4 transition-transform lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Link to="/" className="mb-6 inline-flex items-center gap-2 font-semibold text-white">
          <Box className="h-6 w-6 text-indigo-400" />
          DocuMind 3D
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          <NavLink to="/dashboard" end onClick={onClose} className={navClass}>
            <FileText className="h-4 w-4" />
            Documents
          </NavLink>
          <NavLink to="/explorer" onClick={onClose} className={navClass}>
            <Box className="h-4 w-4" />
            3D Explorer
          </NavLink>
          <Disabled icon={<Settings className="h-4 w-4" />} label="Settings" hint="Soon" />
        </nav>

        <Link
          to="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Link>
      </aside>
    </>
  )
}

// ==================== DASHBOARD LAYOUT ====================
export function DashboardLayout({
  title,
  actions,
  children,
}: {
  title: string
  actions?: ReactNode
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 lg:flex">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur sm:px-6">
          <button
            className="rounded-md p-2 text-slate-300 hover:bg-slate-800 lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}

// ==================== AUTH LAYOUT ====================
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-950 via-indigo-950/60 to-slate-950 px-4 py-10 text-slate-100">
      <Logo />
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur sm:p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-slate-400">{subtitle}</p>
        {children}
      </div>
      <p className="text-sm text-slate-400">{footer}</p>
    </main>
  )
}
