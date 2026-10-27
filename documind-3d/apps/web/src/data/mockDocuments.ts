import type { DocumentItem } from '../types/document'

export const MOCK_DOCUMENTS: DocumentItem[] = [
  { id: '1', name: 'Q3-Financial-Report.pdf', sizeBytes: 2_480_000, pages: 42, status: 'ready', uploadedAt: '2026-10-20T10:00:00Z' },
  { id: '2', name: 'Employment-Contract.pdf', sizeBytes: 640_000, pages: 12, status: 'ready', uploadedAt: '2026-10-21T09:30:00Z' },
  { id: '3', name: 'Research-Paper-AI.pdf', sizeBytes: 5_120_000, pages: 28, status: 'processing', uploadedAt: '2026-10-25T14:15:00Z' },
  { id: '4', name: 'Product-Spec-v2.pdf', sizeBytes: 1_350_000, pages: 19, status: 'queued', uploadedAt: '2026-10-26T08:00:00Z' },
  { id: '5', name: 'Scanned-Invoice.pdf', sizeBytes: 8_900_000, pages: null, status: 'failed', uploadedAt: '2026-10-26T11:45:00Z' },
  { id: '6', name: 'Meeting-Notes-Oct.pdf', sizeBytes: 310_000, pages: 6, status: 'ready', uploadedAt: '2026-10-27T07:20:00Z' },
]