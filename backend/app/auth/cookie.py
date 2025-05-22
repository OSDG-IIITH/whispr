"""
Cookie handling for authentication.
"""

from fastapi import Response
from app.core.config import settings


def set_auth_cookie(response: Response, token: str) -> None:
    """
    Set the authentication cookie.

    Args:
        response: The FastAPI response.
        token: The JWT token.
    """
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        max_age=settings.JWT_EXPIRATION,
        expires=settings.JWT_EXPIRATION,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
    )


def clear_auth_cookie(response: Response) -> None:
    """
    Clear the authentication cookie.

    Args:
        response: The FastAPI response.
    """
    response.delete_cookie(
        key="auth_token",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
    )
