import { beforeEach, describe, expect, it } from 'vitest'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import { app } from '../app'
import { env } from '../config/env'
import { SESSION_COOKIE } from '../lib/cookies'
import { userRepository } from '../repositories/userRepository'

const creds = { name: 'Ali Khan', email: 'ali@example.com', password: 'StrongPass123' }
const cookiesOf = (res: request.Response) =>
  ([] as string[]).concat(res.headers['set-cookie'] ?? [])

beforeEach(() => userRepository.clear())

describe('POST /auth/register', () => {
  it('creates a user, sets a secure session cookie, hides the hash', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(creds)
    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({ name: 'Ali Khan', email: 'ali@example.com' })
    expect(JSON.stringify(res.body)).not.toContain('passwordHash')

    const cookie = cookiesOf(res).find((c) => c.startsWith(`${SESSION_COOKIE}=`))
    expect(cookie).toBeDefined()
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Path=/')
  })

  it('stores a bcrypt hash, never the plain password', async () => {
    await request(app).post('/api/v1/auth/register').send(creds)
    const stored = await userRepository.findByEmail(creds.email)
    expect(stored?.passwordHash).not.toBe(creds.password)
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/)
  })

  it('rejects a duplicate email, case-insensitively', async () => {
    await request(app).post('/api/v1/auth/register').send(creds)
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...creds, email: 'ALI@Example.com' })
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('EMAIL_TAKEN')
  })

  it.each([
    ['short password', { password: '1234567' }],
    ['password over 72 chars', { password: 'a'.repeat(73) }],
    ['bad email', { email: 'nope' }],
    ['short name', { name: 'A' }],
  ])('rejects %s', async (_label, patch) => {
    const res = await request(app).post('/api/v1/auth/register').send({ ...creds, ...patch })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send(creds)
  })

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ALI@example.com', password: creds.password })
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('ali@example.com')
    expect(cookiesOf(res).some((c) => c.startsWith(`${SESSION_COOKIE}=`))).toBe(true)
  })

  it('gives the same error for wrong password and unknown email', async () => {
    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: creds.email, password: 'WrongPass123' })
    const unknownEmail = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'WrongPass123' })

    expect(wrongPassword.status).toBe(401)
    expect(unknownEmail.status).toBe(401)
    expect(wrongPassword.body).toEqual(unknownEmail.body)
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS')
  })
})

describe('session handling', () => {
  it('GET /auth/me needs a session', async () => {
    const res = await request(app).get('/api/v1/auth/me')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('GET /auth/me works after register (cookie kept by the agent)', async () => {
    const agent = request.agent(app)
    await agent.post('/api/v1/auth/register').send(creds)
    const res = await agent.get('/api/v1/auth/me')
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(creds.email)
  })

  it('logout clears the cookie and ends the session', async () => {
    const agent = request.agent(app)
    await agent.post('/api/v1/auth/register').send(creds)

    const out = await agent.post('/api/v1/auth/logout')
    expect(out.status).toBe(204)
    expect(cookiesOf(out).join(';')).toContain('Expires=Thu, 01 Jan 1970')

    expect((await agent.get('/api/v1/auth/me')).status).toBe(401)
  })

  it('rejects a garbage token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', `${SESSION_COOKIE}=not-a-jwt`)
    expect(res.status).toBe(401)
  })

  it('rejects an expired token', async () => {
    const token = jwt.sign(
      { sub: 'someone', exp: Math.floor(Date.now() / 1000) - 60 },
      env.JWT_SECRET,
    )
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', `${SESSION_COOKIE}=${token}`)
    expect(res.status).toBe(401)
  })

  it('rejects a token signed with another secret', async () => {
    const token = jwt.sign({ sub: 'someone' }, 'another-secret-another-secret-123456')
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', `${SESSION_COOKIE}=${token}`)
    expect(res.status).toBe(401)
  })

  it('rejects a valid token whose user no longer exists', async () => {
    const agent = request.agent(app)
    await agent.post('/api/v1/auth/register').send(creds)
    userRepository.clear()
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401)
  })
})

describe('origin check (CSRF defense in depth)', () => {
  it('blocks state-changing requests from a foreign origin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Origin', 'http://evil.example')
      .send(creds)
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN_ORIGIN')
  })

  it('allows the configured origin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Origin', env.CORS_ORIGIN)
      .send(creds)
    expect(res.status).toBe(201)
  })
})

describe('documents are protected', () => {
  it.each([
    ['get', '/api/v1/documents'],
    ['get', '/api/v1/documents/summary'],
    ['get', '/api/v1/documents/graph'],
    ['post', '/api/v1/documents'],
    ['delete', '/api/v1/documents/3f2b8c1e-9a4d-4e6b-8c7a-1d2e3f4a5b6c'],
  ] as const)('%s %s returns 401 without a session', async (method, url) => {
    const res = await request(app)[method](url)
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})
