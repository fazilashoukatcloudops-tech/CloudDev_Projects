#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

FILE="${1:-}"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Usage: deploy/scripts/db-restore.sh backups/<file>.sql.gz" >&2
  exit 1
fi

echo "WARNING: yeh database ka MAUJOODA data replace kar dega."
read -r -p "Type YES to continue: " answer
[ "$answer" = "YES" ] || { echo "Cancelled."; exit 1; }

docker compose exec -T db sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"' </dev/null

gunzip -c "$FILE" | docker compose exec -T db sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1'

echo "Restore complete from $FILE"
