# Secret Management

## Rules
1. Secret kabhi Git mein nahi: .env files .gitignore mein hain, sirf .env.example commit hoti hai (placeholders ke saath).
2. Har environment ka alag secret (local, staging, production). Local secret production mein kabhi use nahi.
3. Secrets code, Dockerfile, README, screenshots ya chat mein paste nahi karte.
4. Server missing/weak secret par start hi nahi hota (apps/api/src/config/env.ts).

## Generate
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

## Kahan rakhte hain
| Environment | Jagah |
|---|---|
| Local | apps/api/.env (gitignored) |
| Tests | apps/api/vitest.config.ts (fake test-only values) |
| Jenkins CI/CD (Day 18-19) | Jenkins Credentials store, pipeline mein withCredentials |
| AWS EC2 (Day 17) | Root-only env file (chmod 600) ya SSM Parameter Store / Secrets Manager (SecureString) |
| Kubernetes (Day 23) | Secret object (base64 encryption nahi hai, access control zaroori) |

## Rotation
- JWT_SECRET badalne se sab users logout ho jate hain (purane tokens invalid). Leak ka shak ho to foran rotate karo.
- Leak hua secret Git history se delete karna kaafi nahi: usay rotate karna zaroori hai.

## Checks (commit/push se pehle)
git ls-files | grep -E "(^|/)\.env($|\.)" | grep -v example     # kuch print nahi hona chahiye
npm audit --omit=dev (apps/api aur apps/web mein)
docker run --rm -v "$(pwd):/repo" ghcr.io/gitleaks/gitleaks:latest detect --source /repo -v
(Day 18 par secret scan Jenkins pipeline ka stage banega.)
