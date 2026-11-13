import { useEffect, useState } from 'react'
import { getDocumentPreview, type DocumentPreview } from '../services/documentsApi'

type Result = { id: string; preview?: DocumentPreview; error?: string }

export function useDocumentPreview(id: string) {
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    let cancelled = false
    getDocumentPreview(id)
      .then((preview) => !cancelled && setResult({ id, preview }))
      .catch((err: unknown) => {
        if (!cancelled) setResult({ id, error: err instanceof Error ? err.message : 'Preview load nahi hua' })
      })
    return () => { cancelled = true }
  }, [id])

  if (!result || result.id !== id) return { status: 'loading' as const }
  if (result.error) return { status: 'error' as const, message: result.error }
  return { status: 'success' as const, preview: result.preview! }
}
