import { Worker, type ConnectionOptions, type Job } from 'bullmq'
import type { DocumentJobData } from '../queue/constants'
import { recordFailure } from './failureHandling'
import { processDocument, type ProcessDeps } from './processDocument'

export type WorkerConfig = { queueName: string; connection: ConnectionOptions; concurrency: number; deps: ProcessDeps }

export function createDocumentWorker(cfg: WorkerConfig) {
  const worker = new Worker<DocumentJobData>(
    cfg.queueName,
    async (job) => {
      const attempt = job.attemptsMade + 1
      console.log(`[worker] job ${job.id} start (document ${job.data.documentId}, attempt ${attempt})`)
      return processDocument({ documentId: job.data.documentId, attempt }, cfg.deps)
    },
    { connection: cfg.connection, concurrency: cfg.concurrency, lockDuration: 60_000 },
  )

  worker.on('failed', (job: Job<DocumentJobData> | undefined, err: Error) => {
    if (!job) return console.error('[worker] job failed (job info nahi):', err.message)
    const maxAttempts = job.opts.attempts ?? 1
    recordFailure(cfg.deps.documents, job.data.documentId, err, job.attemptsMade, maxAttempts)
      .then((outcome) => console.warn(`[worker] job ${job.id} failed (attempt ${job.attemptsMade}/${maxAttempts}) -> ${outcome}: ${err.message}`))
      .catch((dbErr: unknown) => console.error(`[worker] failure ko DB mein record nahi kar saka (job ${job.id})`, dbErr))
  })

  worker.on('completed', (job, result: unknown) => console.log(`[worker] job ${job.id} completed:`, JSON.stringify(result)))
  worker.on('error', (err) => console.error('[worker] error:', err.message))

  return worker
}
