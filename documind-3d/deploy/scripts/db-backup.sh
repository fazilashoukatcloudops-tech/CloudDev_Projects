#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

mkdir -p backups
FILE="backups/documind-$(date +%Y%m%d-%H%M%S).sql.gz"

if ! docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --clean --if-exists' | gzip > "$FILE"; then
  rm -f "$FILE"
  echo "Backup FAILED" >&2
  exit 1
fi

echo "Backup saved: $FILE ($(du -h "$FILE" | cut -f1))"
