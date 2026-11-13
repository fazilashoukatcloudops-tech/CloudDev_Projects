export type Chunk = { chunkIndex: number; pageStart: number; pageEnd: number; content: string }

export function chunkPages(pages: string[], size = 1000, overlap = 150): Chunk[] {
  const offsets: number[] = []
  let full = ''
  pages.forEach((p, i) => {
    offsets.push(full.length)
    full += p
    if (i < pages.length - 1) full += '\n\n'
  })
  const pageAt = (pos: number) => { let page = 0; for (let i = 0; i < offsets.length && offsets[i] <= pos; i++) page = i; return page + 1 }
  const chunks: Chunk[] = []
  let start = 0
  while (start < full.length) {
    let end = Math.min(start + size, full.length)
    if (end < full.length) {
      const from = start + Math.floor(size * 0.6)
      const window = full.slice(from, end)
      for (const sep of ['. ', '\n', ' ']) {
        const at = window.lastIndexOf(sep)
        if (at >= 0) { end = from + at + 1; break }
      }
    }
    const raw = full.slice(start, end)
    const content = raw.trim()
    if (content) {
      const lead = raw.length - raw.trimStart().length
      chunks.push({ chunkIndex: chunks.length, pageStart: pageAt(start + lead), pageEnd: pageAt(end - 1), content })
    }
    if (end >= full.length) break
    let next = end - overlap
    const space = full.indexOf(' ', next)
    if (space !== -1 && space < end) next = space + 1
    start = Math.max(next, start + 1)
  }
  return chunks
}
