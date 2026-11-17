# Performance

## Optimizations
- Route lazy loading
- 3D scene lazy-loaded
- Adaptive DPR
- Pause frameloop when tab hidden

## Bottlenecks
- Login: bcryptjs CPU-bound
- Ask: loads all chunks (fix: pgvector)
- Upload: buffered in memory (fix: presigned PUT)
- Graph: O(n^2) capped at 50
- Rate limiter: in-memory
