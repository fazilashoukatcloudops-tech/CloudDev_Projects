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
export const DOCUMENT_STATUSES = ['queued', 'processing', 'ready', 'failed'] as const
export const DOCUMENT_SORTS = ['newest', 'oldest', 'name', 'size'] as const
export const MAX_PAGE_SIZE = 50

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(12),
  status: z.enum(DOCUMENT_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(DOCUMENT_SORTS).default('newest'),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export const questionSchema = z.object({
  question: z.string().trim().min(3).max(1000),
})

export type ListDocumentsQuery = z.infer<typeof listQuerySchema>

// ==================== VALIDATION MIDDLEWARE ====================
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) return next(result.error)
    req.body = result.data
    next()
  }

// Express 5 mein req.query read-only hai, is liye validated data res.locals mein rakhte hain.
export const validateQuery =
  (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.query)
    if (!result.success) return next(result.error)
    res.locals.query = result.data
    next()
  }

export const validateParams =
  (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.params)
    if (!result.success) return next(result.error)
    res.locals.params = result.data
    next()
  }

export type DocumentSort = (typeof DOCUMENT_SORTS)[number]
