import type { ChunkRepository } from '../repositories/chunkRepository'
import type { DocumentRecord, DocumentRepository } from '../repositories/documentRepository'
import { meanVector } from './centroid'
import type { EmbeddingProvider } from './embeddings'
import { dot } from './retrieval'

export const GRAPH_LIMIT = 50
const NEIGHBORS = 3

export type GraphEdge = { source: string; target: string; weight: number }
export type GraphDeps = { documents: DocumentRepository; chunks: ChunkRepository; embedder: EmbeddingProvider }
export type Graph = { nodes: DocumentRecord[]; edges: GraphEdge[]; total: number }

export async function buildGraph(userId: string, deps: GraphDeps): Promise<Graph> {
  const { items, total } = await deps.documents.list({ userId, page: 1, pageSize: GRAPH_LIMIT, sort: 'oldest' })
  const model = deps.embedder.model
  const vectors = new Map<string, number[]>()
  
  for (const doc of items) {
    if (doc.status !== 'ready') continue
    let vector = doc.centroidModel === model && doc.centroid.length > 0 ? doc.centroid : null
    if (!vector) {
      const chunks = (await deps.chunks.listForDocument(userId, doc.id)).filter((c) => c.embeddingModel === model && c.embedding.length > 0)
      if (chunks.length === 0) continue
      vector = meanVector(chunks.map((c) => c.embedding))
      await deps.documents.setCentroid(doc.id, vector, model).catch(() => undefined)
    }
    vectors.set(doc.id, vector)
  }

  const ids = [...vectors.keys()]
  const unique = new Map<string, GraphEdge>()
  for (const a of ids) {
    const neighbours = ids.filter((b) => b !== a).map((b) => ({ b, w: dot(vectors.get(a)!, vectors.get(b)!) })).filter((x) => x.w >= deps.embedder.edgeMinScore).sort((x, y) => y.w - x.w || x.b.localeCompare(y.b)).slice(0, NEIGHBORS)
    for (const { b, w } of neighbours) {
      const [source, target] = a < b ? [a, b] : [b, a]
      unique.set(`${source}|${target}`, { source, target, weight: Math.round(Math.min(1, w) * 1000) / 1000 })
    }
  }
  return { nodes: items, edges: [...unique.values()], total }
}
