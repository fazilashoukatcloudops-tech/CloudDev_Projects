import type { RequestHandler } from 'express'
import { env } from '../config/env'
import { AppError } from './errorHandler'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export const originCheck: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next()
  const origin = req.get('origin')
  if (origin && origin !== env.CORS_ORIGIN) {
    return next(new AppError(403, 'Request ka origin allowed nahi', 'FORBIDDEN_ORIGIN'))
  }
  next()
}
