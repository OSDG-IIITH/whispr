"""
Model for storing course information.

This module defines the Course model representing academic courses offered
by the institution, including their names, codes, and documentation.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl
from database.helpers import PyObjectId
from bson import ObjectId
from models.review import ReviewSummary


class Course(BaseModel):
    """
    Course model represents academic courses in the system.

    Attributes:
        id: Unique identifier for the course
        name: Full title of the course
        code: Course code in the institution's catalog
        official_documentation: URL to the official course documentation
        description: Detailed description of the course content
        credits: Number of academic credits for the course
        created_at: Timestamp when the record was created
        updated_at: Timestamp when the record was last updated
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    code: str
    official_documentation: Optional[HttpUrl] = None
    description: Optional[str] = None
    credits: Optional[int] = None
    review_summary: ReviewSummary = Field(default_factory=ReviewSummary)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Pydantic v2 model configuration
    model_config = {
        "validate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_schema_extra": {
            "example": {
                "_id": "60d5ec9af682fbd3d45323a7",
                "name": "Software Programming for Performance",
                "code": "CS4390",
                "official_documentation": "https://example.edu/courses/cs4390",
                "description": "100% ChatGPT course.",
                "credits": 2,
                "created_at": "2023-01-10T09:00:00.000Z",
                "updated_at": "2023-04-12T14:30:00.000Z"
            }
        }}


class CourseCreate(BaseModel):
    """Schema for creating a new course record."""
    name: str
    code: str
    official_documentation: Optional[HttpUrl] = None
    description: Optional[str] = None
    credits: Optional[int] = None


class CourseUpdate(BaseModel):
    """Schema for updating course information."""
    name: Optional[str] = None
    code: Optional[str] = None
    official_documentation: Optional[HttpUrl] = None
    description: Optional[str] = None
    credits: Optional[int] = None
