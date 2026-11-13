import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

export class AppError extends Error {
  constructor(public statusCode: number, message: string, public code: string = 'APP_ERROR', public details?: unknown) { super(message) }
}

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'))
}

const errType = (err: unknown) => typeof err === 'object' && err !== null && 'type' in err ? String((err as { type: unknown }).type) : ''

function clientStatus(err: unknown): number | null {
  if (typeof err !== 'object' || err === null) return null
  const e = err as { status?: unknown; statusCode?: unknown }
  const s = e.status ?? e.statusCode
  return typeof s === 'number' && s >= 400 && s < 500 ? s : null
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: err.flatten().fieldErrors } })
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { code: err.code, message: err.message, details: err.details } })
  }
  if (errType(err) === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } })
  }
  if (errType(err) === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body bohat bari hai' } })
  }
  const status = clientStatus(err)
  if (status) {
    return res.status(status).json({ error: { code: 'BAD_REQUEST', message: 'Request galat hai' } })
  }
  console.error(err)
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } })
}
