import { createHash } from 'node:crypto'
import { env } from '../config/env'

export const MAX_UPLOAD_BYTES = env.MAX_UPLOAD_MB * 1024 * 1024

const PDF_MAGIC = Buffer.from('%PDF-')

export function looksLikePdf(buffer: Buffer): boolean {
  return buffer.length >= PDF_MAGIC.length && buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)
}

export function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

export function sanitizeFileName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? ''
  const cleaned = [...base]
    .filter((ch) => ch.charCodeAt(0) > 31 && ch.charCodeAt(0) !== 127)
    .join('')
    .replace(/[<>:"|?*]/g, '_')
    .trim()
  const name = cleaned.length > 255 ? cleaned.slice(-255) : cleaned
  return name || 'document.pdf'
}
export function attachmentHeader(fileName: string): string {
  const fallback = fileName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\%]/g, '_')
  const encoded = encodeURIComponent(fileName).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`
}
