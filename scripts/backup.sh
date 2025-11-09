#!/bin/bash

# Database backup script for PostgreSQL
# Usage: Run as Docker service or cron job

set -e

# Configuration
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${POSTGRES_DB:-radhagsarees}
DB_USER=${POSTGRES_USER:-postgres}
BACKUP_DIR=${BACKUP_DIR:-/backups}
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/radhagsarees_backup_$TIMESTAMP.sql"

echo "Starting database backup..."
echo "Host: $DB_HOST:$DB_PORT"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"

# Create backup
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --verbose \
  --clean \
  --if-exists \
  --create \
  --format=custom \
  --file="$BACKUP_FILE.dump"

# Also create SQL format for easier inspection
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --verbose \
  --clean \
  --if-exists \
  --create \
  --format=plain \
  --file="$BACKUP_FILE"

# Compress backups
gzip "$BACKUP_FILE"
echo "Backup created: $BACKUP_FILE.gz"
echo "Custom format: $BACKUP_FILE.dump"

# Cleanup old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "radhagsarees_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "radhagsarees_backup_*.dump" -mtime +$RETENTION_DAYS -delete

# List current backups
echo "Current backups:"
ls -lah "$BACKUP_DIR"/radhagsarees_backup_*

echo "Backup completed successfully!"

# Optional: Upload to cloud storage (uncomment as needed)
# aws s3 cp "$BACKUP_FILE.gz" "s3://your-backup-bucket/postgres/"
# gsutil cp "$BACKUP_FILE.gz" "gs://your-backup-bucket/postgres/"