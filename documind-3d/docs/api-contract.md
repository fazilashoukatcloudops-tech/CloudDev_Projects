# Document API Contract (v1)

Base: /api/v1  |  Auth: Day 6 se cookie session  |  Errors: docs/api-conventions.md

## DocumentDto
{
  "id": "uuid",
  "name": "Q3-Financial-Report.pdf",
  "sizeBytes": 2480000,
  "pages": 42,                      // null jab tak processing complete na ho
  "status": "queued | processing | ready | failed",
  "errorMessage": null,             // failed par reason
  "uploadedAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}

## GET /documents
Query: page (>=1, default 1), pageSize (1-50, default 12),
       status (optional), q (optional, max 100), sort (newest|oldest|name|size, default newest)
200: { "data": DocumentDto[], "meta": { page, pageSize, total, totalPages, hasNext, hasPrev } }
Sirf logged-in user ke apne documents. totalPages = 0 jab total = 0.

## GET /documents/summary
200: { "data": { "total": 14, "byStatus": { queued, processing, ready, failed }, "storageBytes": 123456 } }

## POST /documents                              (Day 7 / 8)
multipart/form-data, field "file". Sirf PDF, max 10 MB.
201: { "data": DocumentDto }  (status = "queued")
400 VALIDATION_ERROR (galat type/size), 401 UNAUTHORIZED

## GET /documents/:id                           (Day 12)
200: { "data": DocumentDto }
404 NOT_FOUND (doosre user ka document bhi 404 deta hai, existence leak nahi karna)

## GET /documents/:id/status                    (Day 9)
200: { "data": { "id", "status", "errorMessage", "updatedAt" } }

## POST /documents/:id/questions                (Day 11)
Body: { "question": "3-1000 chars" }
200: { "data": { "answer": "...", "sources": [ { "chunkId", "page", "snippet" } ] } }
409 CONFLICT agar document abhi "ready" nahi.

## DELETE /documents/:id                        (Day 7+)
204 No Content. S3 object bhi delete hoga (Day 8).

## Pagination design
- Offset pagination (page + pageSize): dashboard ke liye kaafi hai. Max pageSize 50.
- Sort stable honi chahiye: sort field ke baad id par tie-break.
- Prisma: skip = (page - 1) * pageSize, take = pageSize, count alag query se.
- Page range se bahar jaye to 200 aur khali data (error nahi).

## GET /documents/graph                         (planned, Day 11+)
3D explorer ke liye nodes aur similarity edges.
200: { "data": { "nodes": DocumentDto[], "edges": [ { "source": "uuid", "target": "uuid", "weight": 0..1 } ] } }
- Sirf logged-in user ke documents; edges sirf "ready" documents ke beech (embeddings se).
- Edge ke dono ends nodes mein maujood hon aur source != target.
- Jab tak yeh endpoint nahi, frontend placeholder edges (nearest neighbours) khud banata hai.
- Schemas: apps/api/src/schemas/documentResponse.schema.ts (tests fixtures se verify hote hain).

## Business rules (DocumentDto)
- status = ready -> pages null nahi ho sakta
- status = failed -> errorMessage zaroori; baqi statuses mein errorMessage null
