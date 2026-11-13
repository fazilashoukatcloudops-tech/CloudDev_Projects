import type { DocumentListQuery, DocumentSummary, Paginated } from '../types/api'
import type { DocumentItem } from '../types/document'
import { ApiError, BASE_URL, notifyUnauthorized, request } from './api'

export function listDocuments(query: DocumentListQuery) {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    sort: query.sort,
  })
  if (query.status) params.set('status', query.status)
  if (query.q) params.set('q', query.q)
  return request<Paginated<DocumentItem>>(`/documents?${params}`)
}

export const getSummary = () =>
  request<{ data: DocumentSummary }>('/documents/summary').then((r) => r.data)

export const deleteDocument = (id: string) =>
  request<void>(`/documents/${id}`, { method: 'DELETE' })

type ErrorBody = { error?: { code?: string; message?: string; details?: unknown } }

export function uploadDocument(
  file: File,
  onProgress: (percent: number) => void,
): Promise<DocumentItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${BASE_URL}/documents`)
    xhr.withCredentials = true

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }

    xhr.onload = () => {
      let body: unknown = null
      try {
        body = JSON.parse(xhr.responseText)
      } catch {}

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve((body as { data: DocumentItem }).data)
        return
      }
      if (xhr.status === 401) notifyUnauthorized()
      const e = (body as ErrorBody | null)?.error
      reject(
        new ApiError(
          xhr.status,
          e?.code ?? 'UNKNOWN',
          e?.message ?? `Upload fail hui (${xhr.status})`,
          e?.details,
        ),
      )
    }

    xhr.onerror = () =>
      reject(new ApiError(0, 'NETWORK_ERROR', 'Server se connection nahi ho saka'))

    const form = new FormData()
    form.append('file', file)
    xhr.send(form)
  })
}

export const getDocument = (id: string) =>
  request<{ data: DocumentItem }>(`/documents/${id}`).then((r) => r.data)

export type DocumentPreview = { previewText: string; pages: number | null; chunkCount: number; textChars: number }
export const getDocumentPreview = (id: string) =>
  request<{ data: DocumentPreview }>(`/documents/${id}/preview`).then((r) => r.data)

export type AskSource = { n: number; chunkId: string; page: number; snippet: string; score: number }
export type AskResult = {
  answer: string
  sources: AskSource[]
  mode: 'llm' | 'extractive' | 'not_found'
  retrieval: 'semantic' | 'keyword'
  notice?: string
}
export const askQuestion = (id: string, question: string) =>
  request<{ data: AskResult }>(`/documents/${id}/questions`, { method: 'POST', body: JSON.stringify({ question }) }).then((r) => r.data)

export type GraphData = {
  nodes: DocumentItem[]
  edges: { source: string; target: string; weight: number }[]
  meta: { total: number; limit: number; truncated: boolean }
}
export const getGraph = () =>
  request<{ data: Pick<GraphData, 'nodes' | 'edges'>; meta: GraphData['meta'] }>('/documents/graph').then(
    (r): GraphData => ({ ...r.data, meta: r.meta }),
  )
