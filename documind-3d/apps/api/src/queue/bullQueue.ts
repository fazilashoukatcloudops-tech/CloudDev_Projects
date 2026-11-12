import { Queue, type ConnectionOptions } from 'bullmq'
import { Redis } from 'ioredis'
import { withTimeout } from '../lib/withTimeout'
import { JOB_NAME, type DocumentJobData } from './constants'
import type { DocumentQueue, EnqueueOptions } from './documentQueue'

export type BullQueueConfig = {
  queueName: string
  connection: ConnectionOptions
  attempts: number
  backoffMs: number
}

export class BullDocumentQueue implements DocumentQueue {
  private queue?: Queue<DocumentJobData>
  private pingClient?: Redis

  constructor(private readonly cfg: BullQueueConfig) {}

  private get q(): Queue<DocumentJobData> {
    if (!this.queue) {
      this.queue = new Queue<DocumentJobData>(this.cfg.queueName, {
        connection: this.cfg.connection,
        defaultJobOptions: {
          attempts: this.cfg.attempts,
          backoff: { type: 'exponential', delay: this.cfg.backoffMs },
          removeOnComplete: { age: 3600, count: 1000 },
          removeOnFail: { age: 7 * 24 * 3600 },
        },
      })
      this.queue.on('error', (err) => console.error('[queue] error:', err.message))
    }
    return this.queue
  }

  async enqueue(documentId: string, options: EnqueueOptions = {}) {
    const jobId = options.retry ? `${documentId}_retry_${Date.now()}` : documentId
    await withTimeout(this.q.add(JOB_NAME, { documentId }, { jobId }), 3000, 'enqueue')
  }

  async ping() {
    if (!this.pingClient) {
      // Ping client ke liye offline queue true karein taake connect hote waqt error na de
      const conn = { ...this.cfg.connection, enableOfflineQueue: true, maxRetriesPerRequest: null }
      this.pingClient = new Redis(conn as any)
      this.pingClient.on('error', (err) => console.error('[queue-ping] error:', err.message))
    }
    await withTimeout(this.pingClient.ping(), 2000, 'redis ping')
  }

  async close() {
    await this.queue?.close()
    await this.pingClient?.quit()
  }
}
