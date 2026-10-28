import type { Request, Response } from 'express'
import { clearSessionCookie, setSessionCookie } from '../lib/cookies'
import { burnPasswordCheck, hashPassword, verifyPassword } from '../lib/passwords'
import { signSession } from '../lib/tokens'
import { getAuthUser } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { userRepository } from '../repositories'
import { EmailTakenError, type User } from '../repositories/userRepository'
import type { LoginInput, RegisterInput } from '../schemas/auth.schema'

function toPublicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email }
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as RegisterInput
  const passwordHash = await hashPassword(password)

  try {
    const user = await userRepository.create({ name, email, passwordHash })
    setSessionCookie(res, signSession(user.id))
    res.status(201).json({ user: toPublicUser(user) })
  } catch (err) {
    if (err instanceof EmailTakenError) {
      throw new AppError(409, 'Yeh email pehle se registered hai', 'EMAIL_TAKEN')
    }
    throw err
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput
  const user = await userRepository.findByEmail(email)

  const invalid = () => new AppError(401, 'Email ya password galat hai', 'INVALID_CREDENTIALS')

  if (!user) {
    await burnPasswordCheck(password)
    throw invalid()
  }
  if (!(await verifyPassword(password, user.passwordHash))) throw invalid()

  setSessionCookie(res, signSession(user.id))
  res.json({ user: toPublicUser(user) })
}

export function logout(_req: Request, res: Response) {
  clearSessionCookie(res)
  res.status(204).end()
}

export function me(_req: Request, res: Response) {
  res.json({ user: toPublicUser(getAuthUser(res)) })
}
