import type { DocumentStatus } from './document'

export type DocumentSort = 'newest' | 'oldest' | 'name' | 'size'

export type DocumentListQuery = {
  page: number
  pageSize: number
  status?: DocumentStatus
  q?: string
  sort: DocumentSort
}

export type PaginationMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type Paginated<T> = { data: T[]; meta: PaginationMeta }

export type DocumentSummary = {
  total: number
  byStatus: Record<DocumentStatus, number>
  storageBytes: number
}