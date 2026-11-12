import type { Request, Response } from 'express'
import { storage } from '../lib/storage'
import { documentQueue } from '../queue'
import { checkDatabase } from '../repositories'

export function getHealth(_req: Request, res: Response) {
  res.json({ status: 'ok', service: 'documind-api', timestamp: new Date().toISOString() })
}

export async function getReadiness(_req: Request, res: Response) {
  const [db, store, queue] = await Promise.allSettled([
    checkDatabase(),
    Promise.resolve(storage.ping?.()),
    documentQueue.ping(),
  ])

  if (db.status === 'rejected') console.error('Readiness: database check failed', db.reason)
  if (store.status === 'rejected') console.error('Readiness: storage check failed', store.reason)
  if (queue.status === 'rejected') console.error('Readiness: queue check failed', queue.reason)

  const ok = [db, store, queue].every((r) => r.status === 'fulfilled')
  const label = (r: PromiseSettledResult<unknown>) => (r.status === 'fulfilled' ? 'ok' : 'down')

  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'unavailable',
    checks: { database: label(db), storage: label(store), queue: label(queue) },
  })
}
