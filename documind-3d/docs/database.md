# Database

PostgreSQL 16 (Docker Compose) + Prisma 6. Schema: apps/api/prisma/schema.prisma

## Local setup
1. `npm run db:up`               (root; PostgreSQL start + healthy wait)
2. `cd apps/api && cp ../../.env.example .env`   (phir JWT_SECRET generate karke set karo)
3. `npx prisma migrate dev`       (migrations apply + client generate)
4. `npm run dev`

## Migration workflow
- Schema badlo -> `cd apps/api && npx prisma migrate dev --name <short_description>`
- Generated `prisma/migrations/*` folder COMMIT karo. Purani migration file kabhi edit nahi karte.
- Production/CI mein: `npx prisma migrate deploy` (sirf pending migrations apply, data reset nahi)
- Status: `npm run db:status`
- GUI: `npm run db:studio` (http://localhost:5555)
- Dev DB reset (DATA DELETE): `npx prisma migrate reset`

## Tables
- `users`(id uuid, name, email unique lowercase, password_hash, created_at)
- `documents`(id uuid, user_id -> users ON DELETE CASCADE, name, mime_type, size_bytes, storage_key unique, checksum_sha256, pages, status, error_message, created_at, updated_at)
- Indexes: (user_id, created_at desc), (user_id, status)

## Ownership rule
Har document query userId ke saath hoti hai (repository level). Doosre user ka document 404 deta hai.

## Backup / restore
- **Backup (Node, cross-platform):** `node deploy/scripts/db-backup.cjs`
- **Backup (bash, Linux/CI):** `bash deploy/scripts/db-backup.sh`
- **Restore (Node):** `node deploy/scripts/db-restore.cjs backups/<file>.sql.gz`
- **Restore (bash):** `bash deploy/scripts/db-restore.sh backups/<file>.sql.gz`
- Manual check: `docker compose exec db psql -U documind -d documind -c "\\dt"`
- Backup file mein user data hota hai: Git ya chat mein share nahi karna.
- **Backup flags:** `--no-owner --clean --if-exists` (idempotent restore, chahe pehle se data ho ya na ho)
- Restore test verified (Day 7): 8/8 automated tests pass

## Volume
- Data docker volume `documind_pgdata` mein hai. `docker compose down` data rakhta hai;
  `docker compose down -v` volume DELETE kar deta hai.

## File storage (Day 7)
- Files `apps/api/storage/uploads/<userId>/<documentId>.pdf` (local disk, gitignored)
- Disk sirf development ke liye; Day 8 par private S3.

## Tests
- `npm test` (apps/api): in-memory repositories, database nahi chahiye
- Real DB tests: `TEST_DATABASE_URL` set karke `npm run test:db`
