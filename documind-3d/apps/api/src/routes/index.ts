import { Router } from 'express'
import { getHealth, getReadiness } from '../controllers/health.controller'
import { login, logout, me, register } from '../controllers/auth.controller'
import {
  createDocument,
  deleteDocument,
  getDocument,
  getDocumentStatus,
  getSummary,
  listDocuments,
} from '../controllers/documents.controller'
import { notImplemented } from '../controllers/notImplemented'
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

// ==================== HEALTH ====================
apiRouter.get('/health', getHealth)
apiRouter.get('/health/ready', getReadiness)

// ==================== AUTH ====================
const authRouter = Router()
authRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})
authRouter.post('/register', validateBody(registerSchema), register)
authRouter.post('/login', validateBody(loginSchema), login)
authRouter.post('/logout', logout)
authRouter.get('/me', requireAuth, me)
apiRouter.use('/auth', authRouter)

// ==================== DOCUMENTS (protected) ====================
const documentsRouter = Router()
documentsRouter.use(requireAuth)

documentsRouter.get('/', validateQuery(listQuerySchema), listDocuments)
documentsRouter.post('/', receivePdf, createDocument)

documentsRouter.get('/summary', getSummary)
documentsRouter.get('/graph', notImplemented)

documentsRouter.get('/:id', validateParams(idParamSchema), getDocument)
documentsRouter.get('/:id/status', validateParams(idParamSchema), getDocumentStatus)
documentsRouter.post(
  '/:id/questions',
  validateParams(idParamSchema),
  validateBody(questionSchema),
  notImplemented,
)
documentsRouter.delete('/:id', validateParams(idParamSchema), deleteDocument)

apiRouter.use('/documents', documentsRouter)
