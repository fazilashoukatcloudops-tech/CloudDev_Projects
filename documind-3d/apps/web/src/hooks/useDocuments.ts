import { useCallback, useEffect, useState } from 'react'
import { getSummary, listDocuments } from '../services/documentsApi'
import type { DocumentListQuery, DocumentSummary, Paginated } from '../types/api'
import type { DocumentItem } from '../types/document'

type List = Paginated<DocumentItem>

type Outcome =
  | { ok: true; list: List; summary: DocumentSummary }
  | { ok: false; message: string }

type Result = { key: string; outcome: Outcome }

export type DocumentsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; list: List; summary: DocumentSummary; stale: boolean }

export function useDocuments(query: DocumentListQuery) {
  const { page, pageSize, status, q, sort } = query
  const key = [page, pageSize, status ?? '', q ?? '', sort].join('|')

  const [result, setResult] = useState<Result | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([listDocuments({ page, pageSize, status, q, sort }), getSummary()])
      .then(([list, summary]) => {
        if (!cancelled) setResult({ key, outcome: { ok: true, list, summary } })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          setResult({ key, outcome: { ok: false, message } })
        }
      })
    return () => {
      cancelled = true
    }
  }, [key, reloadToken, page, pageSize, status, q, sort])

  let state: DocumentsState
  if (!result) {
    state = { status: 'loading' }
  } else if (result.outcome.ok) {
    state = {
      status: 'success',
      list: result.outcome.list,
      summary: result.outcome.summary,
      stale: result.key !== key,
    }
  } else {
    state =
      result.key === key
        ? { status: 'error', message: result.outcome.message }
        : { status: 'loading' }
  }

  const hasActive =
    state.status === 'success' &&
    state.summary.byStatus.queued + state.summary.byStatus.processing > 0

  useEffect(() => {
    if (!hasActive) return
    const timer = setInterval(() => setReloadToken((n) => n + 1), 3000)
    return () => clearInterval(timer)
  }, [hasActive])

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])
  const retry = useCallback(() => {
    setResult(null)
    setReloadToken((n) => n + 1)
  }, [])

  return { state, reload, retry }
}
