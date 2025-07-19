.PHONY: up up_n down build rebuild logs ps shell-backend shell-frontend shell-db clean setup-frontend help start dev dev-up dev-down dev-build dev-rebuild dev-logs backup restore setup-cron

# Default target
help:
	@echo "Available commands:"
	@echo ""
	@echo "Production commands:"
	@echo "  make up              - Start all containers (production)"
	@echo "  make down            - Stop all containers"
	@echo "  make build           - Build all containers (production)"
	@echo "  make rebuild         - Rebuild and restart all containers (production)"
	@echo "  make start           - Properly start services in the correct order (production)"
	@echo ""
	@echo "Development commands:"
	@echo "  make dev             - Start all containers in development mode"
	@echo "  make dev-up          - Start all containers in development mode (detached)"
	@echo "  make dev-down        - Stop development containers"
	@echo "  make dev-build       - Build all containers for development"
	@echo "  make dev-rebuild     - Rebuild and restart all containers in development mode"
	@echo "  make dev-logs        - View logs from development containers"
	@echo ""
	@echo "Utility commands:"
	@echo "  make logs            - View logs from all containers"
	@echo "  make ps              - List running containers"
	@echo "  make shell-backend   - Open a shell in the backend container"
	@echo "  make shell-frontend  - Open a shell in the frontend container"
	@echo "  make shell-db        - Open a shell in the database container"
	@echo "  make clean           - Remove all containers, volumes, and networks"
	@echo "  make setup-frontend  - Initialize the Next.js frontend project"
	@echo ""
	@echo "Database commands:"
	@echo "  make backup          - Create a backup of the database to backups/ folder"
	@echo "  make restore         - Restore database from the latest backup"
	@echo "  make restore FILE=<filename> - Restore database from a specific backup file"
	@echo "  make setup-cron      - Set up automated backups using cron"

# Start all containers
up:
	docker-compose up -d

# Start all containers without detach
up_n:
	docker-compose up

# Stop all containers
down:
	docker-compose down

# Build all containers
build:
	docker-compose build

# Rebuild and restart all containers
rebuild:
	docker-compose down
	docker-compose build
	docker-compose up -d

# Development mode commands
# Start all containers in development mode (interactive)
dev:
	@echo "Starting services in development mode..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Start all containers in development mode (detached)
dev-up:
	@echo "Starting services in development mode (detached)..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Stop development containers
dev-down:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Build all containers for development
dev-build:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml build

# Rebuild and restart all containers in development mode
dev-rebuild:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml build
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs from development containers
dev-logs:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# View logs from all containers
logs:
	docker-compose logs -f

# List running containers
ps:
	docker-compose ps

# Open a shell in the backend container
shell-backend:
	docker-compose exec backend bash

# Open a shell in the frontend container
shell-frontend:
	docker-compose exec frontend sh

# Open a shell in the database container
shell-db:
	docker-compose exec db psql -U postgres -d whispr

# Remove all containers, volumes, and networks
clean:
	docker-compose down -v

# Setup Next.js frontend
setup-frontend:
	@echo "Setting up the Next.js frontend..."
	docker-compose exec frontend sh -c "cd /app && npx create-next-app@latest . --typescript --eslint --tailwind --app --src-dir --import-alias '@/*'"
	docker-compose exec frontend sh -c "cd /app && npm install axios js-cookie @types/js-cookie zustand react-hook-form zod @hookform/resolvers"
	@echo "Frontend setup complete! The Next.js project has been initialized."
	@echo "You can now start developing by accessing the container with 'make shell-frontend'"

# Start services in the correct order
start:
	@echo "Starting services with proper dependency waiting..."
	docker-compose up -d
	@echo "All services started successfully with health checks."
	@echo "Access the application at http://localhost"
	@echo "API documentation available at http://localhost/api/docs"

# Database backup and restore commands
# Create a backup of the database
backup:
	@echo "Creating database backup..."
	@mkdir -p backups
	@timestamp=$$(date +"%Y%m%d_%H%M%S"); \
	backup_file="backups/whispr_backup_$$timestamp"; \
	echo "Backing up database to $$backup_file.sql..."; \
	docker-compose exec -T db pg_dump -U postgres -d whispr --no-owner --no-privileges > "$$backup_file.sql"; \
	if [ $$? -eq 0 ]; then \
		echo "Database dump successful, compressing backup..."; \
		if command -v zip >/dev/null 2>&1; then \
			zip "$$backup_file.zip" "$$backup_file.sql" && rm "$$backup_file.sql" && final_file="$$backup_file.zip"; \
		elif command -v gzip >/dev/null 2>&1; then \
			gzip "$$backup_file.sql" && final_file="$$backup_file.sql.gz"; \
		else \
			echo "Warning: No compression tool found (zip/gzip). Keeping uncompressed SQL file."; \
			final_file="$$backup_file.sql"; \
		fi; \
		if [ -f "$$final_file" ]; then \
			echo "Backup completed successfully: $$final_file"; \
			echo "Backup size: $$(du -h "$$final_file" | cut -f1)"; \
		else \
			echo "Error: Backup file was not created properly!"; \
			exit 1; \
		fi; \
	else \
		echo "Database backup failed!"; \
		exit 1; \
	fi

# Restore database from backup
restore:
	@if [ -n "$(FILE)" ]; then \
		backup_file="$(FILE)"; \
	else \
		backup_file=$$(ls -t backups/whispr_backup_*.zip backups/whispr_backup_*.gz backups/whispr_backup_*.sql 2>/dev/null | head -n1); \
	fi; \
	if [ -z "$$backup_file" ]; then \
		echo "No backup file found. Please specify a file with FILE=filename or create a backup first with 'make backup'"; \
		exit 1; \
	fi; \
	echo "Restoring database from $$backup_file..."; \
	if [ ! -f "$$backup_file" ]; then \
		echo "Backup file $$backup_file not found!"; \
		exit 1; \
	fi; \
	temp_sql="temp_restore_$$(date +%s).sql"; \
	echo "Extracting backup file..."; \
	case "$$backup_file" in \
		*.zip) unzip -p "$$backup_file" > "$$temp_sql" ;; \
		*.gz) gunzip -c "$$backup_file" > "$$temp_sql" ;; \
		*.sql) cp "$$backup_file" "$$temp_sql" ;; \
		*) echo "Unsupported backup file format: $$backup_file"; exit 1 ;; \
	esac; \
	echo "Dropping existing database connections..."; \
	docker-compose exec -T db psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'whispr' AND pid <> pg_backend_pid();" || true; \
	echo "Dropping and recreating database..."; \
	docker-compose exec -T db dropdb -U postgres --if-exists whispr; \
	docker-compose exec -T db createdb -U postgres whispr; \
	echo "Restoring database schema and data..."; \
	docker-compose exec -T db psql -U postgres -d whispr < "$$temp_sql"; \
	if [ $$? -eq 0 ]; then \
		echo "Database restore completed successfully from $$backup_file"; \
		rm "$$temp_sql"; \
	else \
		echo "Database restore failed!"; \
		rm "$$temp_sql"; \
		exit 1; \
	fi

# Set up automated database backups using cron
setup-cron:
	@echo "Setting up automated database backups..."
	@chmod +x scripts/setup-backup-cron.sh
	@./scripts/setup-backup-cron.sh