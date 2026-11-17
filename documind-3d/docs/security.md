# Security

## Implemented
- Helmet, CORS, JSON 100KB limit
- httpOnly + SameSite=Lax cookies
- Rate limiters
- Origin check (CSRF)
- Upload validation
- K8s: NetworkPolicy, runAsNonRoot, no SA token
- CI: gitleaks, npm audit

## Accepted Risks
- JWT logout client-only
- Login rate-limit per-IP only
- Worker has JWT_SECRET
- PDF active content not blocked
- Email enumeration on register
- Trivy report-only
