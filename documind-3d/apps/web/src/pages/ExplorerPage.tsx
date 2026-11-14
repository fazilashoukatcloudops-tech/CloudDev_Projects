import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Box } from 'lucide-react'
import { DashboardLayout } from '../components/layout'
import {
  DocumentDetailsPanel,
  ExplorerDocumentList,
  GalaxyLegend,
  type RelatedDoc,
} from '../components/explorer'
import SceneFallback from '../components/three/SceneFallback'
import { Alert, Button, EmptyState, buttonClasses } from '../components/ui'
import { useGraph } from '../hooks/useGraph'
import { useStatusNotifications } from '../hooks/useStatusNotifications'
import { isWebGLAvailable } from '../hooks/useWebGLSupport'
import type { DocumentItem } from '../types/document'

const DocumentGalaxy = lazy(() => import('../components/three/DocumentGalaxy'))
const NO_DOCS: DocumentItem[] = []
const NO_EDGES: { source: string; target: string; weight: number }[] = []

export default function ExplorerPage() {
  const [params] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | null>(params.get('doc'))
  const [webgl] = useState(isWebGLAvailable)
  const { state, retry } = useGraph()

  const graph = state.status === 'success' ? state.graph : null
  const documents = graph?.nodes ?? NO_DOCS
  const edges = graph?.edges ?? NO_EDGES
  const selected = documents.find((d) => d.id === selectedId) ?? null

  useStatusNotifications(documents)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const related = useMemo<RelatedDoc[]>(() => {
    if (!selectedId) return []
    const byId = new Map(documents.map((d) => [d.id, d]))
    return edges
      .filter((e) => e.source === selectedId || e.target === selectedId)
      .map((e) => ({ doc: byId.get(e.source === selectedId ? e.target : e.source), weight: e.weight }))
      .filter((r): r is RelatedDoc => r.doc !== undefined)
      .sort((a, b) => b.weight - a.weight)
  }, [documents, edges, selectedId])

  return (
    <DashboardLayout
      title="3D Explorer"
      actions={<Link to="/dashboard" className={buttonClasses('secondary')}>List view</Link>}
    >
      {state.status === 'loading' && (
        <div className="h-[60vh] animate-pulse rounded-xl bg-slate-800/60" aria-busy="true" />
      )}

      {state.status === 'error' && (
        <div className="max-w-xl space-y-3">
          <Alert variant="error">{state.message}</Alert>
          <Button variant="secondary" onClick={retry}>Dobara try karo</Button>
        </div>
      )}

      {graph && graph.meta.total === 0 && (
        <EmptyState
          icon={<Box className="h-10 w-10" />}
          title="3D workspace khali hai"
          description="Pehle dashboard se koi PDF upload karo, phir woh yahan node ban kar nazar aayega."
          action={<Link to="/dashboard" className={buttonClasses('primary')}>Dashboard par jao</Link>}
        />
      )}

      {graph && graph.meta.total > 0 && (
        <div className="space-y-4">
          {graph.meta.truncated && (
            <Alert variant="info">
              Abhi pehle {graph.meta.limit} documents dikh rahe hain (total {graph.meta.total}).
            </Alert>
          )}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="relative h-[60vh] min-h-[420px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
              {webgl ? (
                <Suspense fallback={<SceneFallback variant="loading" />}>
                  <DocumentGalaxy documents={documents} edges={edges} selectedId={selectedId} onSelect={setSelectedId} />
                </Suspense>
              ) : (
                <SceneFallback variant="unsupported" />
              )}
              <GalaxyLegend />
              <p className="pointer-events-none absolute bottom-3 left-3 z-10 text-xs text-slate-500">
                Drag: rotate ? Scroll/pinch: zoom ? Click: select ? Esc: deselect
              </p>
            </div>

            <aside className="space-y-4">
              {selected && (
                <DocumentDetailsPanel
                  doc={selected}
                  related={related}
                  onSelect={setSelectedId}
                  onClose={() => setSelectedId(null)}
                />
              )}
              <ExplorerDocumentList documents={documents} selectedId={selectedId} onSelect={setSelectedId} />
            </aside>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
