"""
Review model for course and professor evaluations.

This module defines the Review model representing user-submitted evaluations
of courses and professors, including ratings and textual feedback.
"""
from enum import Enum
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from database.helpers import PyObjectId
from bson import ObjectId


class ReviewType(str, Enum):
    """
    Enum for review types.
    """
    COURSE = "course"
    PROFESSOR = "professor"


class Review(BaseModel):
    """
    Review model represents user evaluations of courses or professors.

    Attributes:
        id: Unique review identifier
        type: Type of review (course or professor)
        type_id: ID of the course or professor being reviewed
        reviewer_id: ID of the user who submitted the review
        rating: Numeric rating (typically 1-5)
        edited: Whether the review has been edited
        content: Textual content of the review
        timestamp: When the review was created
        instructor_ids: list of IDs of the instructors for course reviews
        semester: Semester during which the course was taken
        year: Year during which the course was taken
        upvote_count: Number of upvotes the review has received
        downvote_count: Number of downvotes the review has received
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    type: ReviewType
    type_id: PyObjectId
    reviewer_id: PyObjectId
    rating: float = Field(ge=1, le=5)
    edited: bool = False
    content: str = Field(..., max_length=4096)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    instructor_ids: List[PyObjectId] = []
    semester: Optional[str] = None
    year: Optional[int] = None
    upvote_count: int = 0
    downvote_count: int = 0

    class Config:
        """Pydantic model configuration."""
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "_id": "60d5ec9af682fbd3d45323a6",
                "type": "course",
                "type_id": "60d5ec9af682fbd3d45323a7",
                "reviewer_id": "60d5ec9af682fbd3d45323a4",
                "rating": 4.5,
                "edited": False,
                "content": "Greatly cursed course",
                "timestamp": "2023-03-15T09:30:00.000Z",
                "instructor_ids": ["60d5ec9af682fbd3d45323a8"],
                "semester": "Fall",
                "year": 2023,
                "upvote_count": 15,
                "downvote_count": 2
            }
        }


class ReviewCreate(BaseModel):
    """Schema for review creation requests."""
    type: ReviewType
    type_id: str
    rating: float = Field(ge=1, le=5)
    content: str
    instructor_id: Optional[str] = None
    semester: Optional[str] = None
    year: Optional[int] = None


class ReviewUpdate(BaseModel):
    """Schema for review update requests."""
    rating: Optional[float] = Field(None, ge=1, le=5)
    content: Optional[str] = None


class ReviewSummary(BaseModel):
    """
    Summary statistics for course or professor reviews.

    Attributes:
        count: Number of reviews received
        overall_rating: Average rating across all reviews
        text_summary: Optional summary of review sentiments
    """
    count: int = 0
    overall_rating: float = 0.0
    text_summary: Optional[str] = None
