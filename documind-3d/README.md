# DocuMind 3D

AI Document Intelligence Platform with an interactive 3D workspace.

## Structure
- `apps/web`: React + TypeScript + Vite + Three.js frontend
- `apps/api`: Node.js + Express + TypeScript API
- `infra`, `deploy`, `docs`: cloud and DevOps (added in later phases)

## Run locally

```bash
# API (terminal 1)
cd apps/api && cp ../../.env.example .env && npm install && npm run dev

# Web (terminal 2)
cd apps/web && npm install && npm run dev