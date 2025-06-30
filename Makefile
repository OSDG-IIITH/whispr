.PHONY: up up_n down build rebuild logs ps shell-backend shell-frontend shell-db clean setup-frontend help start

# Default target
help:
	@echo "Available commands:"
	@echo "  make up              - Start all containers"
	@echo "  make down            - Stop all containers"
	@echo "  make build           - Build all containers"
	@echo "  make rebuild         - Rebuild and restart all containers"
	@echo "  make logs            - View logs from all containers"
	@echo "  make ps              - List running containers"
	@echo "  make shell-backend   - Open a shell in the backend container"
	@echo "  make shell-frontend  - Open a shell in the frontend container"
	@echo "  make shell-db        - Open a shell in the database container"
	@echo "  make clean           - Remove all containers, volumes, and networks"
	@echo "  make setup-frontend  - Initialize the Next.js frontend project"
	@echo "  make start           - Properly start services in the correct order"

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
	@echo "Starting services in the correct order..."
	docker-compose up -d db
	@echo "Waiting for database to be ready..."
	@sleep 10  # Wait for PostgreSQL to initialize
	docker-compose up -d backend
	@echo "Waiting for backend to be ready..."
	@sleep 5   # Wait for backend to initialize
	docker-compose up -d frontend nginx
	@echo "All services started successfully."
	@echo "Access the application at http://localhost"
	@echo "API documentation available at http://localhost/api/docs"