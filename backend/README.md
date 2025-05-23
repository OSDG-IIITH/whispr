# Whispr Backend

The backend API for the Whispr platform built with FastAPI and PostgreSQL.

## Architecture

The backend follows a clean architecture pattern with the following components:

- **API Layer**: FastAPI routes and endpoints
- **Schema Layer**: Pydantic models for validation and serialization
- **Service Layer**: Business logic and operations
- **Model Layer**: SQLAlchemy ORM models for database interaction
- **Database Layer**: PostgreSQL connection and query utilities

## Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/       # API endpoint implementations
│   │   │   ├── auth.py      # Authentication endpoints
│   │   │   ├── users.py     # User management endpoints (to be implemented)
│   │   │   ├── courses.py   # Course endpoints (to be implemented)
│   │   │   └── ...
│   │   └── routes/          # API router definitions
│   │       └── __init__.py  # Main router that includes all endpoints
│   ├── auth/                # Authentication utilities
│   │   ├── jwt.py           # JWT token handling
│   │   ├── password.py      # Password hashing and verification
│   │   └── cookie.py        # Authentication cookie management
│   ├── core/                # Core application components
│   │   └── config.py        # Application configuration
│   ├── db/                  # Database components
│   │   ├── session.py       # Database session management
│   │   └── init_db.py       # Database initialization
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── user.py          # User model
│   │   ├── course.py        # Course model
│   │   ├── professor.py     # Professor model
│   │   └── ...
│   ├── schemas/             # Pydantic schemas for API
│   │   ├── token.py         # Token schemas
│   │   ├── user.py          # User schemas
│   │   └── ...
│   └── utils/               # Utility functions (to be implemented)
├── main.py                  # Application entry point
├── Dockerfile               # Container definition
└── requirements.txt         # Python dependencies
```

## Models

The application uses SQLAlchemy ORM models to interact with the PostgreSQL database:

### User Model

Represents user accounts and profiles:

```python
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    avatar_url = Column(String(255), nullable=True)
    bio = Column(String(500), nullable=True)

    # Status flags
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_muffled = Column(Boolean, default=True)  # Can't post until verified
    is_admin = Column(Boolean, default=False)

    # Stats
    echoes = Column(Integer, default=0)  # Reputation system

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Course Model

Represents academic courses:

```python
class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(20), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    credits = Column(Integer, nullable=True)
    department = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)

    # Stats
    review_count = Column(Integer, default=0)
    average_rating = Column(Float, default=0.0)
```

### Professor Model

Represents professors/instructors:

```python
class Professor(Base):
    __tablename__ = "professors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    lab = Column(String(255), nullable=True)
    homepage_url = Column(String(255), nullable=True)
    research_interests = Column(ARRAY(String), nullable=True)

    # Stats
    review_count = Column(Integer, default=0)
    average_rating = Column(Float, default=0.0)
```

## Authentication

The application uses JWT tokens for authentication:

1. **Token Generation**: When a user logs in, a JWT token is generated with the user's ID as the subject
2. **Cookie Storage**: The token is stored in an HTTP-only cookie for frontend use
3. **Token Verification**: Protected routes use the `get_current_user` dependency to verify the token
4. **Authorization Levels**: Different levels of authorization are supported:
   - `get_current_user`: Any authenticated user
   - `get_current_active_user`: User with active account
   - `get_current_unmuffled_user`: User allowed to post content
   - `get_current_admin_user`: User with admin privileges

## API Endpoints

### Currently Implemented

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login and get access token
- `POST /api/auth/logout`: Logout and clear authentication

### To Be Implemented

- User Management:

  - `GET /api/users/me`: Get current user
  - `PUT /api/users/me`: Update current user
  - `GET /api/users/{username}`: Get user by username
  - `POST /api/users/{username}/follow`: Follow a user
  - `POST /api/users/{username}/unfollow`: Unfollow a user

- Courses:

  - `GET /api/courses`: List courses
  - `GET /api/courses/{code}`: Get course by code
  - `POST /api/courses`: Create a course (admin only)
  - `PUT /api/courses/{code}`: Update a course (admin only)
  - `GET /api/courses/{code}/reviews`: Get reviews for a course

- Professors:

  - `GET /api/professors`: List professors
  - `GET /api/professors/{id}`: Get professor by ID
  - `POST /api/professors`: Create a professor (admin only)
  - `PUT /api/professors/{id}`: Update a professor (admin only)
  - `GET /api/professors/{id}/reviews`: Get reviews for a professor

- Reviews:

  - `POST /api/reviews`: Create a review
  - `GET /api/reviews/{id}`: Get review by ID
  - `PUT /api/reviews/{id}`: Update a review
  - `DELETE /api/reviews/{id}`: Delete a review
  - `POST /api/reviews/{id}/vote`: Vote on a review

- Replies:

  - `POST /api/reviews/{id}/replies`: Create a reply
  - `GET /api/replies/{id}`: Get reply by ID
  - `PUT /api/replies/{id}`: Update a reply
  - `DELETE /api/replies/{id}`: Delete a reply
  - `POST /api/replies/{id}/vote`: Vote on a reply

- Search:
  - `GET /api/search`: Search courses and professors

## Development

### Adding a New Endpoint

1. Create a new file in `app/api/endpoints/` for your endpoint group
2. Define your routes using FastAPI's router
3. Import and include your router in `app/api/routes/__init__.py`

Example:

```python
# app/api/endpoints/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.auth.jwt import get_current_user
from app.schemas.user import User

router = APIRouter()

@router.get("/me", response_model=User)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user
```

```python
# app/api/routes/__init__.py
from fastapi import APIRouter
from app.api.routes import auth, users  # Import your new endpoint

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])  # Include your new endpoint
```

### Adding a New Model

1. Create a new file in `app/models/` for your model
2. Define your SQLAlchemy model
3. Import your model in `app/models/__init__.py`

### Adding a New Schema

1. Create a new file in `app/schemas/` for your schema
2. Define your Pydantic schema
3. Import and use your schema in your API endpoints

## Testing

Tests will be implemented using pytest. Each endpoint should have associated tests to ensure proper functionality.

## Deployment

The backend is containerized using Docker. See the main README for deployment instructions.
