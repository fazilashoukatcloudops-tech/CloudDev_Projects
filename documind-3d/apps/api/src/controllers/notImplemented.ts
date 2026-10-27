import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../middleware/errorHandler'

// Planned endpoints ke liye. Har endpoint apne din par real controller se replace hoga.
export function notImplemented(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(501, 'This endpoint is not implemented yet', 'NOT_IMPLEMENTED'))
}