import { randomUUID } from 'node:crypto'
export type NewChunk = { chunkIndex: number; pageStart: number; pageEnd: number; content: string; embedding?: number[]; embeddingModel?: string }
export type ChunkRecord = Omit<NewChunk, 'embedding'|'embeddingModel'> & { id: string; documentId: string; userId: string; embedding: number[]; embeddingModel: string | null }

export interface ChunkRepository {
  replaceForDocument(doc: { id: string; userId: string }, chunks: NewChunk[]): Promise<void>
  listForDocument(userId: string, documentId: string): Promise<ChunkRecord[]>
}

export class InMemoryChunkRepository implements ChunkRepository {
  private byDoc = new Map<string, ChunkRecord[]>()
  async replaceForDocument(doc: { id: string; userId: string }, chunks: NewChunk[]) {
    this.byDoc.set(doc.id, chunks.map((c) => ({ ...c, embedding: c.embedding ?? [], embeddingModel: c.embeddingModel ?? null, id: randomUUID(), documentId: doc.id, userId: doc.userId })))
  }
  async listForDocument(userId: string, documentId: string) {
    return (this.byDoc.get(documentId) ?? []).filter((c) => c.userId === userId)
  }
  clear() { this.byDoc.clear() }
}
