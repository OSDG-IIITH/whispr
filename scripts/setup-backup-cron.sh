#!/bin/bash

# Setup automated database backups for Whispr
# This script sets up cron jobs to automatically backup the database

set -e

# Get the absolute path to the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Project directory: $PROJECT_DIR"

# Verify that make backup works
echo "Testing backup functionality..."
if ! command -v make &> /dev/null; then
    echo "Error: make is not installed. Please install make first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
    echo "Error: docker-compose or docker is not installed. Please install Docker first."
    exit 1
fi

# Create a backup script that will be called by cron
BACKUP_SCRIPT="$PROJECT_DIR/scripts/automated-backup.sh"
cat > "$BACKUP_SCRIPT" << 'EOF'
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
EOF

# Make the backup script executable
chmod +x "$BACKUP_SCRIPT"

echo "Created automated backup script at: $BACKUP_SCRIPT"

# Function to add cron job
add_cron_job() {
    local schedule="$1"
    local description="$2"
    
    # Get current crontab (if any)
    crontab -l 2>/dev/null > /tmp/current_cron || touch /tmp/current_cron
    
    # Check if our backup job already exists
    if grep -q "automated-backup.sh" /tmp/current_cron; then
        echo "Backup cron job already exists. Updating..."
        # Remove existing backup job
        grep -v "automated-backup.sh" /tmp/current_cron > /tmp/new_cron
    else
        cp /tmp/current_cron /tmp/new_cron
    fi
    
    # Add comment and new cron job
    echo "" >> /tmp/new_cron
    echo "# Whispr Database Backup - $description" >> /tmp/new_cron
    echo "$schedule $BACKUP_SCRIPT" >> /tmp/new_cron
    
    # Install the new crontab
    crontab /tmp/new_cron
    
    # Clean up
    rm /tmp/current_cron /tmp/new_cron
    
    echo "Cron job added successfully!"
    echo "Schedule: $schedule ($description)"
}

echo ""
echo "Choose an option:"
echo "1. Daily at 2:00 AM"
echo "2. Daily at 3:00 AM"
echo "3. Every 6 hours"
echo "4. Weekly (Sunday at 2:00 AM)"
echo "5. Custom schedule"
echo "6. View current cron jobs"
echo "7. Remove Whispr backup cron job"
echo "8. Exit without changes"

read -p "Enter your choice (1-8): " choice

case $choice in
    1)
        add_cron_job "0 2 * * *" "Daily at 2:00 AM"
        ;;
    2)
        add_cron_job "0 3 * * *" "Daily at 3:00 AM"
        ;;
    3)
        add_cron_job "0 */6 * * *" "Every 6 hours"
        ;;
    4)
        add_cron_job "0 2 * * 0" "Weekly on Sunday at 2:00 AM"
        ;;
    5)
        echo ""
        echo "Enter a custom cron schedule (format: minute hour day month weekday)"
        echo "Examples:"
        echo "  0 2 * * * = Daily at 2:00 AM"
        echo "  0 */12 * * * = Every 12 hours"
        echo "  0 0 * * 1 = Every Monday at midnight"
        read -p "Enter cron schedule: " custom_schedule
        read -p "Enter description: " custom_description
        add_cron_job "$custom_schedule" "$custom_description"
        ;;
    6)
        echo ""
        echo "Current cron jobs:"
        crontab -l 2>/dev/null || echo "No cron jobs found."
        echo ""
        read -p "Press Enter to continue..."
        exec "$0"  # Restart the script to show menu again
        ;;
    7)
        echo ""
        echo "Removing Whispr backup cron job..."
        
        # Check if backup job exists
        if crontab -l 2>/dev/null | grep -q "automated-backup.sh"; then
            # Remove the backup job
            crontab -l 2>/dev/null | grep -v "automated-backup.sh" | grep -v "Whispr Database Backup" | crontab -
            echo "Whispr backup cron job removed successfully!"
            
            echo ""
            echo "Remaining cron jobs:"
            crontab -l 2>/dev/null || echo "No cron jobs found."
        else
            echo "No Whispr backup cron job found."
        fi
        exit 0
        ;;
    8)
        echo "Exiting without making changes."
        exit 0
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "Setup completed successfully!"
echo ""
echo "Current cron jobs:"
crontab -l
echo ""
echo "Backup logs will be stored in: $PROJECT_DIR/backups/backup.log"
echo ""
echo "To remove the cron job later, run: crontab -e"
echo "To test the backup manually, run: $BACKUP_SCRIPT"
