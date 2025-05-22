# Backend Implementation Guide

This guide provides an overview of the Whispr API backend implementation.

## Architecture

The backend uses FastAPI with SQLAlchemy for ORM, Pydantic for schema validation, and PostgreSQL for the database.

### Key Components

- **Models**: SQLAlchemy models representing database tables
- **Schemas**: Pydantic schemas for request/response validation
- **Routes**: API endpoints organized by resource
- **Auth**: JWT-based authentication with cookie support

## Database Schema

The database schema is defined in `init-scripts/01-init.sql` and includes:

- `users`: User accounts
- `professors`: Professor information
- `professor_social_media`: Professor social media links
- `courses`: Course information
- `course_instructors`: Links professors to courses for specific semesters
- `reviews`: Reviews for courses, professors, or course instructors
- `replies`: Replies to reviews
- `votes`: Upvotes/downvotes for reviews and replies
- `notifications`: User notifications
- `used_emails`: Tracks emails used for verification

## Authentication

The authentication system uses JWT tokens with cookie support:

- `/auth/login`: Login with username/password
- `/auth/register`: Register a new user
- `/auth/logout`: Logout (clear cookie)
- `/auth/verify-email`: Verify email address

## API Endpoints

The API is organized into the following main resources:

- `/users`: User management
- `/professors`: Professor management
- `/courses`: Course management
- `/course-instructors`: Course instructor management
- `/reviews`: Review management
- `/replies`: Reply management
- `/votes`: Vote management
- `/notifications`: Notification management
- `/search`: Global search functionality

### Search Functionality

The search API provides powerful search capabilities across all entities:

- `GET /search`: Search with query parameters
- `POST /search`: Search with request body (for more complex queries)

Search features include:

- **Basic search**: Searches through names, codes, and IDs
- **Deep search**: (`deep=true`) Also searches through content fields
- **Filtering**: Filter by entity type, course ID, professor ID, ratings, etc.
- **Sorting**: Sort by relevance, name, rating, creation date, etc.
- **Pagination**: Skip and limit parameters for pagination

## Development

1. Use `pip install -r requirements.txt` to install dependencies
2. Set up PostgreSQL and run the SQL init script
3. Create a `.env` file with configuration (see `app/core/config.py` for options)
4. Run the server with `uvicorn main:app --reload`

## Documentation

API documentation is available at `/docs` or `/redoc` when the server is running.

## Testing

Tests are located in the `tests` directory and can be run with pytest:

```bash
pytest
```