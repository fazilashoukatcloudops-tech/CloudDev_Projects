import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { env } from '../config/env'
import { S3Storage } from './s3Storage'

export interface FileStorage {
  save(key: string, data: Buffer): Promise<void>
  read(key: string): Promise<Buffer>
  remove(key: string): Promise<void>
  presignedDownloadUrl?(key: string, fileName: string): Promise<string>
  ping?(): Promise<void>
}

export class LocalDiskStorage implements FileStorage {
  private readonly root: string

  constructor(root: string) {
    this.root = path.resolve(root)
  }

  private resolve(key: string) {
    const full = path.resolve(this.root, key)
    if (!full.startsWith(this.root + path.sep)) throw new Error('Invalid storage key')
    return full
  }

  async save(key: string, data: Buffer) {
    const file = this.resolve(key)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, data, { flag: 'wx', mode: 0o600 })
  }

  async read(key: string) {
    return readFile(this.resolve(key))
  }

  async remove(key: string) {
    await rm(this.resolve(key), { force: true })
  }
}

export class MemoryStorage implements FileStorage {
  private files = new Map<string, Buffer>()

  async save(key: string, data: Buffer) {
    this.files.set(key, data)
  }

  async read(key: string) {
    const data = this.files.get(key)
    if (!data) throw new Error(`File not found: ${key}`)
    return data
  }

  async remove(key: string) {
    this.files.delete(key)
  }

  has(key: string) {
    return this.files.has(key)
  }
}

function createStorage(): FileStorage {
  switch (env.STORAGE_DRIVER) {
    case 'memory':
      return new MemoryStorage()
    case 's3': {
      if (!env.S3_BUCKET || !env.AWS_REGION) throw new Error('S3_BUCKET/AWS_REGION missing')
      return new S3Storage({
        bucket: env.S3_BUCKET,
        region: env.AWS_REGION,
        presignExpiresSeconds: env.S3_PRESIGN_EXPIRES_SECONDS,
      })
    }
    default:
      return new LocalDiskStorage(env.UPLOAD_DIR)
  }
}

export const storage: FileStorage = createStorage()
