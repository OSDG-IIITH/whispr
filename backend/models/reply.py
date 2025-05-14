"""
Reply model for responses to reviews.

This module defines the Reply model representing user responses
to reviews of courses and professors.
"""
from datetime import datetime
from pydantic import BaseModel, Field
from database.helpers import PyObjectId
from bson import ObjectId


class Reply(BaseModel):
    """
    Reply model represents responses to reviews.

    Attributes:
        id: Unique reply identifier
        review_id: ID of the review being replied to
        replier_id: ID of the user who wrote the reply
        edited: Whether the reply has been edited
        timestamp: When the reply was created
        content: Textual content of the reply
        upvote_count: Number of upvotes the reply has received
        downvote_count: Number of downvotes the reply has received
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    review_id: PyObjectId
    replier_id: PyObjectId
    edited: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    content: str = Field(..., max_length=4096)
    upvote_count: int = 0
    downvote_count: int = 0

    class Config:
        """Pydantic model configuration."""
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "_id": "60d5ec9af682fbd3d45323a9",
                "review_id": "60d5ec9af682fbd3d45323a6",
                "replier_id": "60d5ec9af682fbd3d45323a4",
                "edited": False,
                "timestamp": "2023-03-16T14:45:00.000Z",
                "content": "You suck almost as much as the course!",
                "upvote_count": 8,
                "downvote_count": 1
            }
        }


class ReplyCreate(BaseModel):
    """Schema for reply creation requests."""
    review_id: str
    content: str


class ReplyUpdate(BaseModel):
    """Schema for reply update requests."""
    content: str
