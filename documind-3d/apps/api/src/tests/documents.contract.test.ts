import { beforeAll, describe, expect, it } from 'vitest'
import { buildPaginationMeta, toSkipTake } from '../lib/pagination'
import { authedAgent } from './helpers'

const VALID_ID = '3f2b8c1e-9a4d-4e6b-8c7a-1d2e3f4a5b6c'

let agent: Awaited<ReturnType<typeof authedAgent>>

beforeAll(async () => {
  agent = await authedAgent()
})

describe('GET /api/v1/documents (query validation)', () => {
  it('accepts a valid query', async () => {
    const res = await agent.get(
      '/api/v1/documents?page=2&pageSize=10&status=ready&sort=name&q=report',
    )
    expect(res.status).toBe(501)
  })

  it.each([
    ['page=0'],
    ['pageSize=100'],
    ['pageSize=abc'],
    ['status=bogus'],
    ['sort=bogus'],
  ])('rejects invalid query (%s)', async (qs) => {
    const res = await agent.get(`/api/v1/documents?${qs}`)
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('document id validation', () => {
  it('rejects a non-uuid id', async () => {
    const res = await agent.get('/api/v1/documents/not-a-uuid')
    expect(res.status).toBe(400)
    expect(res.body.error.details).toHaveProperty('id')
  })

  it('accepts a uuid id', async () => {
    const res = await agent.get(`/api/v1/documents/${VALID_ID}`)
    expect(res.status).toBe(501)
  })

  it('does not treat "summary" as an id', async () => {
    const res = await agent.get('/api/v1/documents/summary')
    expect(res.status).toBe(501)
  })

  it('validates id and question body together', async () => {
    const bad = await agent
      .post(`/api/v1/documents/${VALID_ID}/questions`)
      .send({ question: '' })
    expect(bad.status).toBe(400)

    const ok = await agent
      .post(`/api/v1/documents/${VALID_ID}/questions`)
      .send({ question: 'Is document ka summary kya hai?' })
    expect(ok.status).toBe(501)
  })
})

describe('pagination helper', () => {
  it('builds meta for a middle page', () => {
    expect(buildPaginationMeta(25, 2, 10)).toEqual({
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    })
  })

  it('handles empty results', () => {
    const meta = buildPaginationMeta(0, 1, 10)
    expect(meta.totalPages).toBe(0)
    expect(meta.hasNext).toBe(false)
    expect(meta.hasPrev).toBe(false)
  })

  it('converts page to skip/take', () => {
    expect(toSkipTake(3, 12)).toEqual({ skip: 24, take: 12 })
  })
})
