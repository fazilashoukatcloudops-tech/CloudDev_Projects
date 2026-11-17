# Architecture

## System
Browser -> Nginx -> API -> Postgres
                    |
                 Redis -> Worker -> Postgres

## Upload + Ask flow
1. User uploads PDF, API saves, enqueues job, returns 201
2. Worker extracts text, chunks, embeds, saves, marks ready
3. User asks, API loads chunks, cosine similarity top-K, returns answer + sources

## K8s topology
- web Deployment (2)
- api Deployment (2)
- worker Deployment (1)
- db StatefulSet (1 + PVC)
- redis StatefulSet (1 + PVC)
- migrate Job (runs once)
- NodePort 30080 mapped to host 8088
