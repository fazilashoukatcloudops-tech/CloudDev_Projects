import type { NextFunction, Request, Response } from 'express'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = 'APP_ERROR',
  ) {
    super(message)
  }
}

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'))
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    })
  }

  console.error(err)
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  })
}