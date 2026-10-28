import { app } from './app'
import { env } from './config/env'
import { closeStores } from './repositories'

const server = app.listen(env.PORT, () => {
  console.log(
    `documind-api running on http://localhost:${env.PORT} (${env.NODE_ENV}, store: ${env.DATA_STORE})`,
  )
})

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`)
  server.close(() => {
    closeStores()
      .catch((err: unknown) => console.error('DB disconnect failed', err))
      .finally(() => process.exit(0))
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
