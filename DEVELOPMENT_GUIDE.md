# Whispr Development Guide

This guide explains how to set up, develop, and extend the Whispr platform.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git
- A code editor (VS Code recommended)

### Setting Up the Development Environment

1. Clone the repository:
```bash
git clone https://github.com/yourusername/whispr.git
cd whispr
```

2. Create a `.env` file from the template:
```bash
cp .env.example .env
```

3. Start the development environment:
```bash
make up
```

This will start all the containers:
- Frontend (Next.js)
- Backend (FastAPI)
- Database (PostgreSQL)
- Nginx (Reverse Proxy)

4. Initialize the frontend (if not already set up):
```bash
make setup-frontend
```

5. Access the applications:
   - Frontend: http://localhost
   - Backend API: http://localhost/api
   - API Documentation: http://localhost/api/docs

## Development Workflow

### Backend Development

The FastAPI backend is located in the `backend` directory. The code is automatically reloaded when you make changes.

#### Adding New Endpoints

1. Create schema classes in `backend/app/schemas/`
2. Create endpoint functions in `backend/app/api/endpoints/`
3. Register endpoints in `backend/app/api/routes/__init__.py`

See the detailed implementation guide in `backend/app/api/IMPLEMENTATION_GUIDE.md`.

#### Accessing the Backend Container

```bash
make shell-backend
```

#### Testing API Endpoints

You can test API endpoints using the Swagger UI at http://localhost/api/docs.

### Frontend Development

The Next.js frontend is located in the `frontend` directory. The code is automatically reloaded when you make changes.

#### Accessing the Frontend Container

```bash
make shell-frontend
```

Inside the container, you can run any npm commands:
```bash
npm run dev  # Already running by default
npm install some-package
npm run lint
```

#### Building Frontend Components

See the detailed implementation guide in `frontend/IMPLEMENTATION_GUIDE.md`.

### Database Development

The PostgreSQL database is initialized with the schema defined in `init-scripts/01-init.sql`.

#### Accessing the Database

```bash
make shell-db
```

This opens a PostgreSQL shell where you can run SQL queries:
```sql
-- List all tables
\dt

-- Query users
SELECT * FROM users;
```

#### Making Schema Changes

To make schema changes:

1. Create a new migration script in the `init-scripts` directory
2. Update the corresponding models in `backend/app/models/`
3. Rebuild the containers to apply the changes:
```bash
make rebuild
```

For production, you would use a proper database migration tool like Alembic.

## Project Structure

```
whispr/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── auth/         # Authentication utilities
│   │   ├── core/         # Core settings and config
│   │   ├── db/           # Database connection and utilities
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic schemas for API
│   │   └── utils/        # Utility functions
│   ├── main.py           # Application entry point
│   ├── Dockerfile        # Backend container definition
│   └── requirements.txt  # Python dependencies
├── frontend/             # Next.js application
│   └── Dockerfile        # Frontend container definition
├── nginx/                # Nginx configuration
│   └── conf.d/           # Server configuration
├── init-scripts/         # Database initialization scripts
│   └── 01-init.sql       # Schema creation script
├── docker-compose.yml    # Docker composition file
├── Makefile              # Development commands
├── .env.example          # Environment variable template
└── README.md             # Project overview
```

## Development Tips

### Working with Docker

- **Rebuilding Containers**: If you change Dockerfiles or install new dependencies, rebuild the containers:
```bash
make rebuild
```

- **Viewing Logs**: Check container logs for debugging:
```bash
make logs
# Or for a specific container
docker-compose logs -f backend
```

- **Restarting Containers**: If a service isn't working correctly, restart it:
```bash
docker-compose restart backend
```

### Code Conventions

#### Backend (Python)

- Follow PEP 8 style guidelines
- Use async/await for database operations
- Document all functions with docstrings
- Use type hints for function parameters and return values

#### Frontend (TypeScript/React)

- Use functional components with hooks
- Follow the Next.js App Router conventions
- Use TypeScript interfaces for props and state
- Use CSS utility classes from Tailwind CSS

### Git Workflow

1. Create a feature branch:
```bash
git checkout -b feature/my-feature
```

2. Make your changes and commit:
```bash
git add .
git commit -m "Add my feature"
```

3. Push to the remote repository:
```bash
git push origin feature/my-feature
```

4. Create a pull request

## Extending the Application

### Adding a New Feature

1. **Plan the feature**:
   - Define the database schema changes (if any)
   - Define the API endpoints needed
   - Design the UI components

2. **Implement backend components**:
   - Add/update database models
   - Create API schemas
   - Implement API endpoints

3. **Implement frontend components**:
   - Create UI components
   - Implement data fetching
   - Add routing and navigation

4. **Test the feature**:
   - Test API endpoints
   - Test UI interactions
   - Check for edge cases

### Adding Authentication Providers

The current authentication uses JWT tokens with username/password. To add additional providers (e.g., OAuth):

1. Install required libraries in the backend
2. Create new authentication routes
3. Update the frontend auth store to handle the new providers

## Deployment

### Development to Production

For production deployment:

1. Update environment variables in `.env`:
   - Set strong JWT secret
   - Configure production database credentials
   - Set secure cookie settings

2. Configure HTTPS in Nginx:
   - Add SSL certificates
   - Update Nginx configuration

3. Deploy using Docker Compose:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Continuous Integration/Deployment

Consider setting up CI/CD pipelines with GitHub Actions or GitLab CI to automate:
- Running tests
- Building Docker images
- Deploying to staging/production environments

## Troubleshooting

### Common Issues

1. **Container fails to start**:
   - Check logs: `docker-compose logs <service-name>`
   - Verify environment variables

2. **Database connection issues**:
   - Check if the database container is running
   - Verify database credentials in `.env`

3. **Frontend can't connect to API**:
   - Check Nginx configuration
   - Verify API URLs in frontend code

4. **Changes not reflecting**:
   - For backend: Check if the file was saved and the server reloaded
   - For frontend: Check if the development server is running

### Getting Help

If you encounter issues:
1. Check the documentation for the specific component
2. Search for similar issues in the project's issue tracker
3. Create a new issue with detailed information about the problem