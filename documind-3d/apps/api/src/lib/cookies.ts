import type { CookieOptions, Response } from 'express'
import { env } from '../config/env'

export const SESSION_COOKIE = 'documind_session'

const base: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  path: '/',
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    ...base,
    maxAge: env.JWT_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  })
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, base)
}
