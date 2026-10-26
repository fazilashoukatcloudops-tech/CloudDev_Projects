import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env'
import { apiRouter } from './routes'
import { errorHandler, notFound } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'

export const app = express()

app.use(helmet())
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(requestLogger)

app.use('/api/v1', apiRouter)

app.use(notFound)
app.use(errorHandler)