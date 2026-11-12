import { looksLikePdf, sha256 } from '../lib/files'
import { estimatePdfPages } from '../lib/pdfPages'
import type { FileStorage } from '../lib/storage'
import type { DocumentRepository } from '../repositories/documentRepository'
import { PermanentJobError } from './failureHandling'

export type ProcessDeps = { documents: DocumentRepository; storage: FileStorage; simulatedDelayMs: number; debugHooks: boolean }
export type ProcessResult = { outcome: 'ready'; pages: number } | { outcome: 'skipped'; reason: 'not-found' | 'not-processable' }

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export async function processDocument(
  input: { documentId: string; attempt: number },
  deps: ProcessDeps,
): Promise<ProcessResult> {
  const doc = await deps.documents.findForProcessing(input.documentId)
  if (!doc) return { outcome: 'skipped', reason: 'not-found' }

  if (!(await deps.documents.markProcessing(doc.id))) return { outcome: 'skipped', reason: 'not-processable' }

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

  const pages = estimatePdfPages(data)
  await deps.documents.markReady(doc.id, pages)
  return { outcome: 'ready', pages }
}
