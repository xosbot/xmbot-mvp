#!/usr/bin/env bash
# Nightly Postgres backup for xmbot. Dumps via `docker exec pg_dump` (no
# extra network exposure needed) to a local, gzip-compressed file, and
# prunes anything older than RETENTION_DAYS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
CONTAINER="xmbot-postgres-1"
DB_USER="xmbot"
DB_NAME="xmbot"

mkdir -p "$BACKUP_DIR"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
outfile="$BACKUP_DIR/xmbot-${timestamp}.sql.gz"
tmpfile="${outfile}.tmp"

if ! docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$tmpfile"; then
    echo "[backup-postgres] pg_dump failed at ${timestamp}" >&2
    rm -f "$tmpfile"
    exit 1
fi

mv "$tmpfile" "$outfile"
echo "[backup-postgres] wrote $outfile ($(du -h "$outfile" | cut -f1))"

find "$BACKUP_DIR" -name 'xmbot-*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete
