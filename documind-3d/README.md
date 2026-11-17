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
