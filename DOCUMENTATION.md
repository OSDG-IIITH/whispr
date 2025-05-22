# Whispr Documentation

Welcome to the Whispr documentation! This document provides an overview of all the available documentation for the Whispr project.

## Project Documentation

### Main Guides

- [README.md](README.md) - Project overview, features, and setup instructions
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) - Comprehensive development workflow guide
- [.env.example](.env.example) - Environment variable template with descriptions

### Component Documentation

#### Backend

- [Backend README](backend/README.md) - Overview of the backend architecture
- [API Implementation Guide](backend/app/api/IMPLEMENTATION_GUIDE.md) - Guide for implementing API endpoints

#### Frontend

- [Frontend README](frontend/README.md) - Overview of the frontend architecture
- [Frontend Implementation Guide](frontend/IMPLEMENTATION_GUIDE.md) - Guide for implementing frontend components

#### Database

- [Database Schema Documentation](init-scripts/README.md) - Detailed database schema description

#### Infrastructure

- [Nginx Configuration Guide](nginx/README.md) - Nginx configuration documentation

## Architecture

### System Architecture

Whispr follows a three-tier architecture:

1. **Frontend**: Next.js application with TypeScript
   - Server-side rendering for performance and SEO
   - React components and hooks for UI
   - Zustand for state management
   - Tailwind CSS for styling

2. **Backend**: FastAPI application with PostgreSQL
   - RESTful API endpoints
   - JWT authentication
   - SQLAlchemy ORM for database access
   - Pydantic for data validation

3. **Database**: PostgreSQL
   - Relational database with proper constraints
   - UUID primary keys
   - Indexes for performance
   - Privacy-focused design with email separation

### Authentication Flow

1. User registers with username and email (email is stored separately for privacy)
2. User logs in with username and password
3. Backend validates credentials and issues a JWT token
4. Token is stored in an HTTP-only cookie for security
5. Subsequent requests include the cookie for authentication
6. Protected routes verify the token before processing requests

### Data Flow

1. Client makes requests to the Nginx server
2. Nginx routes requests to the appropriate service:
   - Frontend requests to the Next.js server
   - API requests to the FastAPI server
3. Backend processes API requests and interacts with the database
4. Responses flow back through the same path

## Privacy Design

The system has been designed with privacy as a key consideration:

1. **Email Privacy**:
   - User emails are not stored with user accounts
   - A separate `used_emails` table tracks which emails have been used for verification
   - No direct association between users and email addresses exists in the database
   - This ensures user anonymity while still preventing duplicate email usage

2. **Authentication**:
   - Username-based authentication instead of email-based
   - JWT tokens contain user ID but no personal information

3. **Email Verification**:
   - Email verification works without storing which email belongs to which user
   - For production, a token-based system would be implemented to verify users without
     storing the email-user relationship

## API Reference

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user (requires username, email, password)
- `POST /api/auth/login` - Login with username/password and get access token
- `POST /api/auth/logout` - Logout and clear authentication
- `POST /api/auth/verify-email` - Verify an email address

### User Endpoints

- `GET /api/users/me` - Get current user information
- `PUT /api/users/me` - Update current user information
- `GET /api/users/{username}` - Get user by username
- `POST /api/users/{username}/follow` - Follow a user
- `POST /api/users/{username}/unfollow` - Unfollow a user

### Course Endpoints

- `GET /api/courses` - List courses
- `GET /api/courses/{code}` - Get course by code
- `POST /api/courses` - Create a course (admin only)
- `PUT /api/courses/{code}` - Update a course (admin only)
- `GET /api/courses/{code}/reviews` - Get reviews for a course

### Professor Endpoints

- `GET /api/professors` - List professors
- `GET /api/professors/{id}` - Get professor by ID
- `POST /api/professors` - Create a professor (admin only)
- `PUT /api/professors/{id}` - Update a professor (admin only)
- `GET /api/professors/{id}/reviews` - Get reviews for a professor

### Review Endpoints

- `POST /api/reviews` - Create a review
- `GET /api/reviews/{id}` - Get review by ID
- `PUT /api/reviews/{id}` - Update a review
- `DELETE /api/reviews/{id}` - Delete a review
- `POST /api/reviews/{id}/vote` - Vote on a review

### Reply Endpoints

- `POST /api/reviews/{id}/replies` - Create a reply
- `GET /api/replies/{id}` - Get reply by ID
- `PUT /api/replies/{id}` - Update a reply
- `DELETE /api/replies/{id}` - Delete a reply
- `POST /api/replies/{id}/vote` - Vote on a reply

### Search Endpoints

- `GET /api/search` - Search courses and professors

## Database Schema

The database schema is designed to support a privacy-focused course and professor review platform:

### Key Tables

- `users`: User accounts and profiles (no email stored)
- `used_emails`: Tracks which emails have been used (not linked to users)
- `professors`: Professor information
- `courses`: Course information
- `course_instructors`: Links professors to courses they teach
- `reviews`: Reviews of courses and professors
- `replies`: Replies to reviews
- `votes`: Upvotes and downvotes on reviews and replies
- `user_followers`: Tracks which users follow other users
- `notifications`: User notifications

See the [Database Schema Documentation](init-scripts/README.md) for detailed information about each table.

## Development Workflows

### Setting Up the Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/whispr.git
cd whispr

# Create .env file
cp .env.example .env

# Start the environment
make up

# Initialize the frontend (if needed)
make setup-frontend
```

### Backend Development

```bash
# Open a shell in the backend container
make shell-backend

# Install a new dependency
pip install new-package
echo "new-package==1.0.0" >> requirements.txt
```

### Frontend Development

```bash
# Open a shell in the frontend container
make shell-frontend

# Install a new dependency
npm install new-package
```

### Database Operations

```bash
# Access the database
make shell-db

# Inside the PostgreSQL shell
\dt  # List tables
SELECT * FROM users;  # Query users
```

### Docker Operations

```bash
# Rebuild containers after Dockerfile changes
make rebuild

# View logs
make logs

# Stop all containers
make down
```

## Deployment

### Development Deployment

The development environment is containerized with Docker Compose, making it easy to deploy for development and testing.

### Production Deployment

For production deployment:

1. Update environment variables for production
2. Configure HTTPS in Nginx
3. Deploy using Docker Compose:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Contributing

See the [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) for information on contributing to the project.