import { useState, type ChangeEvent, type DragEvent } from 'react'
import { FileText, Upload } from 'lucide-react'
import { Alert, Button, Card, Modal, StatusBadge } from './ui'
import { MAX_UPLOAD_MB } from '../constants'
import { formatBytes, formatDate } from '../utils/format'
import { validateFile } from '../utils/validation'
import type { DocumentItem } from '../types/document'

// ==================== DOCUMENT CARD ====================
export function DocumentCard({ doc }: { doc: DocumentItem }) {
  return (
    <Card className="flex flex-col gap-3 transition hover:border-indigo-500/50">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-300">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium" title={doc.name}>
            {doc.name}
          </p>
          <p className="text-xs text-slate-400">
            {formatBytes(doc.sizeBytes)} · {doc.pages ? `${doc.pages} pages` : 'pages unknown'}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <StatusBadge status={doc.status} />
        <span className="text-xs text-slate-500">{formatDate(doc.uploadedAt)}</span>
      </div>
    </Card>
  )
}

// ==================== UPLOAD MODAL ====================
export function UploadModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const pick = (f: File | undefined) => {
    if (!f) return
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

  return (
    <Modal title="Upload document" onClose={onClose}>
      <div className="space-y-4">
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
            dragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-500'
          }`}
        >
          <Upload className="h-8 w-8 text-slate-400" />
          <span className="text-sm">PDF yahan drag karo ya click karke select karo</span>
          <span className="text-xs text-slate-500">Max {MAX_UPLOAD_MB} MB, sirf PDF</span>
          <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={onInput} />
        </label>

        {error && <Alert variant="error">{error}</Alert>}

        {file && !submitted && (
          <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm">
            <FileText className="h-4 w-4 text-indigo-300" />
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            <span className="text-xs text-slate-400">{formatBytes(file.size)}</span>
          </div>
        )}

        {submitted && (
          <Alert variant="success">
            File select ho gayi. Asal upload Day 7 par backend se connect hoga.
          </Alert>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {submitted ? 'Close' : 'Cancel'}
          </Button>
          {!submitted && (
            <Button disabled={!file} onClick={() => setSubmitted(true)}>
              Upload
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}