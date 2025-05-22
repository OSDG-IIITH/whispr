"""
Schemas for authentication tokens.
"""

from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    """
    Token schema for JWT token response.
    """
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """
    Token payload schema for JWT token.
    """
    sub: Optional[str] = None
