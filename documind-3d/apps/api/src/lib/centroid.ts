export function meanVector(vectors: number[][]): number[] {
  const dims = vectors[0]?.length ?? 0
  const sum = new Array<number>(dims).fill(0)
  for (const v of vectors) for (let i = 0; i < dims; i++) sum[i] += v[i] ?? 0
  const norm = Math.sqrt(sum.reduce((s, x) => s + x * x, 0))
  return norm === 0 ? sum : sum.map((x) => x / norm)
}
