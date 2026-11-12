import { env } from '../config/env'
import { BullDocumentQueue } from './bullQueue'
import { QUEUE_NAME } from './constants'
import { redisConnection } from './connection'
import { MemoryDocumentQueue, type DocumentQueue } from './documentQueue'

function createQueue(): DocumentQueue {
  if (env.QUEUE_DRIVER === 'memory' || !env.REDIS_URL) return new MemoryDocumentQueue()
  return new BullDocumentQueue({
    queueName: QUEUE_NAME,
    connection: redisConnection(env.REDIS_URL, { enableOfflineQueue: false, maxRetriesPerRequest: 1 }),
    attempts: env.JOB_ATTEMPTS,
    backoffMs: env.JOB_BACKOFF_MS,
  })
}

export const documentQueue: DocumentQueue = createQueue()
