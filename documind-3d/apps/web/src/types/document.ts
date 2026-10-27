export type DocumentStatus = 'queued' | 'processing' | 'ready' | 'failed'

export type DocumentItem = {
  id: string
  name: string
  sizeBytes: number
  pages: number | null
  status: DocumentStatus
  errorMessage: string | null
  uploadedAt: string
  updatedAt: string
}