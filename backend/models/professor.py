"""
Model for storing professor information.

This module defines the Professor model representing academic instructors,
including their profiles, lab affiliations, and review summaries.
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl
from database.helpers import PyObjectId
from bson import ObjectId
from models.review import ReviewSummary


class SocialLink(BaseModel):
    """
    Schema for professor's social media or academic profile links.

    Attributes:
        platform: Name of the platform (e.g., LinkedIn, Google Scholar)
        link: URL to the professor's profile on that platform
    """
    platform: str
    link: HttpUrl


class Professor(BaseModel):
    """
    Professor model represents academic instructors in the system.

    Attributes:
        id: Unique identifier for the professor
        name: Full name of the professor
        lab: Research laboratory affiliation
        socials: List of social media and academic profile links
        review_summary: Aggregated statistics from student reviews
        created_at: Timestamp when the record was created
        updated_at: Timestamp when the record was last updated
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    lab: Optional[str] = None
    socials: List[SocialLink] = []
    review_summary: ReviewSummary = Field(default_factory=ReviewSummary)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    model_config = {
        """Pydantic model configuration."""
        "validate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str, HttpUrl: str},
        "json_schema_extra": {
            "example": {
                "_id": "60d5ec9af682fbd3d45323a8",
                "name": "Dr. Jane Smith",
                "lab": "SERC",
                "socials": [
                    {
                        "platform": "Google Scholar",
                        "link": "https://scholar.google.com/profile/example"
                    },
                    {
                        "platform": "LinkedIn",
                        "link": "https://linkedin.com/in/example-profile"
                    }
                ],
                "review_summary": {
                    "count": 24,
                    "overall_rating": 4.2,
                    "text_summary": "They hate the Smiths."
                },
                "created_at": "2023-01-15T12:00:00.000Z",
                "updated_at": "2023-05-18T09:30:00.000Z"
            }
        }
    }


class ProfessorCreate(BaseModel):
    """Schema for creating a new professor record."""
    name: str
    lab: Optional[str] = None
    socials: Optional[List[SocialLink]] = []


class ProfessorUpdate(BaseModel):
    """Schema for updating professor information."""
    name: Optional[str] = None
    lab: Optional[str] = None
    socials: Optional[List[SocialLink]] = None
