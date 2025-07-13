"""
Schemas for user data.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, UUID4, validator
from pydantic.version import VERSION as PYDANTIC_VERSION

from app.core.config import settings

config_dict = {}
if PYDANTIC_VERSION.startswith('2.'):
    config_dict = {"from_attributes": True}
else:
    config_dict = {"orm_mode": True}


class UserBase(BaseModel):
    """
    Base user schema with common fields.
    """
    username: str
    bio: Optional[str] = None
    student_since_year: Optional[int] = None


class UserCreate(BaseModel):
    """
    Schema for creating a user.
    """
    username: str
    password: str = Field(..., min_length=settings.MIN_PASSWORD_LENGTH)
    bio: Optional[str] = None
    student_since_year: Optional[int] = None

    @validator("username")
    def username_alphanumeric(cls, v):
        if not v.isalnum():
            raise ValueError("Username must be alphanumeric")
        return v


class UserUpdate(BaseModel):
    """
    Schema for updating a user.
    """
    username: Optional[str] = None
    bio: Optional[str] = None
    student_since_year: Optional[int] = None
    password: Optional[str] = Field(
        None, min_length=settings.MIN_PASSWORD_LENGTH)

    @validator("username")
    def username_alphanumeric(cls, v):
        if v is not None and not v.isalnum():
            raise ValueError("Username must be alphanumeric")
        return v


class UserInDBBase(UserBase):
    """
    Base schema for users in the database.
    """
    id: UUID4
    is_muffled: bool
    is_admin: bool
    echoes: int
    created_at: datetime
    updated_at: datetime

    class Config:
        """
        Configuration for Pydantic models.
        """
        if PYDANTIC_VERSION.startswith('2.'):
            from_attributes = True
        else:
            orm_mode = True


class User(UserInDBBase):
    """
    Schema for user response.
    """
    pass


class UserInDB(UserInDBBase):
    """
    Schema for user in database.
    """
    hashed_password: str


class UserWithCounts(UserInDBBase):
    """
    Schema for user response with follower/following counts.
    """
    followers_count: int = 0
    following_count: int = 0
