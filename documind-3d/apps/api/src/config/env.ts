import 'dotenv/config'
import { z } from 'zod'

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(4000),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET kam az kam 32 characters ka hona chahiye'),
    JWT_EXPIRES_DAYS: z.coerce.number().int().min(1).max(30).default(7),
    COOKIE_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

    DATA_STORE: z.enum(['postgres', 'memory']).default('postgres'),
    DATABASE_URL: z.string().url().optional(),

    STORAGE_DRIVER: z.enum(['local', 'memory']).default('local'),
    UPLOAD_DIR: z.string().default('./storage/uploads'),
    MAX_UPLOAD_MB: z.coerce.number().min(1).max(50).default(10),
  })
  .superRefine((v, ctx) => {
    if (v.NODE_ENV === 'production' && /change-me/i.test(v.JWT_SECRET)) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'Production mein placeholder secret allowed nahi',
      })
    }
    if (v.DATA_STORE === 'postgres' && !v.DATABASE_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: 'DATA_STORE=postgres ke liye DATABASE_URL zaroori hai',
      })
    }
    if (v.NODE_ENV === 'production' && v.DATA_STORE === 'memory') {
      ctx.addIssue({
        code: 'custom',
        path: ['DATA_STORE'],
        message: 'Production mein memory store allowed nahi',
      })
    }
  })

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
  }
  process.exit(1)
}

export const env = parsed.data
