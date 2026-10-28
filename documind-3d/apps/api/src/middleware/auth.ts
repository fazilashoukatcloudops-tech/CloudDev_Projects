import type { RequestHandler, Response } from 'express'
import { clearSessionCookie, SESSION_COOKIE } from '../lib/cookies'
import { verifySession } from '../lib/tokens'
import { userRepository } from '../repositories'
import type { User } from '../repositories/userRepository'
import { AppError } from './errorHandler'

const unauthorized = () => new AppError(401, 'Login zaroori hai', 'UNAUTHORIZED')

export const requireAuth: RequestHandler = async (req, res, next) => {
  const token: unknown = req.cookies?.[SESSION_COOKIE]
  const userId = typeof token === 'string' ? verifySession(token) : null
  if (!userId) return next(unauthorized())

  const user = await userRepository.findById(userId)
  if (!user) {
    clearSessionCookie(res)
    return next(unauthorized())
  }

  res.locals.user = user
  next()
}

export function getAuthUser(res: Response): User {
  return res.locals.user as User
}
