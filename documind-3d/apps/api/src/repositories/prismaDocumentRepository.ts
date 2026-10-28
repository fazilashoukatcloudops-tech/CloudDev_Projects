import {
  Prisma,
  type DocumentStatus as DbStatus,
  type Document as DocumentRow,
  type PrismaClient,
} from '@prisma/client'
import type { DocumentSort } from '../validation'
import type {
  DocumentRecord,
  DocumentRepository,
  DocumentStatus,
  DocumentSummary,
  ListParams,
  NewDocument,
} from './documentRepository'

const toDb = (s: DocumentStatus) => s.toUpperCase() as DbStatus
const toStatus = (s: DbStatus) => s.toLowerCase() as DocumentStatus
const toRecord = (row: DocumentRow): DocumentRecord => ({ ...row, status: toStatus(row.status) })

const ORDER: Record<DocumentSort, Prisma.DocumentOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }, { id: 'desc' }],
  oldest: [{ createdAt: 'asc' }, { id: 'asc' }],
  name: [{ name: 'asc' }, { id: 'asc' }],
  size: [{ sizeBytes: 'desc' }, { id: 'desc' }],
}

export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: NewDocument) {
    return toRecord(await this.db.document.create({ data: input }))
  }

  async findOwned(userId: string, id: string) {
    const row = await this.db.document.findFirst({ where: { id, userId } })
    return row ? toRecord(row) : null
  }

  async list(p: ListParams) {
    const where: Prisma.DocumentWhereInput = {
      userId: p.userId,
      ...(p.status ? { status: toDb(p.status) } : {}),
      ...(p.q ? { name: { contains: p.q, mode: 'insensitive' } } : {}),
    }
    const [rows, total] = await this.db.$transaction([
      this.db.document.findMany({
        where,
        orderBy: ORDER[p.sort],
        skip: (p.page - 1) * p.pageSize,
        take: p.pageSize,
      }),
      this.db.document.count({ where }),
    ])
    return { items: rows.map(toRecord), total }
  }

  async summary(userId: string) {
    const groups = await this.db.document.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
      _sum: { sizeBytes: true },
    })
    const result: DocumentSummary = {
      total: 0,
      byStatus: { queued: 0, processing: 0, ready: 0, failed: 0 },
      storageBytes: 0,
    }
    for (const g of groups) {
      result.byStatus[toStatus(g.status)] = g._count._all
      result.total += g._count._all
      result.storageBytes += g._sum.sizeBytes ?? 0
    }
    return result
  }

  async deleteOwned(userId: string, id: string) {
    const row = await this.db.document.findFirst({ where: { id, userId } })
    if (!row) return null
    await this.db.document.delete({ where: { id } })
    return toRecord(row)
  }
}
