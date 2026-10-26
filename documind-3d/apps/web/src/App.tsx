import { useEffect, useState } from 'react'
import { getHealth, type HealthResponse } from './services/api'

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; data: HealthResponse }
  | { kind: 'error'; message: string }

export default function App() {
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    getHealth()
      .then((data) => setState({ kind: 'ok', data }))
      .catch((err: Error) => setState({ kind: 'error', message: err.message }))
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-4xl font-bold">DocuMind 3D</h1>
      <p className="text-slate-400">AI Document Intelligence Platform</p>

      <div className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-4 text-sm">
        {state.kind === 'loading' && <span>Checking API...</span>}
        {state.kind === 'ok' && (
          <span className="text-emerald-400">
            API status: {state.data.status} ({state.data.service})
          </span>
        )}
        {state.kind === 'error' && (
          <span className="text-red-400">API unreachable: {state.message}</span>
        )}
      </div>
    </main>
  )
}