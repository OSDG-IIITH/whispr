#!/bin/bash

# Automated backup script for Whispr database
# This script is called by cron to perform regular backups

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to project directory
cd "$PROJECT_DIR"

# Log file for backup operations
LOG_FILE="$PROJECT_DIR/backups/backup.log"

# Ensure backups directory exists
mkdir -p "$PROJECT_DIR/backups"

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "Starting automated backup..."

# Check if docker-compose services are running
if ! docker-compose ps | grep -q "Up"; then
    log "Warning: Docker services don't appear to be running. Starting services first..."
    if docker-compose up -d >> "$LOG_FILE" 2>&1; then
        log "Services started successfully"
        # Wait a bit for services to be ready
        sleep 10
    else
        log "ERROR: Failed to start services. Backup cancelled."
        exit 1
    fi
fi

# Perform the backup
log "Starting database backup..."
if make backup >> "$LOG_FILE" 2>&1; then
    # Get the latest backup file (could be .zip, .gz, or .sql)
    latest_backup=$(ls -t "$PROJECT_DIR/backups"/whispr_backup_*.{zip,gz,sql} 2>/dev/null | head -n1)
    if [ -n "$latest_backup" ]; then
        backup_size=$(du -h "$latest_backup" | cut -f1)
        log "Backup completed successfully: $(basename "$latest_backup") ($backup_size)"
    else
        log "Backup completed but no backup file found"
    fi
    
    # Clean up old backups (keep last 30 days)
    log "Cleaning up old backups (older than 30 days)..."
    deleted_count=0
    for pattern in "whispr_backup_*.zip" "whispr_backup_*.gz" "whispr_backup_*.sql"; do
        deleted_files=$(find "$PROJECT_DIR/backups" -name "$pattern" -mtime +30 -delete -print 2>/dev/null | wc -l)
        deleted_count=$((deleted_count + deleted_files))
    done
    
    # Count remaining backups
    total_backups=0
    for pattern in "whispr_backup_*.zip" "whispr_backup_*.gz" "whispr_backup_*.sql"; do
        count=$(find "$PROJECT_DIR/backups" -name "$pattern" 2>/dev/null | wc -l)
        total_backups=$((total_backups + count))
    done
    
    if [ "$deleted_count" -gt 0 ]; then
        log "Cleanup completed. Deleted $deleted_count old backup(s). $total_backups backup files remaining."
    else
        log "Cleanup completed. No old backups to delete. $total_backups backup files total."
    fi
    
    # Log disk usage of backup directory
    backup_dir_size=$(du -sh "$PROJECT_DIR/backups" 2>/dev/null | cut -f1)
    log "Total backup directory size: $backup_dir_size"
    
else
    log "ERROR: Backup failed! Check the log for details."
    
    # Try to get more information about the failure
    log "Checking Docker services status..."
    docker-compose ps >> "$LOG_FILE" 2>&1 || true
    
    # Check if database container is accessible
    log "Testing database connectivity..."
    if docker-compose exec -T db psql -U postgres -c "SELECT 1;" >> "$LOG_FILE" 2>&1; then
        log "Database is accessible, backup failure might be due to other issues."
    else
        log "Database is not accessible. Check database container status."
    fi
    
    exit 1
fi

log "Automated backup process completed successfully."
