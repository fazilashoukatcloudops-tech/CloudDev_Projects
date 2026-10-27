import { Router } from 'express'
import { getHealth } from '../controllers/health.controller'
import { notImplemented } from '../controllers/notImplemented'
import { validateBody } from '../validation'
import { loginSchema, questionSchema, registerSchema } from '../validation'

export const apiRouter = Router()

// ==================== HEALTH (Day 1) ====================
apiRouter.get('/health', getHealth)

// ==================== AUTH (Day 6 par implement hoga) ====================
apiRouter.post('/auth/register', validateBody(registerSchema), notImplemented)
apiRouter.post('/auth/login', validateBody(loginSchema), notImplemented)

// ==================== DOCUMENTS (Day 7+ par implement hoga) ====================
// Day 6 se: har route par authentication middleware lagega (Day 7+ real implementation)
apiRouter.get('/documents', notImplemented)
apiRouter.post('/documents', notImplemented)
apiRouter.get('/documents/:id', notImplemented)
apiRouter.get('/documents/:id/status', notImplemented)
apiRouter.post('/documents/:id/questions', validateBody(questionSchema), notImplemented)
apiRouter.delete('/documents/:id', notImplemented)