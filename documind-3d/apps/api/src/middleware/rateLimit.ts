import type { RequestHandler } from 'express'
import { rateLimit } from 'express-rate-limit'
import { env } from '../config/env'
import { getAuthUser } from './auth'
import { AppError } from './errorHandler'

export type LimiterConfig = {
  windowMs: number
  limit: number
  message: string
  skipSuccessfulRequests?: boolean
  perUser?: boolean
}

const MIN = 60_000
const HOUR = 60 * MIN

export function createLimiter(cfg: LimiterConfig, enabled = env.RATE_LIMIT_ENABLED): RequestHandler {
  if (!enabled) return (_req, _res, next) => next()

  return rateLimit({
    windowMs: cfg.windowMs,
    limit: cfg.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: cfg.skipSuccessfulRequests ?? false,
    ...(cfg.perUser ? { keyGenerator: (_req, res) => getAuthUser(res).id } : {}),
    handler: (_req, _res, next, options) =>
      next(new AppError(429, cfg.message, 'RATE_LIMITED', { retryAfterSeconds: Math.ceil(options.windowMs / 1000) })),
  })
}

export const apiLimiter = createLimiter({ windowMs: 15 * MIN, limit: 1500, message: 'Bohat zyada requests. Thori der baad dobara try karo.' })
export const loginLimiter = createLimiter({ windowMs: 15 * MIN, limit: 10, skipSuccessfulRequests: true, message: 'Bohat zyada login koshishen. 15 minute baad dobara try karo.' })
export const registerLimiter = createLimiter({ windowMs: HOUR, limit: 10, message: 'Is network se bohat zyada accounts bane hain. Ek ghante baad try karo.' })
export const uploadLimiter = createLimiter({ windowMs: HOUR, limit: 20, perUser: true, message: 'Upload limit poori ho gayi (20 per ghanta). Baad mein try karo.' })
export const askLimiter = createLimiter({ windowMs: 10 * MIN, limit: 20, perUser: true, message: 'AI sawalon ki limit poori ho gayi (20 per 10 minute). Thori der baad poochho.' })
export const retryLimiter = createLimiter({ windowMs: HOUR, limit: 30, perUser: true, message: 'Retry limit poori ho gayi. Baad mein try karo.' })
