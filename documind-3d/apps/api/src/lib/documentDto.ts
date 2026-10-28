import type { DocumentRecord } from '../repositories/documentRepository'

export function toDocumentDto(d: DocumentRecord) {
  return {
    id: d.id,
    name: d.name,
    sizeBytes: d.sizeBytes,
    pages: d.pages,
    status: d.status,
    errorMessage: d.errorMessage,
    uploadedAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }
}
