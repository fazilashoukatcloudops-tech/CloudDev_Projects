import type { ChunkRecord, ChunkRepository } from '../repositories/chunkRepository'
import type { EmbeddingProvider } from './embeddings'
import type { AnswerGenerator } from './llm'
import { rankByKeywords, rankBySimilarity, type Scored } from './retrieval'

export type Source = { n: number; chunkId: string; page: number; snippet: string; score: number }
export type AnswerResult = { answer: string; sources: Source[]; mode: 'llm' | 'extractive' | 'not_found'; retrieval: 'semantic' | 'keyword'; notice?: string }
export type RagDeps = { chunks: ChunkRepository; embedder: EmbeddingProvider; generator: AnswerGenerator | null; topK: number }

const snippet = (text: string, max = 300) => (text.length <= max ? text : text.slice(0, max).trimEnd() + '?')
const round = (n: number) => Math.round(n * 1000) / 1000

export async function answerQuestion(input: { userId: string; documentId: string; question: string }, deps: RagDeps): Promise<AnswerResult> {
  const all = await deps.chunks.listForDocument(input.userId, input.documentId)
  const usable = all.filter((c) => c.embeddingModel === deps.embedder.model && c.embedding.length > 0)

  let retrieval: AnswerResult['retrieval'] = 'semantic'
  let ranked: Scored<ChunkRecord>[] = []

  if (usable.length > 0) {
    try {
      const [queryVector] = await deps.embedder.embed([input.question])
      ranked = rankBySimilarity(queryVector, usable, deps.topK).filter((r) => r.score >= deps.embedder.minScore)
    } catch (err) {
      console.error('Query embedding failed, using keyword search:', err instanceof Error ? err.message : err)
      retrieval = 'keyword'
    }
  } else {
    retrieval = 'keyword'
  }
  if (retrieval === 'keyword') ranked = rankByKeywords(input.question, all, deps.topK)

  if (ranked.length === 0) return { answer: 'Is document mein is sawal ka jawab nahi mila.', sources: [], mode: 'not_found', retrieval }

  const sources: Source[] = ranked.map((r, i) => ({ n: i + 1, chunkId: r.item.id, page: r.item.pageStart, snippet: snippet(r.item.content), score: round(r.score) }))

  let notice: string
  if (deps.generator) {
    try {
      const answer = await deps.generator.generate(input.question, ranked.map((r, i) => ({ n: i + 1, page: r.item.pageStart, text: r.item.content })))
      return { answer, sources, mode: 'llm', retrieval }
    } catch (err) {
      console.error('LLM failed, extractive fallback:', err instanceof Error ? err.message : err)
      notice = 'AI service abhi available nahi. Document ke sabse relevant hisse dikha rahe hain.'
    }
  } else {
    notice = 'AI answer generator configure nahi hai. Document ke sabse relevant hisse dikha rahe hain.'
  }

  const answer = sources.slice(0, 3).map((s) => `[${s.n}] (page ${s.page}) ${s.snippet}`).join('\n\n')
  return { answer, sources, mode: 'extractive', retrieval, notice }
}
