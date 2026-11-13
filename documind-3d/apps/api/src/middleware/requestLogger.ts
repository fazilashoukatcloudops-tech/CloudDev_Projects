import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env'

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const id = randomUUID()
  res.setHeader('X-Request-Id', id)
  const start = Date.now()

  res.on('finish', () => {
    if (env.NODE_ENV === 'test') return
    const ms = Date.now() - start
    const line = `[${id.slice(0, 8)}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`
    if (ms >= env.SLOW_REQUEST_MS) console.warn(`SLOW ${line}`)
    else console.log(line)
  })
  next()
}
