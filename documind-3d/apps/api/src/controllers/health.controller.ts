import type { Request, Response } from 'express'
import { storage } from '../lib/storage'
import { checkDatabase } from '../repositories'

export function getHealth(_req: Request, res: Response) {
  res.json({
    status: 'ok',
    service: 'documind-api',
    timestamp: new Date().toISOString(),
  })
}

export async function getReadiness(_req: Request, res: Response) {
  const [db, store] = await Promise.allSettled([
    checkDatabase(),
    Promise.resolve(storage.ping?.()),
  ])

  if (db.status === 'rejected') console.error('Readiness: database check failed', db.reason)
  if (store.status === 'rejected') console.error('Readiness: storage check failed', store.reason)

  const ok = db.status === 'fulfilled' && store.status === 'fulfilled'
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'unavailable',
    checks: {
      database: db.status === 'fulfilled' ? 'ok' : 'down',
      storage: store.status === 'fulfilled' ? 'ok' : 'down',
    },
  })
}
