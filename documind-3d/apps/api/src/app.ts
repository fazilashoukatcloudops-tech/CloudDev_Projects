import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env'
import { apiRouter } from './routes'
import { errorHandler, notFound } from './middleware/errorHandler'
import { originCheck } from './middleware/originCheck'
import { requestLogger } from './middleware/requestLogger'

export const app = express()

app.use(helmet())
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(requestLogger)
app.use(originCheck)

app.use('/api/v1', apiRouter)

app.use(notFound)
app.use(errorHandler)
