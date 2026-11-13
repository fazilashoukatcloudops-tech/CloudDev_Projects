import { randomUUID } from 'node:crypto'
import type { Request, Response } from 'express'
import { toDocumentDto } from '../lib/documentDto'
import { attachmentHeader, looksLikePdf, sanitizeFileName, sha256 } from '../lib/files'
import { buildPaginationMeta } from '../lib/pagination'
import { storage } from '../lib/storage'
import { getAuthUser } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { documentQueue } from '../queue'
import { documentRepository, chunkRepository } from '../repositories'
import type { ListDocumentsQuery } from '../validation'
import type { DocumentRecord } from '../repositories/documentRepository'
import { env } from '../config/env'
import { embedder } from '../lib/embeddings'
import { answerGenerator } from '../lib/llm'
import { answerQuestion, type RagDeps } from '../lib/rag'
import { buildGraph, GRAPH_LIMIT } from '../lib/graph'

const notFound = () => new AppError(404, 'Document nahi mila', 'NOT_FOUND')
const QUEUE_DOWN_MESSAGE = 'Processing queue abhi available nahi. File save ho gayi hai, thori der baad "Retry processing" dabao.'

const ragDeps: RagDeps = {
  chunks: chunkRepository,
  embedder,
  generator: answerGenerator,
  topK: env.RAG_TOP_K,
}

export async function listDocuments(_req: Request, res: Response) {
  const user = getAuthUser(res)
  const query = res.locals.query as ListDocumentsQuery
  const { items, total } = await documentRepository.list({ userId: user.id, ...query })
  res.json({
    data: items.map(toDocumentDto),
    meta: buildPaginationMeta(total, query.page, query.pageSize),
  })
}

export async function getSummary(_req: Request, res: Response) {
  const summary = await documentRepository.summary(getAuthUser(res).id)
  res.json({ data: summary })
}

export async function getDocument(_req: Request, res: Response) {
  const { id } = res.locals.params as { id: string }
  const doc = await documentRepository.findOwned(getAuthUser(res).id, id)
  if (!doc) throw notFound()
  res.json({ data: toDocumentDto(doc) })
}

export async function getDocumentStatus(_req: Request, res: Response) {
  const { id } = res.locals.params as { id: string }
  const doc = await documentRepository.findOwned(getAuthUser(res).id, id)
  if (!doc) throw notFound()
  res.json({
    data: {
      id: doc.id,
      status: doc.status,
      errorMessage: doc.errorMessage,
      updatedAt: doc.updatedAt.toISOString(),
    },
  })
}

export async function createDocument(req: Request, res: Response) {
  const user = getAuthUser(res)
  const file = req.file
  if (!file) throw new AppError(400, 'PDF file bhejna zaroori hai (field: file)', 'FILE_REQUIRED')

  const name = sanitizeFileName(file.originalname)
  const hasPdfName = name.toLowerCase().endsWith('.pdf')
  if (file.size === 0) throw new AppError(400, 'File khali hai', 'INVALID_FILE_TYPE')
  if (!hasPdfName || file.mimetype !== 'application/pdf' || !looksLikePdf(file.buffer)) {
    throw new AppError(400, 'Sirf valid PDF files allowed hain', 'INVALID_FILE_TYPE')
  }

  const id = randomUUID()
  const storageKey = `${user.id}/${id}.pdf`

  try {
    await storage.save(storageKey, file.buffer)
  } catch (err) {
    console.error('Storage save failed', err)
    throw new AppError(503, 'File storage abhi available nahi. Thori der baad dobara try karo.', 'STORAGE_UNAVAILABLE')
  }

  let record: DocumentRecord
  try {
    record = await documentRepository.create({
      id,
      userId: user.id,
      name,
      mimeType: 'application/pdf',
      sizeBytes: file.size,
      storageKey,
      checksumSha256: sha256(file.buffer),
    })
  } catch (err) {
    await storage.remove(storageKey).catch(() => undefined)
    throw err
  }

  try {
    await documentQueue.enqueue(record.id)
  } catch (err) {
    console.error(`Enqueue failed for document ${record.id}`, err)
    await documentRepository.markFailed(record.id, QUEUE_DOWN_MESSAGE)
    record = (await documentRepository.findOwned(user.id, record.id)) ?? record
  }

  res.status(201).json({ data: toDocumentDto(record) })
}

export async function retryDocument(_req: Request, res: Response) {
  const user = getAuthUser(res)
  const { id } = res.locals.params as { id: string }

  const requeued = await documentRepository.requeueFailed(user.id, id)
  if (!requeued) {
    const doc = await documentRepository.findOwned(user.id, id)
    if (!doc) throw notFound()
    throw new AppError(409, 'Sirf failed documents dobara process ho sakte hain', 'CONFLICT')
  }

  try {
    await documentQueue.enqueue(id, { retry: true })
  } catch (err) {
    console.error(`Retry enqueue failed for document ${id}`, err)
    await documentRepository.markFailed(id, QUEUE_DOWN_MESSAGE)
    throw new AppError(503, 'Processing queue abhi available nahi.', 'QUEUE_UNAVAILABLE')
  }

  res.status(202).json({ data: toDocumentDto(requeued) })
}

export async function downloadDocument(_req: Request, res: Response) {
  const { id } = res.locals.params as { id: string }
  const doc = await documentRepository.findOwned(getAuthUser(res).id, id)
  if (!doc) throw notFound()

  res.setHeader('Cache-Control', 'no-store')

  try {
    if (storage.presignedDownloadUrl) {
      const url = await storage.presignedDownloadUrl(doc.storageKey, doc.name)
      res.redirect(302, url)
      return
    }
    const data = await storage.read(doc.storageKey)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', attachmentHeader(doc.name))
    res.send(data)
  } catch (err) {
    console.error(`Download failed for document ${doc.id}`, err)
    throw new AppError(503, 'File abhi available nahi.', 'STORAGE_UNAVAILABLE')
  }
}

export async function deleteDocument(_req: Request, res: Response) {
  const { id } = res.locals.params as { id: string }
  const deleted = await documentRepository.deleteOwned(getAuthUser(res).id, id)
  if (!deleted) throw notFound()

  await storage.remove(deleted.storageKey).catch((err: unknown) => {
    console.error(`Storage cleanup failed for ${deleted.storageKey}`, err)
  })
  res.status(204).end()
}

export async function askQuestion(req: Request, res: Response) {
  const user = getAuthUser(res)
  const { id } = res.locals.params as { id: string }
  const { question } = req.body as { question: string }

  const doc = await documentRepository.findOwned(user.id, id)
  if (!doc) throw notFound()
  if (doc.status !== 'ready') {
    throw new AppError(409, 'Document abhi ready nahi. Processing khatam hone par sawal poochho.', 'CONFLICT')
  }

  const result = await answerQuestion({ userId: user.id, documentId: id, question }, ragDeps)
  res.setHeader('Cache-Control', 'no-store')
  res.json({ data: result })
}

export async function getGraph(_req: Request, res: Response) {
  const graph = await buildGraph(getAuthUser(res).id, {
    documents: documentRepository,
    chunks: chunkRepository,
    embedder,
  })
  res.setHeader('Cache-Control', 'no-store')
  res.json({
    data: { nodes: graph.nodes.map(toDocumentDto), edges: graph.edges },
    meta: { total: graph.total, limit: GRAPH_LIMIT, truncated: graph.total > GRAPH_LIMIT },
  })
}

export async function getDocumentPreview(_req: Request, res: Response) {
  const { id } = res.locals.params as { id: string }
  const doc = await documentRepository.findOwned(getAuthUser(res).id, id)
  if (!doc) throw notFound()
  if (doc.status !== 'ready') {
    throw new AppError(409, 'Preview tab milega jab document ready ho', 'CONFLICT')
  }
  res.json({
    data: {
      previewText: doc.previewText ?? '',
      pages: doc.pages,
      chunkCount: doc.chunkCount,
      textChars: doc.textChars,
    },
  })
}
