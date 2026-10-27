# Deployment

## Docker requirements (planned)
- Web: multi-stage build (node build stage -> nginx serving dist/), port 80
- API: node:LTS-slim, run as non-root user, port 4000, healthcheck on /api/v1/health
- Config only via environment variables (see .env.example)