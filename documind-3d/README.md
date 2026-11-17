# DocuMind 3D — AI Document Intelligence Platform

Upload PDF, AI extracts text, RAG chat, 3D similarity graph. Containerized. Jenkins CI/CD. Kubernetes. Prometheus + Grafana.

**Stack:** React 19 + Three.js | Node 20 + Express 5 + TypeScript | PostgreSQL + Prisma | Redis + BullMQ | Local AI | Docker | Jenkins | Kubernetes | Terraform (AWS)

## Features
- Auth: JWT httpOnly cookies, rate limiting, secure headers
- PDF processing: async worker, text extraction, chunking, embeddings
- AI chat (RAG): extractive + LLM modes, source citations
- 3D explorer: cosine similarity graph
- Observability: Prometheus metrics, Grafana dashboards
- CI/CD: Jenkins pipeline
- K8s: StatefulSets, PVCs, migrate Job, probes, NetworkPolicy

## Quick Start
docker compose -f compose.yaml -f compose.monitoring.yaml up -d --build
Open http://localhost:8080
Grafana http://localhost:3000 | Prometheus http://localhost:9090


## 🎬 Live Demo & Verification

Project ko locally chalane ke baad ye URLs verify karo:

| # | URL | Kya dikhega |
|---|-----|-------------|
| 1 | http://localhost:8088 | **App** — register → upload sample PDF → 3D explorer → Ask AI |
| 2 | http://localhost:9090/targets | **Prometheus** — api, worker, node, prometheus = all UP |
| 3 | http://localhost:3000 | **Grafana** — DocuMind Overview dashboard (admin/admin) |
| 4 | http://localhost:8090 | **Jenkins** — documind-pipeline, build history, stage view |

### Demo walkthrough (2 minutes)

1. **Register** — `http://localhost:8088/register` (email + password)
2. **Upload** — sample PDFs repo mein `docs/sample-data/` folder mein hain (`invoice-acme-q3.pdf`, `biology-photosynthesis.pdf`, etc.)
3. **Wait for Ready** — worker background mein process karta hai (queued → processing → ready)
4. **3D Explorer** — `http://localhost:8088/explorer` — similarity graph dekho (similar docs close, different far)
5. **Ask AI** — document select karke "Ask AI" — RAG answer + sources
6. **Monitoring** — `http://localhost:9090/targets` (Prometheus) aur `http://localhost:3000` (Grafana)
7. **CI/CD** — `http://localhost:8090` (Jenkins pipeline: lint → tests → security → docker build)

### Screenshots
Screenshots `docs/screenshots/` mein hain (capture checklist: `docs/screenshots/README.md`)

## Docs
- docs/architecture.md
- docs/openapi.yaml
- docs/security.md
- docs/performance.md
- docs/backup-recovery.md
- docs/kubernetes-runbook.md

## Known Limitations
- AWS deployment paused (SCP block)
- E2E + load tests planned
- JWT logout client-only

## Author
Fazil — https://github.com/fazilashoukatcloudops-tech
