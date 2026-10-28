# Development Environment

- Node.js: v24.21.0
- npm: 11.19.0
- Docker: 29.8.2
- Git: 2.56.0.windows.2
- Frontend: React, Vite, Three.js, @react-three/fiber, @react-three/drei, Tailwind (see apps/web/package-lock.json)
- Backend: Express, TypeScript, Zod (see apps/api/package-lock.json)

## Commands
- API: cd apps/api && npm run dev (port 4000)
- Web: cd apps/web && npm run dev (port 5173)
- Web build: cd apps/web && npm run build
## Quality checks
- Root: npm run check  (API lint + typecheck + tests, web lint + build)
- API: cd apps/api && npm run check
- Web: cd apps/web && npm run check

## Environment configuration
- API: apps/api/.env (see root .env.example): NODE_ENV, PORT, CORS_ORIGIN
- Web: apps/web/.env (see apps/web/.env.example): VITE_API_BASE_URL
- Real .env files kabhi commit nahi hoti

## Auth env vars (Day 6)
- API env (apps/api/.env): NODE_ENV, PORT, CORS_ORIGIN, JWT_SECRET (required, 32+ chars),
  JWT_EXPIRES_DAYS, COOKIE_SECURE, BCRYPT_ROUNDS
- Naye developer ka setup: cp .env.example apps/api/.env, phir JWT_SECRET generate karke set karo (docs/secrets.md)
