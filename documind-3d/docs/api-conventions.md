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