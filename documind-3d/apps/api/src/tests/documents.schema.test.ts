import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app'
import { buildPaginationMeta } from '../lib/pagination'
import {
  documentDtoSchema,
  graphResponseSchema,
  listResponseSchema,
  summaryResponseSchema,
} from '../schemas/documentResponse.schema'
import { MOCK_DOCUMENTS } from './fixtures/documents'

describe('mock documents follow the response contract', () => {
  it('every mock document is a valid DocumentDto', () => {
    for (const d of MOCK_DOCUMENTS) {
      expect(documentDtoSchema.safeParse(d).success, d.name).toBe(true)
    }
  })

  it('covers all four statuses', () => {
    const statuses = new Set(MOCK_DOCUMENTS.map((d) => d.status))
    expect(statuses).toEqual(new Set(['queued', 'processing', 'ready', 'failed']))
  })

  it('builds a valid list response', () => {
    const body = {
      data: MOCK_DOCUMENTS.slice(0, 6),
      meta: buildPaginationMeta(MOCK_DOCUMENTS.length, 1, 6),
    }
    expect(listResponseSchema.safeParse(body).success).toBe(true)
    expect(body.meta.totalPages).toBe(3)
  })

  it('builds a valid summary response', () => {
    const byStatus = { queued: 0, processing: 0, ready: 0, failed: 0 }
    let storageBytes = 0
    for (const d of MOCK_DOCUMENTS) {
      byStatus[d.status] += 1
      storageBytes += d.sizeBytes
    }
    const body = { data: { total: MOCK_DOCUMENTS.length, byStatus, storageBytes } }
    expect(summaryResponseSchema.safeParse(body).success).toBe(true)
    expect(byStatus.ready).toBe(10)
  })
})

describe('DocumentDto business rules', () => {
  const base = MOCK_DOCUMENTS[0]

  it.each([
    ['ready without pages', { pages: null }],
    ['ready with an error message', { errorMessage: 'oops' }],
    ['failed without an error message', { status: 'failed' as const, errorMessage: null }],
    ['negative size', { sizeBytes: -1 }],
    ['bad id', { id: 'abc' }],
    ['bad date', { uploadedAt: 'yesterday' }],
  ])('rejects %s', (_label, patch) => {
    expect(documentDtoSchema.safeParse({ ...base, ...patch }).success).toBe(false)
  })
})

describe('graph response', () => {
  const [a, b] = MOCK_DOCUMENTS

  it('accepts edges between existing nodes', () => {
    const body = { data: { nodes: [a, b], edges: [{ source: a.id, target: b.id, weight: 0.8 }] } }
    expect(graphResponseSchema.safeParse(body).success).toBe(true)
  })

  it('rejects dangling edges, self loops and bad weights', () => {
    const missing = MOCK_DOCUMENTS[5].id
    const bad = [
      { source: a.id, target: missing, weight: 0.5 },
      { source: a.id, target: a.id, weight: 0.5 },
      { source: a.id, target: b.id, weight: 1.5 },
    ]
    for (const edge of bad) {
      const body = { data: { nodes: [a, b], edges: [edge] } }
      expect(graphResponseSchema.safeParse(body).success).toBe(false)
    }
  })
})

describe('GET /api/v1/documents/graph', () => {
  it('is planned (501) and not treated as an id', async () => {
    const res = await request(app).get('/api/v1/documents/graph')
    expect(res.status).toBe(501)
  })
})
