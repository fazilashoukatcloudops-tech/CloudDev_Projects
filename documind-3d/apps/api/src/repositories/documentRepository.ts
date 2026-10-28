import type { DocumentSort } from '../validation'

export type DocumentStatus = 'queued' | 'processing' | 'ready' | 'failed'

export type DocumentRecord = {
  id: string
  userId: string
  name: string
  mimeType: string
  sizeBytes: number
  storageKey: string
  checksumSha256: string
  pages: number | null
  status: DocumentStatus
  errorMessage: string | null
  createdAt: Date
  updatedAt: Date
}

export type NewDocument = Pick<
  DocumentRecord,
  'id' | 'userId' | 'name' | 'mimeType' | 'sizeBytes' | 'storageKey' | 'checksumSha256'
>

export type ListParams = {
  userId: string
  page: number
  pageSize: number
  status?: DocumentStatus
  q?: string
  sort: DocumentSort
}

export type DocumentSummary = {
  total: number
  byStatus: Record<DocumentStatus, number>
  storageBytes: number
}

export interface DocumentRepository {
  create(input: NewDocument): Promise<DocumentRecord>
  findOwned(userId: string, id: string): Promise<DocumentRecord | null>
  list(params: ListParams): Promise<{ items: DocumentRecord[]; total: number }>
  summary(userId: string): Promise<DocumentSummary>
  deleteOwned(userId: string, id: string): Promise<DocumentRecord | null>
}

type Comparator = (a: DocumentRecord, b: DocumentRecord) => number

const COMPARATORS: Record<DocumentSort, Comparator> = {
  newest: (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id),
  oldest: (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
  name: (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  size: (a, b) => b.sizeBytes - a.sizeBytes || b.id.localeCompare(a.id),
}

export class InMemoryDocumentRepository implements DocumentRepository {
  private docs = new Map<string, DocumentRecord>()

  async create(input: NewDocument) {
    const now = new Date()
    const record: DocumentRecord = {
      ...input,
      pages: null,
      status: 'queued',
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    }
    this.docs.set(record.id, record)
    return record
  }

  async findOwned(userId: string, id: string) {
    const doc = this.docs.get(id)
    return doc && doc.userId === userId ? doc : null
  }

  async list(p: ListParams) {
    const needle = p.q?.toLowerCase()
    const items = [...this.docs.values()]
      .filter(
        (d) =>
          d.userId === p.userId &&
          (!p.status || d.status === p.status) &&
          (!needle || d.name.toLowerCase().includes(needle)),
      )
      .sort(COMPARATORS[p.sort])
    const start = (p.page - 1) * p.pageSize
    return { items: items.slice(start, start + p.pageSize), total: items.length }
  }

  async summary(userId: string) {
    const byStatus: Record<DocumentStatus, number> = {
      queued: 0,
      processing: 0,
      ready: 0,
      failed: 0,
    }
    let total = 0
    let storageBytes = 0
    for (const d of this.docs.values()) {
      if (d.userId !== userId) continue
      byStatus[d.status] += 1
      total += 1
      storageBytes += d.sizeBytes
    }
    return { total, byStatus, storageBytes }
  }

  async deleteOwned(userId: string, id: string) {
    const doc = await this.findOwned(userId, id)
    if (!doc) return null
    this.docs.delete(id)
    return doc
  }

  clear() {
    this.docs.clear()
  }
}
