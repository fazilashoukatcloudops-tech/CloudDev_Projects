import { useEffect, useState } from 'react'
import { getHealth, type HealthResponse } from '../../services/api'

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; data: HealthResponse }
  | { kind: 'error'; message: string }

export default function ApiStatus() {
  const [state, setState] = useState<State>({ kind: 'loading' })

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