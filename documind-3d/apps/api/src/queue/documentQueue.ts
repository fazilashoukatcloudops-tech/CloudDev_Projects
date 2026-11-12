export type EnqueueOptions = { retry?: boolean }

export interface DocumentQueue {
  enqueue(documentId: string, options?: EnqueueOptions): Promise<void>
  ping(): Promise<void>
  close(): Promise<void>
}

export class MemoryDocumentQueue implements DocumentQueue {
  jobs: { documentId: string; retry: boolean }[] = []
  async enqueue(documentId: string, options: EnqueueOptions = {}) {
    this.jobs.push({ documentId, retry: options.retry ?? false })
  }
  async ping() {}
  async close() {}
  reset() { this.jobs = [] }
}
