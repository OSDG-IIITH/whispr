"""
Model for storing CAS-verified email addresses.

This module defines the Verified model representing email addresses
that have been already been used through CAS.
"""
from pydantic import BaseModel, Field, EmailStr
from database.helpers import PyObjectId
from bson import ObjectId


class Verified(BaseModel):
    """
    Verified model represents CAS-authenticated email addresses.

    Attributes:
        id: Unique identifier for the record
        email: The verified email address
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr

    class Config:
        """Pydantic model configuration."""
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "_id": "60d5ec9af682fbd3d45323a5",
                "email": "student@example.edu",
            }
        }


class VerifiedCreate(BaseModel):
    """Schema for creating a new verified email record."""
    email: EmailStr
