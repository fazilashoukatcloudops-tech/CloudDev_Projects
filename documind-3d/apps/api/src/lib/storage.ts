import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { env } from '../config/env'

export interface FileStorage {
  save(key: string, data: Buffer): Promise<void>
  remove(key: string): Promise<void>
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

  async remove(key: string) {
    await rm(this.resolve(key), { force: true })
  }
}

export class MemoryStorage implements FileStorage {
  private files = new Map<string, Buffer>()

  async save(key: string, data: Buffer) {
    this.files.set(key, data)
  }

  async remove(key: string) {
    this.files.delete(key)
  }

  has(key: string) {
    return this.files.has(key)
  }
}

export const storage: FileStorage =
  env.STORAGE_DRIVER === 'memory' ? new MemoryStorage() : new LocalDiskStorage(env.UPLOAD_DIR)
