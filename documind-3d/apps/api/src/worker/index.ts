import http from 'node:http'
import { env } from '../config/env'
import { storage } from '../lib/storage'
import { embedder } from '../lib/embeddings'
import { redisConnection } from '../queue/connection'
import { QUEUE_NAME } from '../queue/constants'
import { closeStores, documentRepository, chunkRepository } from '../repositories'
import { createDocumentWorker } from './createWorker'

const redisUrl = env.REDIS_URL
if (env.QUEUE_DRIVER !== 'bullmq' || !redisUrl) {
  console.error('Worker ko QUEUE_DRIVER=bullmq aur REDIS_URL chahiye')
  process.exit(1)
}

const worker = createDocumentWorker({
  queueName: QUEUE_NAME,
  connection: redisConnection(redisUrl, { maxRetriesPerRequest: null }),
  concurrency: env.WORKER_CONCURRENCY,
  deps: {
    documents: documentRepository,
    storage,
    chunks: chunkRepository,
    limits: { maxPages: env.MAX_PDF_PAGES, maxChars: env.MAX_EXTRACTED_CHARS, timeoutMs: env.PROCESS_TIMEOUT_MS },
    embedder,
    simulatedDelayMs: env.PROCESS_SIMULATED_DELAY_MS,
    debugHooks: env.WORKER_DEBUG_HOOKS,
  },
})

const health = http.createServer((req, res) => {
  if (req.url !== '/health') {
    res.writeHead(404).end()
    return
  }
  // Simple check: is the worker running?
  const ok = worker.isRunning()
  res.writeHead(ok ? 200 : 503, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ status: ok ? 'ok' : 'unavailable' }))
})
health.listen(env.WORKER_HEALTH_PORT)

console.log(`documind-worker started (queue: ${QUEUE_NAME}, concurrency: ${env.WORKER_CONCURRENCY}, storage: ${env.STORAGE_DRIVER}, store: ${env.DATA_STORE}, health: :${env.WORKER_HEALTH_PORT})` + (env.WORKER_DEBUG_HOOKS ? ' [DEBUG HOOKS ON]' : ''))

let closing = false
async function shutdown(signal: string) {
  if (closing) return
  closing = true
  console.log(`[worker] ${signal} received: chalti jobs khatam hone ka intezar...`)
  setTimeout(() => process.exit(1), 30_000).unref()
  try {
    await worker.close()
    health.close()
    await closeStores()
  } catch (err) {
    console.error('[worker] shutdown error', err)
  }
  process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('unhandledRejection', (reason) => console.error('[worker] unhandledRejection', reason))
