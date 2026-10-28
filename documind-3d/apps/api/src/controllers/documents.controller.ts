import { randomUUID } from 'node:crypto'
import type { Request, Response } from 'express'
import { toDocumentDto } from '../lib/documentDto'
import { looksLikePdf, sanitizeFileName, sha256 } from '../lib/files'
import { buildPaginationMeta } from '../lib/pagination'
import { storage } from '../lib/storage'
import { getAuthUser } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { documentRepository } from '../repositories'
import type { ListDocumentsQuery } from '../validation'

const notFound = () => new AppError(404, 'Document nahi mila', 'NOT_FOUND')

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

  await storage.save(storageKey, file.buffer)
  try {
    const record = await documentRepository.create({
      id,
      userId: user.id,
      name,
      mimeType: 'application/pdf',
      sizeBytes: file.size,
      storageKey,
      checksumSha256: sha256(file.buffer),
    })
    res.status(201).json({ data: toDocumentDto(record) })
  } catch (err) {
    await storage.remove(storageKey).catch(() => undefined)
    throw err
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
