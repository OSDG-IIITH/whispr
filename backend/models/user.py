"""
User model with Pydantic validation for MongoDB storage.

This module defines the User model representing system users, including
their profile data and social interactions within the application.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl
from database.helpers import PyObjectId
from bson import ObjectId


class User(BaseModel):
    """
    User model represents registered users in the system.

    Attributes:
        id: Unique user identifier
        username: User's chosen display name
        avatar: URL to user's profile image
        bio: User's self-description
        student_since: Year when user started as a student
        echoes: User's reputation score in the system
        created_at: When the user account was created
        updated_at: When the user profile was last updated
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    username: str
    avatar: HttpUrl
    bio: Optional[str] = None
    student_since: Optional[int] = None
    echoes: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        """Pydantic model configuration."""
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "_id": "60d5ec9af682fbd3d45323a4",
                "username": "student_123",
                "avatar": "https://example.com/avatar.jpg",
                "bio": "CSD student who passionately hates SPP",
                "student_since": 2022,
                "echoes": 42,
                "created_at": "2023-01-15T12:00:00.000Z",
                "updated_at": "2023-02-20T14:30:00.000Z"
            }
        }


class UserCreate(BaseModel):
    """Schema for user creation requests."""
    username: str
    avatar: HttpUrl
    bio: Optional[str] = None
    student_since: Optional[int] = None


class UserUpdate(BaseModel):
    """Schema for user update requests."""
    avatar: Optional[HttpUrl] = None
    bio: Optional[str] = None
    student_since: Optional[int] = None


class UsernameUpdate(BaseModel):
    """Schema for updating the username."""
    username: str
