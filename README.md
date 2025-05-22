# Whispr

A platform for course and professor reviews with institutional authentication.

## Project Overview

Whispr is a comprehensive review platform that allows users to review and rate courses and professors. It features institutional email verification, ensuring that reviews come from actual students. The platform includes social features such as following other users, upvoting/downvoting reviews, and replying to reviews.

## Architecture

The project is built with a modern three-tier architecture:

1. **Frontend**: Next.js with TypeScript for a responsive, SSR-capable UI
2. **Backend**: FastAPI Python API with PostgreSQL database
3. **Database**: PostgreSQL for reliable, relational data storage

All components are containerized using Docker, making development and deployment consistent across environments.

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
├── frontend/             # Next.js application (to be implemented)
│   └── Dockerfile        # Frontend container definition
├── nginx/                # Nginx configuration
│   └── conf.d/           # Server configuration
├── init-scripts/         # Database initialization scripts
│   └── 01-init.sql       # Schema creation script
├── docker-compose.yml    # Docker composition file
├── .env.example          # Environment variable template
└── README.md             # This file
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Development Setup

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
docker-compose up -d
```

4. Access the applications:
   - Frontend: http://localhost
   - Backend API: http://localhost/api
   - API Documentation: http://localhost/api/docs

### Development Workflow

#### Backend Development

The backend is a FastAPI application with hot reloading enabled. Changes to Python files will automatically reload the server.

1. Make changes to the backend code
2. The changes will be automatically detected and the server will reload
3. Access the API documentation at http://localhost/api/docs to test your endpoints

#### Frontend Development

The frontend is a Next.js application with TypeScript. To start implementing the frontend:

1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Make changes to the frontend code
5. The changes will be automatically detected and the UI will update

## Features and Implementation Status

### Implemented

- ✅ Database models and schema
- ✅ Authentication system with JWT tokens and cookies
- ✅ Docker containerization
- ✅ Nginx reverse proxy configuration

### Pending Implementation

- ⬜ User management endpoints
- ⬜ Course and professor endpoints
- ⬜ Review and reply endpoints
- ⬜ Search functionality
- ⬜ Frontend implementation

## API Documentation

When the backend is running, the full API documentation is available at http://localhost/api/docs.

The following endpoints are currently implemented:

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login and get access token
- `POST /api/auth/logout`: Logout and clear authentication

## Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| DATABASE_URL | PostgreSQL connection string | postgresql://postgres:postgres@db:5432/whispr |
| DATABASE_NAME | Database name | whispr |
| JWT_SECRET | Secret key for JWT tokens | changeme_in_production |
| JWT_ALGORITHM | Algorithm for JWT tokens | HS256 |
| JWT_EXPIRATION | Token expiration in seconds | 86400 |
| CORS_ORIGINS | Allowed origins for CORS | http://localhost:3000,http://localhost |
| FRONTEND_URL | URL of the frontend | http://localhost:3000 |
| COOKIE_DOMAIN | Domain for cookies | localhost |
| COOKIE_SECURE | Use secure cookies | False |
| COOKIE_SAMESITE | SameSite cookie policy | lax |
| ALLOWED_EMAIL_DOMAINS | Domains allowed for email verification | example.edu,students.example.edu |

## Database Schema

The database schema is defined in `init-scripts/01-init.sql` and includes the following tables:

- `users`: User accounts and profiles
- `professors`: Professor information
- `courses`: Course information
- `course_instructors`: Links professors to courses they teach
- `reviews`: Reviews of courses and professors
- `replies`: Replies to reviews
- `votes`: Upvotes and downvotes on reviews and replies
- `user_followers`: Tracks which users follow other users
- `verified_emails`: Tracks verified email addresses
- `notifications`: User notifications

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run tests (once implemented)
4. Submit a pull request

## Deployment

For production deployment, make sure to:

1. Set secure values in `.env`:
   - Generate a strong `JWT_SECRET`
   - Set `COOKIE_SECURE=True`
   - Update `ALLOWED_EMAIL_DOMAINS` with your institution's domains

2. Configure HTTPS in Nginx by providing SSL certificates in `nginx/certs/`

3. Build and start the containers:
```bash
docker-compose up -d --build
```