import { Router } from 'express'
import { apiLimiter, loginLimiter, registerLimiter, uploadLimiter, askLimiter, retryLimiter } from '../middleware/rateLimit'
import { getHealth, getReadiness } from '../controllers/health.controller'
import { login, logout, me, register } from '../controllers/auth.controller'
import {
  createDocument,
  deleteDocument,
  downloadDocument,
  getDocument,
  getDocumentStatus,
  getSummary,
  listDocuments,
  retryDocument,
  askQuestion,
  getGraph,
  getDocumentPreview,
} from '../controllers/documents.controller'
import { requireAuth } from '../middleware/auth'
import { receivePdf } from '../middleware/upload'
import { loginSchema, registerSchema } from '../schemas/auth.schema'
import {
  idParamSchema,
  listQuerySchema,
  questionSchema,
  validateBody,
  validateParams,
  validateQuery,
} from '../validation'

export const apiRouter = Router()

// Health probes limiter se pehle
apiRouter.get('/health', getHealth)
apiRouter.get('/health/ready', getReadiness)

// Baaki sab par global limiter
apiRouter.use(apiLimiter)

const authRouter = Router()
authRouter.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next() })
authRouter.post('/register', registerLimiter, validateBody(registerSchema), register)
authRouter.post('/login', loginLimiter, validateBody(loginSchema), login)
authRouter.post('/logout', logout)
authRouter.get('/me', requireAuth, me)
apiRouter.use('/auth', authRouter)

const documentsRouter = Router()
documentsRouter.use(requireAuth)

documentsRouter.get('/', validateQuery(listQuerySchema), listDocuments)
documentsRouter.post('/', uploadLimiter, receivePdf, createDocument)

documentsRouter.get('/summary', getSummary)
documentsRouter.get('/graph', getGraph)

documentsRouter.get('/:id', validateParams(idParamSchema), getDocument)
documentsRouter.get('/:id/status', validateParams(idParamSchema), getDocumentStatus)
documentsRouter.get('/:id/download', validateParams(idParamSchema), downloadDocument)
documentsRouter.get('/:id/preview', validateParams(idParamSchema), getDocumentPreview)
documentsRouter.post('/:id/retry', retryLimiter, validateParams(idParamSchema), retryDocument)
documentsRouter.post(
  '/:id/questions',
  askLimiter,
  validateParams(idParamSchema),
  validateBody(questionSchema),
  askQuestion,
)
documentsRouter.delete('/:id', validateParams(idParamSchema), deleteDocument)

apiRouter.use('/documents', documentsRouter)
