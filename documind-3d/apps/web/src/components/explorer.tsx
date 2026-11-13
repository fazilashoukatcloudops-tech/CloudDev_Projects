import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { Alert, Card, StatusBadge, buttonClasses } from './ui'
import { STATUS_COLORS } from './three/galaxyLayout'
import { formatBytes, formatDate } from '../utils/format'
import type { DocumentItem, DocumentStatus } from '../types/document'

// ==================== LEGEND ====================
const legendItems: { status: DocumentStatus; label: string }[] = [
  { status: 'ready', label: 'Ready' },
  { status: 'processing', label: 'Processing' },
  { status: 'queued', label: 'Queued' },
  { status: 'failed', label: 'Failed (diamond)' },
]

export function GalaxyLegend() {
  return (
    <ul className="pointer-events-none absolute left-3 top-3 z-10 space-y-1 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300 backdrop-blur">
      {legendItems.map((i) => (
        <li key={i.status} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: STATUS_COLORS[i.status] }}
          />
          {i.label}
        </li>
      ))}
      <li className="pt-1 text-slate-500">Node size = file size</li>
      <li className="text-slate-500">Line = milta-julta content</li>
    </ul>
  )
}

// ==================== EXPLORER DOCUMENT LIST ====================
type ListProps = {
  documents: DocumentItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

// 3D ka accessible alternative: keyboard aur screen reader se bhi documents select ho sakte hain.
export function ExplorerDocumentList({ documents, selectedId, onSelect }: ListProps) {
  const ordered = [...documents].reverse() // newest upar

  return (
    <Card className="p-2">
      <h2 className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">
        Documents ({documents.length})
      </h2>
      <ul className="max-h-80 space-y-1 overflow-y-auto">
        {ordered.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              aria-pressed={d.id === selectedId}
              onClick={() => onSelect(d.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                d.id === selectedId ? 'bg-indigo-500/15 text-indigo-100' : 'hover:bg-slate-800'
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[d.status] }}
              />
              <span className="min-w-0 flex-1 truncate" title={d.name}>
                {d.name}
              </span>
              <span className="text-xs text-slate-500">{formatBytes(d.sizeBytes)}</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// ==================== DETAILS PANEL ====================
export type RelatedDoc = { doc: DocumentItem; weight: number }
type DetailsProps = { doc: DocumentItem; related: RelatedDoc[]; onSelect: (id: string) => void; onClose: () => void }

export function DocumentDetailsPanel({ doc, related, onSelect, onClose }: DetailsProps) {
  const ready = doc.status === 'ready'
  const rows: [string, string | number][] = [
    ['Size', formatBytes(doc.sizeBytes)],
    ['Pages', doc.pages ?? 'Unknown'],
    ['Uploaded', formatDate(doc.uploadedAt)],
    ['Updated', formatDate(doc.updatedAt)],
  ]

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h2 className="break-all font-semibold">{doc.name}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <StatusBadge status={doc.status} />

      <dl className="divide-y divide-slate-800 rounded-lg border border-slate-800 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-3 py-2">
            <dt className="text-slate-400">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {doc.status === 'failed' && doc.errorMessage && (
        <Alert variant="error">{doc.errorMessage}</Alert>
      )}
      {(doc.status === 'queued' || doc.status === 'processing') && (
        <Alert variant="info">Processing jaari hai. Status khud update hota rahega.</Alert>
      )}


      {doc.status === 'ready' && (
        <section aria-label="Related documents" className="space-y-1">
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">Related documents</h3>
          {related.length === 0 ? (
            <p className="text-xs text-slate-500">Koi milta-julta document nahi mila.</p>
          ) : (
            <ul className="space-y-1">
              {related.map(({ doc: r, weight }) => (
                <li key={r.id}>
                  <button type="button" onClick={() => onSelect(r.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-800">
                    <span className="min-w-0 truncate">{r.name}</span>
                    <span className="text-xs text-slate-500">{Math.round(weight * 100)}%</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <Link to={`/documents/${doc.id}/chat`} aria-disabled={!ready} className={buttonClasses('secondary', !ready ? 'pointer-events-none opacity-50' : '')}>Ask AI</Link>
        <Link to="/dashboard" className={buttonClasses('ghost')}>
          Dashboard
        </Link>
      </div>
    </Card>
  )
}
