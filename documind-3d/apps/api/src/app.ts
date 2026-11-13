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

app.set('trust proxy', env.TRUST_PROXY)

app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'no-referrer' },
}))
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 600,
}))
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())
app.use(requestLogger)
app.use(originCheck)

app.use('/api/v1', apiRouter)

app.use(notFound)
app.use(errorHandler)
