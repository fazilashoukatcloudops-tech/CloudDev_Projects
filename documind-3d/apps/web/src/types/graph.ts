import type { DocumentItem } from './document'

export type GraphEdge = { source: string; target: string; weight: number }

export type GraphData = {
  nodes: DocumentItem[]
  edges: GraphEdge[]
  meta: { total: number; limit: number; truncated: boolean }
}
