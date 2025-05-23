"""
Security utilities for authentication and password handling.
"""

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Union

import jwt
from jwt import InvalidTokenError
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.user import User

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(
        subject: Union[str, int], expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRATION)

    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)


def hash_email(email: str) -> str:
    """
    Generate SHA256 hash of email for anonymous storage.

    This is used to check if an email has been used before
    without storing the actual email address.
    """
    return hashlib.sha256(email.lower().strip().encode()).hexdigest()


def generate_session_token() -> str:
    """Generate secure random session token."""
    return secrets.token_urlsafe(32)


async def get_user_by_token(db: AsyncSession, token: str) -> Optional[User]:
    """Get user from JWT token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET,
                             algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except InvalidTokenError:
        return None

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def authenticate_user(
        db: AsyncSession, username: str, password: str
) -> Optional[User]:
    """Authenticate user with username and password."""
    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(
        password, getattr(user, "hashed_password", "")
    ):
        return None

    return user
