import { useState } from 'react'
import { FileText, Plus, Search } from 'lucide-react'
import { DashboardLayout } from '../components/layout'
import {
  DocumentCard,
  DocumentDetailsModal,
  DocumentFilters,
  DocumentRow,
  Pagination,
  UploadModal,
  type StatusFilter,
  type ViewMode,
} from '../components/dashboard'
import { Alert, Button, Card, EmptyState } from '../components/ui'
import { useToast } from '../components/toast'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useDocuments } from '../hooks/useDocuments'
import { deleteDocument, uploadDocument } from '../services/documentsApi'
import type { DocumentSort } from '../types/api'
import type { DocumentItem } from '../types/document'
import { formatBytes } from '../utils/format'

const PAGE_SIZE = 6

export function DashboardPage() {
  // Test: /dashboard?state=empty  ya  /dashboard?state=error
      const { notify } = useToast()

  const [searchInput, setSearchInput] = useState('')
  const q = useDebouncedValue(searchInput.trim(), 300)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<DocumentSort>('newest')
  const [view, setView] = useState<ViewMode>('grid')
  const [page, setPage] = useState(1)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { state, reload, retry } = useDocuments(
    {
      page,
      pageSize: PAGE_SIZE,
      status: status === 'all' ? undefined : status,
      q: q || undefined,
      sort,
    },
    
  )

  const filtersActive = q !== '' || status !== 'all'
  const selected =
    state.status === 'success' ? (state.list.data.find((d) => d.id === selectedId) ?? null) : null

  const handleUpload = async (file: File, onProgress: (percent: number) => void) => {
    await uploadDocument(file, onProgress)
    setSearchInput('')
    setStatus('all')
    setSort('newest')
    setPage(1)
    reload()
    notify(`${file.name} upload ho gayi.`, 'success')
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id)
      setSelectedId(null)
      if (state.status === 'success' && state.list.data.length === 1 && page > 1) {
        setPage(page - 1)
      }
      reload()
      notify('Document delete ho gaya.', 'success')
    } catch {
      notify('Delete nahi ho saka. Dobara try karo.', 'error')
    }
  }

  const clearFilters = () => {
    setSearchInput('')
    setStatus('all')
    setPage(1)
  }

  const uploadButton = (
    <Button onClick={() => setUploadOpen(true)}>
      <Plus className="h-4 w-4" />
      Upload
    </Button>
  )

  const renderItem = (doc: DocumentItem) =>
    view === 'grid' ? (
      <DocumentCard key={doc.id} doc={doc} onSelect={(d) => setSelectedId(d.id)} />
    ) : (
      <DocumentRow key={doc.id} doc={doc} onSelect={(d) => setSelectedId(d.id)} />
    )

  return (
    <DashboardLayout title="My Documents" actions={uploadButton}>
      <div className="space-y-6">
        {state.status === 'success' && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              { label: 'Total', value: state.summary.total },
              { label: 'Ready', value: state.summary.byStatus.ready },
              {
                label: 'In progress',
                value: state.summary.byStatus.queued + state.summary.byStatus.processing,
              },
              { label: 'Failed', value: state.summary.byStatus.failed },
              { label: 'Storage', value: formatBytes(state.summary.storageBytes) },
            ].map((s) => (
              <Card key={s.label}>
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="mt-1 text-2xl font-bold">{s.value}</p>
              </Card>
            ))}
          </div>
        )}

        <DocumentFilters
          search={searchInput}
          onSearch={(v) => {
            setSearchInput(v)
            setPage(1)
          }}
          status={status}
          onStatus={(v) => {
            setStatus(v)
            setPage(1)
          }}
          sort={sort}
          onSort={(v) => {
            setSort(v)
            setPage(1)
          }}
          view={view}
          onView={setView}
        />

        {state.status === 'loading' && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
            {Array.from({ length: PAGE_SIZE }, (_, i) => (
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
          <div className={`space-y-6 transition-opacity ${state.stale ? 'opacity-60' : ''}`}>
            {state.summary.total === 0 ? (
              <EmptyState
                icon={<FileText className="h-10 w-10" />}
                title="Abhi koi document nahi"
                description="Apna pehla PDF upload karo, phir AI se uske baare mein sawal poochho."
                action={uploadButton}
              />
            ) : state.list.data.length === 0 ? (
              <EmptyState
                icon={<Search className="h-10 w-10" />}
                title="Koi match nahi mila"
                description={
                  filtersActive
                    ? 'In filters se koi document match nahi karta.'
                    : 'Is page par koi document nahi.'
                }
                action={
                  filtersActive ? (
                    <Button variant="secondary" onClick={clearFilters}>
                      Filters clear karo
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <div
                  className={
                    view === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-2'
                  }
                >
                  {state.list.data.map(renderItem)}
                </div>
                <Pagination meta={state.list.meta} onPage={setPage} />
              </>
            )}
          </div>
        )}
      </div>

      {uploadOpen && (
        <UploadModal onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
      )}
      {selected && (
        <DocumentDetailsModal
          doc={selected}
          onClose={() => setSelectedId(null)}
          onDelete={handleDelete}
        />
      )}
    </DashboardLayout>
  )
}

// ==================== NOT FOUND PAGE ====================
export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
      <h1 className="text-6xl font-bold text-indigo-400">404</h1>
      <p className="text-slate-400">Yeh page maujood nahi hai.</p>
      <a
        href="/"
        className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
      >
        Home par wapas jao
      </a>
    </main>
  )
}
