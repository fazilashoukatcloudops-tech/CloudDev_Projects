import { looksLikePdf, sha256 } from '../lib/files'
import { chunkPages } from '../lib/chunking'
import { extractPdfText, PdfExtractError, type PdfLimits } from '../lib/pdfText'
import type { FileStorage } from '../lib/storage'
import { TimeoutError, withTimeout } from '../lib/withTimeout'
import type { ChunkRepository } from '../repositories/chunkRepository'
import type { DocumentRepository } from '../repositories/documentRepository'
import { PermanentJobError } from './failureHandling'
import type { EmbeddingProvider } from '../lib/embeddings'
import { meanVector } from '../lib/centroid'

export type ProcessDeps = {
  documents: DocumentRepository
  storage: FileStorage
  chunks: ChunkRepository
  limits: PdfLimits & { timeoutMs: number }
  embedder: EmbeddingProvider
  simulatedDelayMs: number
  debugHooks: boolean
}

export type ProcessResult =
  | { outcome: 'ready'; pages: number; chunks: number }
  | { outcome: 'skipped'; reason: 'not-found' | 'not-processable' }

const MIN_TEXT_CHARS = 20
const PREVIEW_CHARS = 600
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function makePreview(pages: string[]): string {
  const text = pages.join('\n\n').trim()
  if (text.length <= PREVIEW_CHARS) return text
  const cut = text.slice(0, PREVIEW_CHARS)
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), PREVIEW_CHARS * 0.8)) + '?'
}

export async function processDocument(
  input: { documentId: string; attempt: number },
  deps: ProcessDeps,
): Promise<ProcessResult> {
  const started = Date.now()
  const doc = await deps.documents.findForProcessing(input.documentId)
  if (!doc) return { outcome: 'skipped', reason: 'not-found' }
  if (!(await deps.documents.markProcessing(doc.id))) {
    return { outcome: 'skipped', reason: 'not-processable' }
  }

  const data = await deps.storage.read(doc.storageKey)

  if (sha256(data) !== doc.checksumSha256) {
    throw new PermanentJobError('Stored file corrupt hai (checksum match nahi hua). Dobara upload karo.')
  }
  if (!looksLikePdf(data)) throw new PermanentJobError('File valid PDF nahi hai.')

  if (deps.debugHooks) {
    const name = doc.name.toLowerCase()
    if (name.includes('fail-test')) throw new PermanentJobError('Test failure (debug hook): permanent error.')
    if (name.includes('error-test')) throw new Error('Test: transient failure (debug hook) har attempt par')
    if (name.includes('flaky-test') && input.attempt < 3) throw new Error(`Test: transient failure (debug hook), attempt ${input.attempt}`)
  }
  if (deps.simulatedDelayMs > 0) await sleep(deps.simulatedDelayMs)

  let extracted
  try {
    extracted = await withTimeout(extractPdfText(data, deps.limits), deps.limits.timeoutMs, 'pdf extraction')
  } catch (err) {
    if (err instanceof PdfExtractError) throw new PermanentJobError(err.message)
    if (err instanceof TimeoutError) throw new PermanentJobError('PDF process hone mein bohat der lag gayi (file bohat bari ya complex hai).')
    throw err
  }

  if (extracted.totalChars < MIN_TEXT_CHARS) {
    throw new PermanentJobError('PDF mein text nahi mila. Shayad scanned image hai (OCR abhi supported nahi). Text-based PDF upload karo.')
  }

  const chunks = chunkPages(extracted.pages)
  
  // Embeddings generate karein
  const vectors = await deps.embedder.embed(chunks.map((c) => c.content))
  if (vectors.length !== chunks.length) throw new Error('Embedding count mismatch')
  
  const withEmbeddings = chunks.map((c, i) => ({
    ...c,
    embedding: vectors[i],
    embeddingModel: deps.embedder.model,
  }))
  
  await deps.chunks.replaceForDocument({ id: doc.id, userId: doc.userId }, withEmbeddings)

  const ready = await deps.documents.markReady(doc.id, extracted.pages.length, {
    previewText: makePreview(extracted.pages),
    chunkCount: chunks.length,
    textChars: extracted.totalChars,
  })
  
  if (ready) {
    // 3D Graph ke liye centroid (average vector) save karein
    await deps.documents
      .setCentroid(doc.id, meanVector(vectors), deps.embedder.model)
      .catch((err: unknown) => console.warn(`[worker] centroid save failed for ${doc.id}`, err))
  }

  console.log(`[worker] document ${doc.id}: pages=${extracted.pages.length} chars=${extracted.totalChars} chunks=${chunks.length} ms=${Date.now() - started} rssMB=${Math.round(process.memoryUsage().rss / 1048576)}`)
  return { outcome: 'ready', pages: extracted.pages.length, chunks: chunks.length }
}
