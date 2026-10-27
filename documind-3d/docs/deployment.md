# Deployment

## Docker requirements (planned)
- Web: multi-stage build (node build stage -> nginx serving dist/), port 80
- API: node:LTS-slim, run as non-root user, port 4000, healthcheck on /api/v1/health
- Config only via environment variables (see .env.example)
## Frontend production build

Command: cd apps/web && npm run build   -> output: apps/web/dist (static files)

- VITE_API_BASE_URL build time par bake hota hai. Har environment (staging/prod) ke liye
  alag build chahiye; runtime par badalna possible nahi.
- Same-origin approach (planned, Day 14 / 17): Nginx dist/ serve kare aur /api ko API
  container par proxy kare. Is se CORS aur cookie issues nahi aate.
- SPA fallback zaroori hai warna /dashboard par refresh karne se 404 aata hai:

    location / { try_files $uri /index.html; }
    location /api/ { proxy_pass http://api:4000; }

- API ka CORS_ORIGIN production web origin ke barabar hona chahiye (same-origin mein zaroorat nahi).
- Security headers aur caching (hashed assets long cache, index.html no-cache) Day 14 mein.
