.PHONY: up up_n down build rebuild logs ps shell-backend shell-frontend shell-db clean setup-frontend help start dev dev-up dev-down dev-build dev-rebuild dev-logs

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