import { useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutGrid,
  List,
  Search,
  Upload,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Alert, Button, Modal, StatusBadge, buttonClasses } from './ui'
import { MAX_UPLOAD_MB } from '../constants'
import { formatBytes, formatDate } from '../utils/format'
import { validateFile } from '../utils/validation'
import type { DocumentItem, DocumentStatus } from '../types/document'
import type { DocumentSort, PaginationMeta } from '../types/api'

// ==================== DOCUMENT CARD ====================
export function DocumentCard({
  doc,
  onSelect,
}: {
  doc: DocumentItem
  onSelect: (doc: DocumentItem) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(doc)}
      className="flex w-full flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-left transition hover:border-indigo-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
    >
      <span className="flex items-start gap-3">
        <span className="rounded-lg bg-indigo-500/10 p-2 text-indigo-300">
          <FileText className="h-5 w-5" />
        </span>
        <span className="block min-w-0 flex-1">
          <span className="block truncate font-medium" title={doc.name}>
            {doc.name}
          </span>
          <span className="block text-xs text-slate-400">
            {formatBytes(doc.sizeBytes)} · {doc.pages ? `${doc.pages} pages` : 'pages unknown'}
          </span>
        </span>
      </span>
      <span className="flex items-center justify-between">
        <StatusBadge status={doc.status} />
        <span className="text-xs text-slate-500">{formatDate(doc.uploadedAt)}</span>
      </span>
    </button>
  )
}

// ==================== DOCUMENT ROW ====================
export function DocumentRow({
  doc,
  onSelect,
}: {
  doc: DocumentItem
  onSelect: (doc: DocumentItem) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(doc)}
      className="flex w-full items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-left transition hover:border-indigo-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
    >
      <FileText className="h-5 w-5 shrink-0 text-indigo-300" />
      <span className="block min-w-0 flex-1 truncate text-sm font-medium" title={doc.name}>
        {doc.name}
      </span>
      <span className="hidden w-20 text-right text-xs text-slate-400 sm:block">
        {formatBytes(doc.sizeBytes)}
      </span>
      <span className="hidden w-24 text-right text-xs text-slate-500 md:block">
        {formatDate(doc.uploadedAt)}
      </span>
      <StatusBadge status={doc.status} />
    </button>
  )
}

// ==================== FILTERS ====================
export type StatusFilter = DocumentStatus | 'all'
export type ViewMode = 'grid' | 'list'

type FiltersProps = {
  search: string
  onSearch: (value: string) => void
  status: StatusFilter
  onStatus: (value: StatusFilter) => void
  sort: DocumentSort
  onSort: (value: DocumentSort) => void
  view: ViewMode
  onView: (value: ViewMode) => void
}

const selectClass =
  'rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400'

export function DocumentFilters(p: FiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1 lg:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          aria-label="Search documents"
          placeholder="Documents search karo..."
          value={p.search}
          onChange={(e) => p.onSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Filter by status"
          className={selectClass}
          value={p.status}
          onChange={(e) => p.onStatus(e.target.value as StatusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="ready">Ready</option>
          <option value="processing">Processing</option>
          <option value="queued">Queued</option>
          <option value="failed">Failed</option>
        </select>

        <select
          aria-label="Sort documents"
          className={selectClass}
          value={p.sort}
          onChange={(e) => p.onSort(e.target.value as DocumentSort)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name (A-Z)</option>
          <option value="size">Largest first</option>
        </select>

        <div className="inline-flex overflow-hidden rounded-lg border border-slate-700">
          {(['grid', 'list'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-label={`${mode} view`}
              aria-pressed={p.view === mode}
              onClick={() => p.onView(mode)}
              className={`px-3 py-2 ${
                p.view === mode
                  ? 'bg-indigo-500/20 text-indigo-200'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {mode === 'grid' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ==================== PAGINATION ====================
export function Pagination({
  meta,
  onPage,
}: {
  meta: PaginationMeta
  onPage: (page: number) => void
}) {
  if (meta.totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-slate-400">
        Page {meta.page} of {meta.totalPages} · {meta.total} documents
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={!meta.hasPrev} onClick={() => onPage(meta.page - 1)}>
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <Button variant="secondary" disabled={!meta.hasNext} onClick={() => onPage(meta.page + 1)}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ==================== DETAILS MODAL ====================
export function DocumentDetailsModal({
  doc,
  onClose,
  onDelete,
}: {
  doc: DocumentItem
  onClose: () => void
  onDelete: (id: string) => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(doc.id)
    } finally {
      setDeleting(false)
    }
  }

  const rows: [string, ReactNode][] = [
    ['Name', <span className="break-all">{doc.name}</span>],
    ['Status', <StatusBadge status={doc.status} />],
    ['Size', formatBytes(doc.sizeBytes)],
    ['Pages', doc.pages ?? 'Unknown'],
    ['Uploaded', formatDate(doc.uploadedAt)],
    ['Last updated', formatDate(doc.updatedAt)],
  ]

  return (
    <Modal title="Document details" onClose={onClose}>
      <div className="space-y-4">
        <dl className="divide-y divide-slate-800 rounded-lg border border-slate-800 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 px-3 py-2">
              <dt className="text-slate-400">{label}</dt>
              <dd className="text-right">{value}</dd>
            </div>
          ))}
        </dl>

        {doc.status === 'failed' && doc.errorMessage && (
          <Alert variant="error">{doc.errorMessage}</Alert>
        )}
        {(doc.status === 'queued' || doc.status === 'processing') && (
          <Alert variant="info">Document process ho raha hai. Status khud update hota rahega.</Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled title="Day 11 par available hoga">
            Ask AI
          </Button>
          <Link to={`/explorer?doc=${doc.id}`} className={buttonClasses('secondary')}>Open in 3D</Link>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          {confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-300">Pakka delete karna hai?</span>
              <Button variant="danger" loading={deleting} onClick={confirmDelete}>
                Haan, delete
              </Button>
              <Button variant="ghost" disabled={deleting} onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setConfirming(true)}>
              Delete
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ==================== UPLOAD MODAL ====================

type Props = {
  onClose: () => void
  onUpload: (file: File, onProgress: (percent: number) => void) => Promise<void>
}

export function UploadModal({ onClose, onUpload }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)

  const uploading = progress !== null

  const pick = (f: File | undefined) => {
    if (!f || uploading) return
    const problem = validateFile(f)
    setError(problem)
    setFile(problem ? null : f)
  }

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    pick(e.target.files?.[0])
    e.target.value = ''
  }

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragging(false)
    pick(e.dataTransfer.files[0])
  }

  const startUpload = async () => {
    if (!file) return
    setError(null)
    setProgress(0)
    try {
      await onUpload(file, setProgress)
      onClose()
    } catch (err) {
      setProgress(null)
      setError(err instanceof Error ? err.message : 'Upload fail ho gaya. Dobara try karo.')
    }
  }

  return (
    <Modal title="Upload document" onClose={uploading ? () => {} : onClose}>
      <div className="space-y-4">
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
            uploading ? 'pointer-events-none opacity-50' : ''
          } ${
            dragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-500'
          }`}
        >
          <Upload className="h-8 w-8 text-slate-400" />
          <span className="text-sm">PDF yahan drag karo ya click karke select karo</span>
          <span className="text-xs text-slate-500">Max {MAX_UPLOAD_MB} MB, sirf PDF</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            disabled={uploading}
            onChange={onInput}
          />
        </label>

        {error && <Alert variant="error">{error}</Alert>}

        {file && (
          <div className="space-y-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-indigo-300" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="text-xs text-slate-400">{formatBytes(file.size)}</span>
            </div>
            {uploading && (
              <div
                role="progressbar"
                aria-valuenow={progress ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1.5 overflow-hidden rounded-full bg-slate-700"
              >
                <div
                  className="h-full bg-indigo-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" disabled={uploading} onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!file} loading={uploading} onClick={startUpload}>
            {uploading ? (progress === 100 ? 'Saving...' : `${progress}%`) : 'Upload'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
