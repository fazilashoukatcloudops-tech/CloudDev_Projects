import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      CORS_ORIGIN: 'http://localhost:5173',
      JWT_SECRET: 'test-secret-test-secret-test-secret-123456',
      COOKIE_SECURE: 'false',
      BCRYPT_ROUNDS: '4',
    },
  },
})
