import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Box } from 'lucide-react'
import { DashboardLayout } from '../components/layout'
import {
  DocumentDetailsPanel,
  ExplorerDocumentList,
  GalaxyLegend,
} from '../components/explorer'
import SceneFallback from '../components/three/SceneFallback'
import { Alert, Button, EmptyState, buttonClasses } from '../components/ui'
import { useDocuments } from '../hooks/useDocuments'
import { isWebGLAvailable } from '../hooks/useWebGLSupport'
import type { DocumentListQuery } from '../types/api'

const DocumentGalaxy = lazy(() => import('../components/three/DocumentGalaxy'))

// 'oldest' sort: purane documents ki positions stable rehti hain.
// pageSize 50 = API ka max (docs/api-contract.md).
const EXPLORER_QUERY: DocumentListQuery = { page: 1, pageSize: 50, sort: 'oldest' }

export default function ExplorerPage() {
  // Test: /explorer?state=empty | ?state=error  |  /explorer?doc=<id> (pehle se select)
  const [params] = useSearchParams()
  const scenario = params.get('state')

  const [selectedId, setSelectedId] = useState<string | null>(params.get('doc'))
  const [webgl] = useState(isWebGLAvailable)
  const { state, retry } = useDocuments(EXPLORER_QUERY, scenario)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const documents = state.status === 'success' ? state.list.data : []
  const selected = documents.find((d) => d.id === selectedId) ?? null

  return (
    <DashboardLayout
      title="3D Explorer"
      actions={
        <Link to="/dashboard" className={buttonClasses('secondary')}>
          List view
        </Link>
      }
    >
      {state.status === 'loading' && (
        <div className="h-[60vh] animate-pulse rounded-xl bg-slate-800/60" aria-busy="true" />
      )}

      {state.status === 'error' && (
        <div className="max-w-xl space-y-3">
          <Alert variant="error">{state.message}</Alert>
          <Button variant="secondary" onClick={retry}>
            Dobara try karo
          </Button>
        </div>
      )}

      {state.status === 'success' && state.list.meta.total === 0 && (
        <EmptyState
          icon={<Box className="h-10 w-10" />}
          title="3D workspace khali hai"
          description="Pehle dashboard se koi PDF upload karo, phir woh yahan node ban kar nazar aayega."
          action={
            <Link to="/dashboard" className={buttonClasses('primary')}>
              Dashboard par jao
            </Link>
          }
        />
      )}

      {state.status === 'success' && state.list.meta.total > 0 && (
        <div className="space-y-4">
          {state.list.meta.hasNext && (
            <Alert variant="info">
              Abhi pehle {state.list.meta.pageSize} documents dikh rahe hain (total{' '}
              {state.list.meta.total}).
            </Alert>
          )}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="relative h-[60vh] min-h-[420px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
              {webgl ? (
                <Suspense fallback={<SceneFallback variant="loading" />}>
                  <DocumentGalaxy
                    documents={documents}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                </Suspense>
              ) : (
                <SceneFallback variant="unsupported" />
              )}
              <GalaxyLegend />
              <p className="pointer-events-none absolute bottom-3 left-3 z-10 text-xs text-slate-500">
                Drag: rotate · Scroll/pinch: zoom · Click: select · Esc: deselect
              </p>
            </div>

            <aside className="space-y-4">
              {selected && (
                <DocumentDetailsPanel doc={selected} onClose={() => setSelectedId(null)} />
              )}
              <ExplorerDocumentList
                documents={documents}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </aside>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
