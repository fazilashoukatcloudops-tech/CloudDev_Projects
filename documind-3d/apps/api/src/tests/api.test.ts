import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../app'
import { authedAgent } from './helpers'

describe('GET /api/v1/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/v1/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.service).toBe('documind-api')
    expect(res.headers['x-request-id']).toBeTruthy()
  })
})

describe('error handling', () => {
  it('returns standard 404 error for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nothing')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad json')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_JSON')
  })
})

describe('auth validation', () => {
  it('rejects invalid registration data', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'A', email: 'not-an-email', password: '123' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.details).toHaveProperty('email')
    expect(res.body.error.details).toHaveProperty('password')
  })
})

describe('documents routes (planned)', () => {
  it('GET /documents is planned (501) for a logged-in user', async () => {
    const agent = await authedAgent()
    const res = await agent.get('/api/v1/documents')
    expect(res.status).toBe(501)
  })

  it('validates question body', async () => {
    const agent = await authedAgent()
    const res = await agent.post('/api/v1/documents/abc/questions').send({ question: '' })
    expect(res.status).toBe(400)
  })
})
