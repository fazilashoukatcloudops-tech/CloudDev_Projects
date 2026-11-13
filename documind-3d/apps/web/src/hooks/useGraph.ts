import { useCallback, useEffect, useState } from 'react'
import { getGraph, type GraphData } from '../services/documentsApi'

type Result = { ok: true; graph: GraphData } | { ok: false; message: string }
export type GraphState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'success'; graph: GraphData }

export function useGraph() {
  const [result, setResult] = useState<Result | null>(null)
  const [token, setToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    getGraph()
      .then((graph) => { if (!cancelled) setResult({ ok: true, graph }) })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Unknown error'
        setResult((prev) => (prev?.ok ? prev : { ok: false, message }))
      })
    return () => { cancelled = true }
  }, [token])

  const active = result?.ok === true && result.graph.nodes.some((n) => n.status === 'queued' || n.status === 'processing')

  useEffect(() => {
    if (!active) return
    const tick = () => { if (!document.hidden) setToken((n) => n + 1) }
    const timer = setInterval(tick, 3000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [active])

  const retry = useCallback(() => {
    setResult(null)
    setToken((n) => n + 1)
  }, [])

  const state: GraphState = !result ? { status: 'loading' } : result.ok ? { status: 'success', graph: result.graph } : { status: 'error', message: result.message }
  return { state, retry }
}
