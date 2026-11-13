import { Component, type ErrorInfo, type ReactNode } from 'react'

type State = { failed: boolean }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI crash', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-slate-100">
        <h1 className="text-2xl font-bold">Kuch galat ho gaya</h1>
        <p className="text-slate-400">Page dobara load karo. Masla rahe to thori der baad try karo.</p>
        <button
          type="button"
          onClick={() => window.location.assign('/')}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium hover:bg-indigo-400"
        >
          Home par jao
        </button>
      </main>
    )
  }
}
