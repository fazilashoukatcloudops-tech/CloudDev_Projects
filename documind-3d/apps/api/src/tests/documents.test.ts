import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app'
import { sanitizeFileName } from '../lib/files'
import { LocalDiskStorage } from '../lib/storage'
import { documentDtoSchema, listResponseSchema } from '../schemas/documentResponse.schema'
import { authedAgent } from './helpers'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const pdf = (extra = '') => Buffer.from(`%PDF-1.4\n%test ${extra}\n%%EOF\n`)

type Agent = Awaited<ReturnType<typeof authedAgent>>

const upload = (agent: Agent, name = 'report.pdf', data: Buffer = pdf(), type = 'application/pdf') =>
  agent.post('/api/v1/documents').attach('file', data, { filename: name, contentType: type })

describe('POST /documents (upload)', () => {
  it('requires login', async () => {
    const res = await request(app)
      .post('/api/v1/documents')
      .attach('file', pdf(), { filename: 'a.pdf', contentType: 'application/pdf' })
    expect(res.status).toBe(401)
  })

  it('stores a valid PDF and returns a contract-valid DTO', async () => {
    const agent = await authedAgent()
    const res = await upload(agent, 'Q3 Report.pdf')
    expect(res.status).toBe(201)
    expect(documentDtoSchema.safeParse(res.body.data).success).toBe(true)
    expect(res.body.data).toMatchObject({ name: 'Q3 Report.pdf', status: 'queued', pages: null })
    expect(res.body.data).not.toHaveProperty('storageKey')
    expect(res.body.data).not.toHaveProperty('userId')
  })

  it('rejects a request without a file', async () => {
    const agent = await authedAgent()
    const res = await agent.post('/api/v1/documents')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('FILE_REQUIRED')
  })

  it.each([
    ['text disguised as .pdf', 'fake.pdf', Buffer.from('hello world'), 'application/pdf'],
    ['wrong extension', 'notes.txt', pdf(), 'application/pdf'],
    ['wrong mime type', 'a.pdf', pdf(), 'text/plain'],
    ['empty file', 'empty.pdf', Buffer.alloc(0), 'application/pdf'],
  ])('rejects %s', async (_label, name, data, type) => {
    const agent = await authedAgent()
    const res = await upload(agent, name, data, type)
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE')
  })

  it('rejects files over the size limit (test limit = 1 MB)', async () => {
    const agent = await authedAgent()
    const big = Buffer.concat([pdf(), Buffer.alloc(1024 * 1024)])
    const res = await upload(agent, 'big.pdf', big)
    expect(res.status).toBe(413)
    expect(res.body.error.code).toBe('FILE_TOO_LARGE')
  })

  it('rejects a wrongly named form field', async () => {
    const agent = await authedAgent()
    const res = await agent
      .post('/api/v1/documents')
      .attach('document', pdf(), { filename: 'a.pdf', contentType: 'application/pdf' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('FILE_REQUIRED')
  })

  it('never trusts path parts in the filename', async () => {
    const agent = await authedAgent()
    const res = await upload(agent, '../../etc/evil.pdf')
    expect(res.status).toBe(201)
    expect(res.body.data.name).toBe('evil.pdf')
  })
})

describe('ownership', () => {
  it("keeps one user's documents invisible to another", async () => {
    const alice = await authedAgent()
    const bob = await authedAgent()
    const created = await upload(alice, 'secret.pdf')
    const id = created.body.data.id as string

    expect((await alice.get(`/api/v1/documents/${id}`)).status).toBe(200)

    const bobGet = await bob.get(`/api/v1/documents/${id}`)
    expect(bobGet.status).toBe(404)
    expect(bobGet.body.error.code).toBe('NOT_FOUND')
    expect((await bob.get(`/api/v1/documents/${id}/status`)).status).toBe(404)

    expect((await bob.get('/api/v1/documents')).body.data).toEqual([])
    expect((await bob.get('/api/v1/documents/summary')).body.data.total).toBe(0)

    expect((await bob.delete(`/api/v1/documents/${id}`)).status).toBe(404)
    expect((await alice.get(`/api/v1/documents/${id}`)).status).toBe(200)
  })
})

describe('list, summary, status, delete', () => {
  it('paginates, filters and sorts', async () => {
    const agent = await authedAgent()
    for (const name of ['b-invoice.pdf', 'a-contract.pdf', 'c-invoice.pdf']) await upload(agent, name)

    const page1 = await agent.get('/api/v1/documents?pageSize=2&sort=name')
    expect(listResponseSchema.safeParse(page1.body).success).toBe(true)
    expect(page1.body.data.map((d: { name: string }) => d.name)).toEqual([
      'a-contract.pdf',
      'b-invoice.pdf',
    ])
    expect(page1.body.meta).toMatchObject({ total: 3, totalPages: 2, hasNext: true, hasPrev: false })

    const page2 = await agent.get('/api/v1/documents?pageSize=2&sort=name&page=2')
    expect(page2.body.data).toHaveLength(1)

    const search = await agent.get('/api/v1/documents?q=INVOICE')
    expect(search.body.meta.total).toBe(2)

    const none = await agent.get('/api/v1/documents?status=ready')
    expect(none.body.meta).toMatchObject({ total: 0, totalPages: 0 })

    const beyond = await agent.get('/api/v1/documents?page=9')
    expect(beyond.status).toBe(200)
    expect(beyond.body.data).toEqual([])
  })

  it('summarises counts and storage', async () => {
    const agent = await authedAgent()
    const a = pdf('a')
    const b = pdf('bb')
    await upload(agent, 'a.pdf', a)
    await upload(agent, 'b.pdf', b)
    const res = await agent.get('/api/v1/documents/summary')
    expect(res.body.data).toEqual({
      total: 2,
      byStatus: { queued: 2, processing: 0, ready: 0, failed: 0 },
      storageBytes: a.length + b.length,
    })
  })

  it('returns status for an owned document', async () => {
    const agent = await authedAgent()
    const id = (await upload(agent)).body.data.id as string
    const res = await agent.get(`/api/v1/documents/${id}/status`)
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ id, status: 'queued', errorMessage: null })
  })

  it('deletes a document (204) and then 404s', async () => {
    const agent = await authedAgent()
    const id = (await upload(agent)).body.data.id as string
    expect((await agent.delete(`/api/v1/documents/${id}`)).status).toBe(204)
    expect((await agent.get(`/api/v1/documents/${id}`)).status).toBe(404)
    expect((await agent.delete(`/api/v1/documents/${id}`)).status).toBe(404)
  })
})

describe('GET /health/ready', () => {
  it('reports ready', async () => {
    const res = await request(app).get('/api/v1/health/ready')
    expect(res.status).toBe(200)
    expect(res.body.checks.database).toBe('ok')
  })
})

describe('sanitizeFileName', () => {
  it.each([
    ['report.pdf', 'report.pdf'],
    ['../../etc/passwd.pdf', 'passwd.pdf'],
    ['C:\\Users\\me\\cv.pdf', 'cv.pdf'],
    ['bad<name>?.pdf', 'bad_name__.pdf'],
    ['', 'document.pdf'],
    ['   ', 'document.pdf'],
  ])('%j -> %j', (input, expected) => {
    expect(sanitizeFileName(input)).toBe(expected)
  })

  it('keeps the extension when truncating long names', () => {
    const out = sanitizeFileName('x'.repeat(400) + '.pdf')
    expect(out).toHaveLength(255)
    expect(out.endsWith('.pdf')).toBe(true)
  })
})

describe('LocalDiskStorage', () => {
  it('saves, removes and refuses path traversal', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'documind-'))
    try {
      const store = new LocalDiskStorage(dir)
      await store.save('user1/a.pdf', Buffer.from('data'))
      expect((await readFile(path.join(dir, 'user1', 'a.pdf'))).toString()).toBe('data')

      await expect(store.save('user1/a.pdf', Buffer.from('x'))).rejects.toThrow()
      await expect(store.save('../escape.pdf', Buffer.from('x'))).rejects.toThrow('Invalid storage key')

      await store.remove('user1/a.pdf')
      await expect(readFile(path.join(dir, 'user1', 'a.pdf'))).rejects.toThrow()
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
