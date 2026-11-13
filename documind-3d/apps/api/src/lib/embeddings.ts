import { env } from '../config/env'

export interface EmbeddingProvider {
  readonly model: string
  readonly minScore: number
  readonly edgeMinScore: number
  embed(texts: string[]): Promise<number[][]>
}

const STOP = new Set('the a an is are was were of to in on at for and or but with by from as it this that what which who how when where why do does did be been'.split(' '))

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? []).filter((t) => !STOP.has(t))
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return h >>> 0
}

export class HashEmbedding implements EmbeddingProvider {
  readonly model = 'hash-256-v1'
  readonly minScore = 0.05
  readonly edgeMinScore = 0.1
  private readonly dims = 256
  async embed(texts: string[]) {
    return texts.map((text) => {
      const v = new Array<number>(this.dims).fill(0)
      for (const token of tokenize(text)) {
        const h = fnv1a(token)
        v[h % this.dims] += (h >>> 8) & 1 ? 1 : -1
      }
      const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0))
      return norm === 0 ? v : v.map((x) => x / norm)
    })
  }
}

type Extractor = (texts: string[], opts: object) => Promise<{ tolist(): number[][] }>
type TransformersModule = { pipeline: (task: string, model: string) => Promise<Extractor>; env: { cacheDir: string } }

export class LocalEmbedding implements EmbeddingProvider {
  readonly model = 'Xenova/all-MiniLM-L6-v2'
  readonly minScore = 0.05
  readonly edgeMinScore = 0.15
  private extractor?: Promise<Extractor>
  constructor(private readonly cacheDir: string) {}
  private load(): Promise<Extractor> {
    this.extractor ??= (async () => {
      const mod = (await import('@huggingface/transformers')) as unknown as TransformersModule
      mod.env.cacheDir = this.cacheDir
      return mod.pipeline('feature-extraction', this.model)
    })().catch((err: unknown) => { this.extractor = undefined; throw err })
    return this.extractor
  }
  async embed(texts: string[]) {
    const extractor = await this.load()
    const out: number[][] = []
    for (let i = 0; i < texts.length; i += 16) {
      const result = await extractor(texts.slice(i, i + 16), { pooling: 'mean', normalize: true })
      out.push(...result.tolist())
    }
    return out
  }
}

export const embedder: EmbeddingProvider = env.EMBEDDING_PROVIDER === 'hash' ? new HashEmbedding() : new LocalEmbedding(env.MODEL_CACHE_DIR)
