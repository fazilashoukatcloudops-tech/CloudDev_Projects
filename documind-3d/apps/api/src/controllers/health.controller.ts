import type { Request, Response } from 'express'
import { checkDatabase } from '../repositories'

export function getHealth(_req: Request, res: Response) {
  res.json({
    status: 'ok',
    service: 'documind-api',
    timestamp: new Date().toISOString(),
  })
}

export async function getReadiness(_req: Request, res: Response) {
  try {
    await checkDatabase()
    res.json({ status: 'ok', checks: { database: 'ok' } })
  } catch {
    res.status(503).json({ status: 'unavailable', checks: { database: 'down' } })
  }
}
