import 'dotenv/config'
import { z } from 'zod'

const bool = z.enum(['true', 'false']).default('false').transform((v) => v === 'true')

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
  RATE_LIMIT_ENABLED: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET kam az kam 32 characters ka hona chahiye'),
  JWT_EXPIRES_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  COOKIE_SECURE: bool,
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  DATA_STORE: z.enum(['postgres', 'memory']).default('postgres'),
  DATABASE_URL: z.string().url().optional(),
  STORAGE_DRIVER: z.enum(['local', 'memory', 's3']).default('local'),
  UPLOAD_DIR: z.string().default('./storage/uploads'),
  MAX_UPLOAD_MB: z.coerce.number().min(1).max(50).default(10),
  AWS_REGION: z.string().min(1).optional(),
  S3_BUCKET: z.string().regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/, 'Invalid S3 bucket name').optional(),
  S3_PRESIGN_EXPIRES_SECONDS: z.coerce.number().int().min(10).max(900).default(60),
  QUEUE_DRIVER: z.enum(['bullmq', 'memory']).default('bullmq'),
  REDIS_URL: z.string().url().optional(),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(2),
  JOB_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  JOB_BACKOFF_MS: z.coerce.number().int().min(10).max(60_000).default(2000),
  WORKER_HEALTH_PORT: z.coerce.number().int().min(1).max(65535).default(4100),
  WORKER_DEBUG_HOOKS: bool,
  PROCESS_SIMULATED_DELAY_MS: z.coerce.number().int().min(0).max(60_000).default(0),
  MAX_PDF_PAGES: z.coerce.number().int().min(1).max(2000).default(300),
  MAX_EXTRACTED_CHARS: z.coerce.number().int().min(10_000).max(20_000_000).default(2_000_000),
  PROCESS_TIMEOUT_MS: z.coerce.number().int().min(1000).max(600_000).default(60_000),
  EMBEDDING_PROVIDER: z.enum(['local', 'hash']).default('local'),
  MODEL_CACHE_DIR: z.string().default('./.cache/models'),
  ANTHROPIC_API_KEY: z.string().trim().optional().transform((v) => v || undefined),
  LLM_MODEL: z.string().default('claude-haiku-5-5'),
  LLM_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120_000).default(30_000),
  RAG_TOP_K: z.coerce.number().int().min(1).max(10).default(5),
  SLOW_REQUEST_MS: z.coerce.number().int().min(1).default(500),
}).superRefine((v, ctx) => {
  const fail = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message })
  if (v.NODE_ENV === 'production' && /change-me/i.test(v.JWT_SECRET)) fail('JWT_SECRET', 'Production mein placeholder secret allowed nahi')
  if (v.DATA_STORE === 'postgres' && !v.DATABASE_URL) fail('DATABASE_URL', 'DATA_STORE=postgres ke liye DATABASE_URL zaroori hai')
  if (v.STORAGE_DRIVER === 's3' && (!v.AWS_REGION || !v.S3_BUCKET)) fail('S3_BUCKET', 's3 ke liye AWS_REGION aur S3_BUCKET zaroori hai')
  if (v.QUEUE_DRIVER === 'bullmq' && !v.REDIS_URL) fail('REDIS_URL', 'QUEUE_DRIVER=bullmq ke liye REDIS_URL zaroori hai')
  if (v.NODE_ENV === 'production') {
    if (v.DATA_STORE === 'memory') fail('DATA_STORE', 'Production mein memory store allowed nahi')
    if (v.STORAGE_DRIVER === 'memory') fail('STORAGE_DRIVER', 'Production mein memory storage allowed nahi')
    if (v.QUEUE_DRIVER === 'memory') fail('QUEUE_DRIVER', 'Production mein memory queue allowed nahi')
    if (v.WORKER_DEBUG_HOOKS) fail('WORKER_DEBUG_HOOKS', 'Production mein debug hooks allowed nahi')
  }
})

export function parseEnv(raw: NodeJS.ProcessEnv) {
  const cleaned = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined && v !== ''))
  return schema.safeParse(cleaned)
}

const parsed = parseEnv(process.env)
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}
export const env = parsed.data
