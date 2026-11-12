import { UnrecoverableError } from 'bullmq'
import type { DocumentRepository } from '../repositories/documentRepository'

export class PermanentJobError extends UnrecoverableError {
  constructor(public readonly userMessage: string) { super(userMessage) }
}

const GENERIC_MESSAGE = 'Document process nahi ho saka. "Retry processing" dabao ya thori der baad try karo.'

export const userMessageFor = (err: Error) => err instanceof PermanentJobError ? err.userMessage : GENERIC_MESSAGE

export function isFinalFailure(err: Error, attemptsMade: number, maxAttempts: number): boolean {
  return err instanceof UnrecoverableError || /stalled/i.test(err.message) || attemptsMade >= maxAttempts
}

export type FailureOutcome = 'failed' | 'requeued' | 'ignored'

export async function recordFailure(
  documents: DocumentRepository,
  documentId: string,
  err: Error,
  attemptsMade: number,
  maxAttempts: number,
): Promise<FailureOutcome> {
  if (isFinalFailure(err, attemptsMade, maxAttempts)) {
    return (await documents.markFailed(documentId, userMessageFor(err))) ? 'failed' : 'ignored'
  }
  return (await documents.markQueued(documentId)) ? 'requeued' : 'ignored'
}
