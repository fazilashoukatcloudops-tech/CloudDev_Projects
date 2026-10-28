import type { RequestHandler } from 'express'
import multer from 'multer'
import { MAX_UPLOAD_BYTES } from '../lib/files'
import { AppError } from './errorHandler'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 5 },
})

export const receivePdf: RequestHandler = (req, res, next) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (!err) return next()

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new AppError(
            413,
            `File ${MAX_UPLOAD_BYTES / 1024 / 1024} MB se choti honi chahiye`,
            'FILE_TOO_LARGE',
          ),
        )
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new AppError(400, 'File ka field name "file" hona chahiye', 'FILE_REQUIRED'))
      }
      return next(new AppError(400, 'Upload request galat hai', 'UPLOAD_ERROR'))
    }
    next(err)
  })
}
