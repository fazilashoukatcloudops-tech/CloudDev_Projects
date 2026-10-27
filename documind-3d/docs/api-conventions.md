# API Conventions

Base path: /api/v1

Success: JSON body with the resource, e.g. { "status": "ok", "service": "documind-api" }

Error (always this shape):
{
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | UNAUTHORIZED | FORBIDDEN | INTERNAL_ERROR",
    "message": "Human readable message",
    "details": "optional, e.g. field errors"
  }
}

Status codes: 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 500 internal.
## Planned endpoints

| Method | Endpoint                          | Status (Day 3)       | Implemented on |
| ------ | --------------------------------- | -------------------- | -------------- |
| GET    | /api/v1/health                    | Implemented          | Day 1          |
| POST   | /api/v1/auth/register             | Validation + 501     | Day 6          |
| POST   | /api/v1/auth/login                | Validation + 501     | Day 6          |
| GET    | /api/v1/documents                 | 501                  | Day 7 / 12     |
| POST   | /api/v1/documents                 | 501                  | Day 7 / 8      |
| GET    | /api/v1/documents/:id             | 501                  | Day 12         |
| GET    | /api/v1/documents/:id/status      | 501                  | Day 9          |
| POST   | /api/v1/documents/:id/questions   | Validation + 501     | Day 11         |
| DELETE | /api/v1/documents/:id             | 501                  | Day 7+         |

## Extra error codes
- INVALID_JSON (400): body valid JSON nahi
- NOT_IMPLEMENTED (501): endpoint planned hai, abhi implement nahi

## Headers
- Har response mein X-Request-Id; logs mein is ki pehli 8 characters nazar aati hain.
