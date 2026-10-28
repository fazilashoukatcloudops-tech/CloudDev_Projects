import request from 'supertest'
import { app } from '../app'

let counter = 0

export async function authedAgent() {
  const agent = request.agent(app)
  const email = `user${Date.now()}_${counter++}@example.com`
  const res = await agent
    .post('/api/v1/auth/register')
    .send({ name: 'Test User', email, password: 'StrongPass123' })
  if (res.status !== 201) throw new Error(`Test user register failed: ${res.status}`)
  return agent
}
