import { Router } from 'express'
import { getHealth } from '../controllers/health.controller'
import { login, logout, me, register } from '../controllers/auth.controller'
import { notImplemented } from '../controllers/notImplemented'
import { requireAuth } from '../middleware/auth'
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
// Har documents route login mangta hai (requireAuth validation se pehle chalta hai)
const documentsRouter = Router()
documentsRouter.use(requireAuth)

documentsRouter.get('/', validateQuery(listQuerySchema), notImplemented)
documentsRouter.post('/', notImplemented)
documentsRouter.get('/summary', notImplemented)
documentsRouter.get('/graph', notImplemented)
documentsRouter.get('/:id', validateParams(idParamSchema), notImplemented)
documentsRouter.get('/:id/status', validateParams(idParamSchema), notImplemented)
documentsRouter.post(
  '/:id/questions',
  validateParams(idParamSchema),
  validateBody(questionSchema),
  notImplemented,
)
documentsRouter.delete('/:id', validateParams(idParamSchema), notImplemented)

apiRouter.use('/documents', documentsRouter)
