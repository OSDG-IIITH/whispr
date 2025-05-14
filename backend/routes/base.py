"""
Base router and authentication utilities for API routes.

This module provides the base router setup and authentication
utilities that other route modules can use.
"""
from datetime import datetime, timedelta
from typing import Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt

from managers.user import UserManager
from config import Config

# Create main API router
api_router = APIRouter(prefix="/api")

# OAuth2 scheme for token-based authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# JWT authentication functions
def create_access_token(
        data: Dict, expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.

    Args:
        data: Payload data to include in the token
        expires_delta: Optional expiration time delta

    Returns:
        Encoded JWT token as string
    """
    to_encode = data.copy()
    expire = datetime.utcnow()

    if expires_delta:
        expire += expires_delta
    else:
        expire += timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, Config.SECRET_KEY, algorithm=Config.ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict:
    """
    Get the current user from JWT token.

    Args:
        token: JWT token from authorization header

    Returns:
        Current user document

    Raises:
        HTTPException: If authentication fails
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM]
        )
        user_id: str = payload.get("sub")

        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError as exc:
        raise credentials_exception from exc

    user_manager = UserManager()
    user = await user_manager.get_by_id(user_id)

    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: Dict = Depends(get_current_user)
) -> Dict:
    """
    Get the current active user and verify they are not muffled.

    Args:
        current_user: Current authenticated user

    Returns:
        Current active user document

    Raises:
        HTTPException: If user is inactive or muffled
    """
    if current_user.get("muffled", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is currently muffled. Please verify via CAS."
        )
    return current_user


# Extend this function if admin users are needed
async def get_current_admin_user(
    current_user: Dict = Depends(get_current_user)
) -> Dict:
    """
    Get the current admin user.

    Args:
        current_user: Current authenticated user

    Returns:
        Current admin user document

    Raises:
        HTTPException: If user is not an admin
    """
    # This is a placeholder - implement proper admin check
    is_admin = current_user.get("is_admin", False)

    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return current_user
