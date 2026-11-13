import { tokenize } from './embeddings'

export type Scored<T> = { item: T; score: number }

export function dot(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < Math.min(a.length, b.length); i++) sum += a[i] * b[i]
  return sum
}

export function rankBySimilarity<T extends { embedding: number[] }>(query: number[], items: T[], topK: number): Scored<T>[] {
  return items
    .map((item) => ({ item, score: dot(query, item.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

export const KEYWORD_MIN_SCORE = 0.3

export function rankByKeywords<T extends { content: string }>(question: string, items: T[], topK: number): Scored<T>[] {
  const wanted = [...new Set(tokenize(question))]
  if (wanted.length === 0) return []
  return items
    .map((item) => {
      const have = [...new Set(tokenize(item.content))]
      let matches = 0
      for (const w of wanted) {
        if (have.some((h) => h.includes(w) || w.includes(h))) {
          matches++
        }
      }
      return { item, score: matches / wanted.length }
    })
    .filter((r) => r.score >= KEYWORD_MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}
