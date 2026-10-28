import { Router } from 'express'
import { getHealth } from '../controllers/health.controller'
import { notImplemented } from '../controllers/notImplemented'
import {
  idParamSchema,
  listQuerySchema,
  loginSchema,
  questionSchema,
  registerSchema,
  validateBody,
  validateParams,
  validateQuery,
} from '../validation'

export const apiRouter = Router()

// ==================== HEALTH ====================
apiRouter.get('/health', getHealth)

// ==================== AUTH (Day 6) ====================
apiRouter.post('/auth/register', validateBody(registerSchema), notImplemented)
apiRouter.post('/auth/login', validateBody(loginSchema), notImplemented)

// ==================== DOCUMENTS (Day 7+) ====================
// Day 6 se: har route par authentication middleware lagega.
// Contract ke liye docs/api-contract.md dekho.

apiRouter.get('/documents', validateQuery(listQuerySchema), notImplemented)
apiRouter.post('/documents', notImplemented)

// "/summary" aur "/graph" ko "/:id" se PEHLE rakhna zaroori hai, warna inhe id samjha jayega.
apiRouter.get('/documents/summary', notImplemented)
apiRouter.get('/documents/graph', notImplemented)

apiRouter.get('/documents/:id', validateParams(idParamSchema), notImplemented)
apiRouter.get('/documents/:id/status', validateParams(idParamSchema), notImplemented)
apiRouter.post(
  '/documents/:id/questions',
  validateParams(idParamSchema),
  validateBody(questionSchema),
  notImplemented,
)
apiRouter.delete('/documents/:id', validateParams(idParamSchema), notImplemented)
