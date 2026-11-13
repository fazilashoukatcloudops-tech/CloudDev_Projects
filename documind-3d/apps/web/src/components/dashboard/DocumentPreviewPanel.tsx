import { Alert, Spinner } from '../ui'
import { useDocumentPreview } from '../../hooks/useDocumentPreview'

export default function DocumentPreviewPanel({ id }: { id: string }) {
  const state = useDocumentPreview(id)

  if (state.status === 'loading') {
    return <div className="flex items-center gap-2 text-sm text-slate-400"><Spinner size="sm" /> Preview load ho raha hai...</div>
  }
  if (state.status === 'error') return <Alert variant="error">{state.message}</Alert>

  const { preview } = state
  return (
    <section aria-label="Document preview" className="space-y-2">
      <p className="text-xs text-slate-400">
        {preview.pages} pages ? {preview.chunkCount} chunks ? {preview.textChars.toLocaleString()} characters
      </p>
      <p className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
        {preview.previewText}
      </p>
    </section>
  )
}
