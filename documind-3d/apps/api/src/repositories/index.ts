import { env } from '../config/env'
import { disconnectPrisma, getPrisma } from '../lib/prisma'
import { InMemoryDocumentRepository, type DocumentRepository } from './documentRepository'
import { PrismaDocumentRepository } from './prismaDocumentRepository'
import { PrismaUserRepository } from './prismaUserRepository'
import { InMemoryUserRepository, type UserRepository } from './userRepository'
import { InMemoryChunkRepository, type ChunkRepository } from './chunkRepository'
import { PrismaChunkRepository } from './prismaChunkRepository'

const useMemory = env.DATA_STORE === 'memory'
const memoryUsers = new InMemoryUserRepository()
const memoryDocuments = new InMemoryDocumentRepository()
const memoryChunks = new InMemoryChunkRepository()

export const userRepository: UserRepository = useMemory ? memoryUsers : new PrismaUserRepository(getPrisma())
export const documentRepository: DocumentRepository = useMemory ? memoryDocuments : new PrismaDocumentRepository(getPrisma())
export const chunkRepository: ChunkRepository = useMemory ? memoryChunks : new PrismaChunkRepository(getPrisma())

export function resetStores() {
  if (!useMemory) throw new Error('resetStores sirf DATA_STORE=memory par allowed hai')
  memoryUsers.clear(); memoryDocuments.clear(); memoryChunks.clear()
}
export async function checkDatabase(): Promise<void> {
  if (useMemory) return
  await getPrisma().$queryRaw`SELECT 1`
}
export const closeStores = disconnectPrisma
