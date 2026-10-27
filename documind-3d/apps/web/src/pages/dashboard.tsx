import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FileText, Plus, Search } from 'lucide-react'
import { DashboardLayout } from '../components/layout'
import { DocumentCard, UploadModal } from '../components/dashboard'
import { Alert, Button, Card, EmptyState, buttonClasses } from '../components/ui'
import { useMockDocuments } from '../hooks/useMockDocuments'
import type { DocumentItem } from '../types/document'

// ==================== DASHBOARD PAGE ====================
export function DashboardPage() {
  // Test ke liye: /dashboard?state=empty  ya  /dashboard?state=error
  const [params] = useSearchParams()
  const { state, retry } = useMockDocuments(params.get('state'))
  const [query, setQuery] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)

  const documents: DocumentItem[] = state.status === 'success' ? state.documents : []
  const filtered = documents.filter((d) => d.name.toLowerCase().includes(query.trim().toLowerCase()))

  const stats = [
    { label: 'Total', value: documents.length },
    { label: 'Ready', value: documents.filter((d) => d.status === 'ready').length },
    {
      label: 'In progress',
      value: documents.filter((d) => d.status === 'queued' || d.status === 'processing').length,
    },
    { label: 'Failed', value: documents.filter((d) => d.status === 'failed').length },
  ]

  const uploadButton = (
    <Button onClick={() => setUploadOpen(true)}>
      <Plus className="h-4 w-4" />
      Upload
    </Button>
  )

  return (
    <DashboardLayout title="My Documents" actions={uploadButton}>
      {state.status === 'loading' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-800/60" />
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div className="max-w-xl space-y-3">
          <Alert variant="error">{state.message}</Alert>
          <Button variant="secondary" onClick={retry}>
            Dobara try karo
          </Button>
        </div>
      )}

      {state.status === 'success' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label}>
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="mt-1 text-2xl font-bold">{s.value}</p>
              </Card>
            ))}
          </div>

          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              aria-label="Search documents"
              placeholder="Documents search karo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {documents.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-10 w-10" />}
              title="Abhi koi document nahi"
              description="Apna pehla PDF upload karo, phir AI se uske baare mein sawal poochho."
              action={uploadButton}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="h-10 w-10" />}
              title="Koi match nahi mila"
              description={`"${query}" se match karne wala koi document nahi.`}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </div>
      )}

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
    </DashboardLayout>
  )
}

// ==================== NOT FOUND PAGE ====================
export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
      <h1 className="text-6xl font-bold text-indigo-400">404</h1>
      <p className="text-slate-400">Yeh page maujood nahi hai.</p>
      <Link to="/" className={buttonClasses('primary')}>
        Home par wapas jao
      </Link>
    </main>
  )
}