import { PrismaClient } from '@prisma/client'
import { env } from '../config/env'

let client: PrismaClient | undefined

export function getPrisma(): PrismaClient {
  client ??= new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
  return client
}

export async function disconnectPrisma(): Promise<void> {
  await client?.$disconnect()
  client = undefined
}
