import type { PrismaClient } from '@prisma/client'
import type { ChunkRepository, NewChunk } from './chunkRepository'

export class PrismaChunkRepository implements ChunkRepository {
  constructor(private readonly db: PrismaClient) {}
  async replaceForDocument(doc: { id: string; userId: string }, chunks: NewChunk[]) {
    await this.db.$transaction([
      this.db.documentChunk.deleteMany({ where: { documentId: doc.id } }),
      this.db.documentChunk.createMany({ data: chunks.map((c) => ({ ...c, documentId: doc.id, userId: doc.userId })) }),
    ])
  }
  listForDocument(userId: string, documentId: string) {
    return this.db.documentChunk.findMany({ where: { userId, documentId }, orderBy: { chunkIndex: 'asc' } })
  }
}
