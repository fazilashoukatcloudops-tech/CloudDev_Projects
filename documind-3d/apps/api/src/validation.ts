import type { RequestHandler } from 'express'
import { z, type ZodType } from 'zod'

// ==================== AUTH SCHEMAS ====================
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
})

// ==================== DOCUMENT SCHEMAS ====================
export const questionSchema = z.object({
  question: z.string().trim().min(3).max(1000),
})

// ==================== VALIDATION MIDDLEWARE ====================
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) return next(result.error) // errorHandler ZodError ko 400 bana deta hai
    req.body = result.data
    next()
  }