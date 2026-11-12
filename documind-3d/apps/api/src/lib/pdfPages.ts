export function estimatePdfPages(buffer: Buffer): number {
  const text = buffer.toString('latin1')
  const matches = text.match(/\/Type\s*\/Page(?![A-Za-z])/g)
  return Math.max(1, matches?.length ?? 0)
}
