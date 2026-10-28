import type { DocumentStatus } from '../../types/document'

export type Vec3 = [number, number, number]
export type Edge = [number, number]

export const STATUS_COLORS: Record<DocumentStatus, string> = {
  ready: '#818cf8',
  processing: '#fbbf24',
  queued: '#94a3b8',
  failed: '#f87171',
}

const GOLDEN_ANGLE = 2.399963229728653
const GOLDEN_RATIO_CONJUGATE = 0.6180339887498949

// Index par based position: naya document aane se purane nodes nahi hilte.
export function nodePosition(index: number): Vec3 {
  const radius = 2.2 + 1.1 * Math.sqrt(index)
  const u = (index * GOLDEN_RATIO_CONJUGATE + 0.1) % 1
  const phi = Math.acos(1 - 2 * u)
  const theta = index * GOLDEN_ANGLE
  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi) * 0.7,
    radius * Math.sin(phi) * Math.sin(theta),
  ]
}

// File size ke hisaab se node ka size (0.28 se 0.7)
export function nodeRadius(sizeBytes: number): number {
  const mb = sizeBytes / 1_000_000
  return Math.min(0.7, 0.28 + 0.12 * Math.sqrt(mb))
}

const dist2 = (a: Vec3, b: Vec3) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2

// Placeholder: har node ko k qareebi neighbours se jodta hai.
// Day 11+ mein yeh embeddings ki similarity se replace hoga.
export function buildEdges(positions: Vec3[], k = 2): Edge[] {
  const seen = new Set<string>()
  const edges: Edge[] = []

  positions.forEach((p, i) => {
    const nearest = positions
      .map((q, j) => ({ j, d: dist2(p, q) }))
      .filter((x) => x.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, k)

    for (const { j } of nearest) {
      const a = Math.min(i, j)
      const b = Math.max(i, j)
      const key = `${a}-${b}`
      if (!seen.has(key)) {
        seen.add(key)
        edges.push([a, b])
      }
    }
  })
  return edges
}

// lineSegments ke liye flat array: [x1,y1,z1, x2,y2,z2, ...]
export function edgePositions(positions: Vec3[], edges: Edge[]): Float32Array {
  const out = new Float32Array(edges.length * 6)
  edges.forEach(([a, b], i) => {
    out.set(positions[a], i * 6)
    out.set(positions[b], i * 6 + 3)
  })
  return out
}
