import { MOCK_DOCUMENTS } from '../data/mockDocuments'
import type { DocumentItem } from '../types/document'
import type {
  DocumentListQuery,
  DocumentSummary,
  Paginated,
  PaginationMeta,
} from '../types/api'

// Day 12 par yeh poori file real API calls (services/api.ts) se replace hogi.
// Function signatures aur response shape wahi rahengi.

let store: DocumentItem[] = [...MOCK_DOCUMENTS]

const delay = (ms = 500) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function visible(scenario: string | null): DocumentItem[] {
  // ?state=empty: sirf naye upload kiye hue documents nazar aate hain
  if (scenario === 'empty') return store.filter((d) => d.id.startsWith('upload-'))
  return store
}

function buildMeta(total: number, page: number, pageSize: number): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  return { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
}

export async function listDocuments(
  query: DocumentListQuery,
  scenario: string | null,
): Promise<Paginated<DocumentItem>> {
  await delay()
  if (scenario === 'error') throw new Error('Documents load nahi ho sake (mock error).')

  const needle = query.q?.toLowerCase()
  let items = visible(scenario).filter(
    (d) =>
      (!query.status || d.status === query.status) &&
      (!needle || d.name.toLowerCase().includes(needle)),
  )

  items = [...items].sort((a, b) => {
    switch (query.sort) {
      case 'oldest':
        return a.uploadedAt.localeCompare(b.uploadedAt)
      case 'name':
        return a.name.localeCompare(b.name)
      case 'size':
        return b.sizeBytes - a.sizeBytes
      default:
        return b.uploadedAt.localeCompare(a.uploadedAt)
    }
  })

  const start = (query.page - 1) * query.pageSize
  return {
    data: items.slice(start, start + query.pageSize),
    meta: buildMeta(items.length, query.page, query.pageSize),
  }
}

export async function getSummary(scenario: string | null): Promise<DocumentSummary> {
  await delay(300)
  if (scenario === 'error') throw new Error('Summary load nahi ho saki (mock error).')

  const items = visible(scenario)
  const byStatus = { queued: 0, processing: 0, ready: 0, failed: 0 }
  let storageBytes = 0
  for (const d of items) {
    byStatus[d.status] += 1
    storageBytes += d.sizeBytes
  }
  return { total: items.length, byStatus, storageBytes }
}

function patch(id: string, changes: Partial<DocumentItem>) {
  store = store.map((d) =>
    d.id === id ? { ...d, ...changes, updatedAt: new Date().toISOString() } : d,
  )
}

export async function createMockDocument(file: File): Promise<DocumentItem> {
  await delay(300)
  const now = new Date().toISOString()
  const created: DocumentItem = {
    id: `upload-${Date.now()}`,
    name: file.name,
    sizeBytes: file.size,
    pages: null,
    status: 'queued',
    errorMessage: null,
    uploadedAt: now,
    updatedAt: now,
  }
  store = [created, ...store]

  // Day 9 ke worker ki simulation: queued -> processing -> ready
  setTimeout(() => patch(created.id, { status: 'processing' }), 3000)
  setTimeout(
    () => patch(created.id, { status: 'ready', pages: 5 + Math.floor(Math.random() * 40) }),
    8000,
  )
  return created
}

export async function deleteMockDocument(id: string): Promise<void> {
  await delay(400)
  store = store.filter((d) => d.id !== id)
}
