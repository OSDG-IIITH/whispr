"""
JWT token handling for authentication.
"""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt import InvalidTokenError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.auth.password import verify_password
from app.schemas.token import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login")


def create_access_token(
        subject: str, expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.

    Args:
        subject: The subject of the token (usually user ID).
        expires_delta: Optional token expiration time.

    Returns:
        The encoded JWT token.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(seconds=settings.JWT_EXPIRATION)

    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    return encoded_jwt


def get_token_from_cookie(request: Request) -> Optional[str]:
    """
    Extract JWT token from auth_token cookie.
    
    Args:
        request: FastAPI request object.
        
    Returns:
        The JWT token if found, None otherwise.
    """
    return request.cookies.get("auth_token")


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get the current user from the JWT token in cookies.

    Args:
        request: FastAPI request object.
        db: Database session.

    Returns:
        The current user.

    Raises:
        HTTPException: If the token is invalid or the user doesn't exist.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Get token from cookie
    token = get_token_from_cookie(request)
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenPayload(sub=user_id)
    except InvalidTokenError:
        raise credentials_exception

    # Get user from database
    stmt = select(User).where(User.id == UUID(token_data.sub))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user


async def get_current_user_from_header(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get the current user from the JWT token in Authorization header.
    This is kept for compatibility with OAuth2PasswordBearer.

    Args:
        token: The JWT token from Authorization header.
        db: Database session.

    Returns:
        The current user.

    Raises:
        HTTPException: If the token is invalid or the user doesn't exist.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenPayload(sub=user_id)
    except InvalidTokenError:
        raise credentials_exception

    # Get user from database
    stmt = select(User).where(User.id == UUID(token_data.sub))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user


async def get_current_unmuffled_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get the current unmuffled user (can post content).

    Args:
        current_user: The current active user.

    Returns:
        The current unmuffled user.

    Raises:
        HTTPException: If the user is muffled.
    """
    if current_user.is_muffled and not current_user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are muffled. Please verify your email to post content."
        )
    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get the current admin user.

    Args:
        current_user: The current active user.

    Returns:
        The current admin user.

    Raises:
        HTTPException: If the user is not an admin.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges, Admin access required"
        )
    return current_user


async def authenticate_user(
    db: AsyncSession,
    username: str,
    password: str
) -> Optional[User]:
    """
    Authenticate a user with username and password.

    Args:
        db: Database session.
        username: The username.
        password: The password.

    Returns:
        The authenticated user or None if authentication fails.
    """
    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        return None

    if not verify_password(password, getattr(user, "hashed_password")):
        return None

    return user
