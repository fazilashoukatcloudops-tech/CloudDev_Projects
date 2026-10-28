import { z } from 'zod'
import { DOCUMENT_STATUSES, MAX_PAGE_SIZE } from '../validation'

export const documentDtoSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1).max(255),
    sizeBytes: z.number().int().nonnegative(),
    pages: z.number().int().positive().nullable(),
    status: z.enum(DOCUMENT_STATUSES),
    errorMessage: z.string().nullable(),
    uploadedAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .superRefine((d, ctx) => {
    if (d.status === 'ready' && d.pages === null) {
      ctx.addIssue({ code: 'custom', path: ['pages'], message: 'ready documents need a page count' })
    }
    if (d.status === 'failed' && d.errorMessage === null) {
      ctx.addIssue({ code: 'custom', path: ['errorMessage'], message: 'failed documents need an error message' })
    }
    if (d.status !== 'failed' && d.errorMessage !== null) {
      ctx.addIssue({ code: 'custom', path: ['errorMessage'], message: 'only failed documents carry an error message' })
    }
  })

export type DocumentDto = z.infer<typeof documentDtoSchema>

export const paginationMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
})

export const listResponseSchema = z.object({
  data: z.array(documentDtoSchema),
  meta: paginationMetaSchema,
})

export const summaryResponseSchema = z.object({
  data: z.object({
    total: z.number().int().nonnegative(),
    byStatus: z.object({
      queued: z.number().int().nonnegative(),
      processing: z.number().int().nonnegative(),
      ready: z.number().int().nonnegative(),
      failed: z.number().int().nonnegative(),
    }),
    storageBytes: z.number().int().nonnegative(),
  }),
})

// 3D explorer ke liye (planned): nodes + similarity edges
export const graphResponseSchema = z.object({
  data: z
    .object({
      nodes: z.array(documentDtoSchema),
      edges: z.array(
        z.object({
          source: z.string().uuid(),
          target: z.string().uuid(),
          weight: z.number().min(0).max(1),
        }),
      ),
    })
    .superRefine((g, ctx) => {
      const ids = new Set(g.nodes.map((n) => n.id))
      g.edges.forEach((e, i) => {
        if (e.source === e.target || !ids.has(e.source) || !ids.has(e.target)) {
          ctx.addIssue({
            code: 'custom',
            path: ['edges', i],
            message: 'edge must connect two different existing nodes',
          })
        }
      })
    }),
})
