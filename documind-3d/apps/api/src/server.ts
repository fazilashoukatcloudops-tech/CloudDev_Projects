import { app } from './app'
import { env } from './config/env'
import { documentQueue } from './queue'
import { closeStores } from './repositories'

const server = app.listen(env.PORT, () => {
  console.log(
    `documind-api running on http://localhost:${env.PORT} ` +
      `(${env.NODE_ENV}, store: ${env.DATA_STORE}, storage: ${env.STORAGE_DRIVER}, queue: ${env.QUEUE_DRIVER})`,
  )
})

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`)
  server.close(() => {
    Promise.allSettled([closeStores(), documentQueue.close()]).finally(() => process.exit(0))
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
