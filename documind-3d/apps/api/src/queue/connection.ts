import type { ConnectionOptions } from 'bullmq'

type Overrides = { maxRetriesPerRequest?: number | null; enableOfflineQueue?: boolean }

export function redisConnection(url: string, overrides: Overrides = {}): ConnectionOptions {
  const u = new URL(url)
  const db = u.pathname.length > 1 ? Number(u.pathname.slice(1)) : undefined
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 6379,
    username: u.username ? decodeURIComponent(u.username) : undefined,
    password: u.password ? decodeURIComponent(u.password) : undefined,
    db: Number.isInteger(db) ? db : undefined,
    tls: u.protocol === 'rediss:' ? {} : undefined,
    ...overrides,
  }
}
