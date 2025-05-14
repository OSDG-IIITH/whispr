"""
Vote model for user reactions to reviews and replies.

This module defines the Vote model representing user upvotes and downvotes
on reviews and replies within the application.
"""
from enum import Enum
from pydantic import BaseModel, Field
from database.helpers import PyObjectId
from bson import ObjectId


class ContentType(str, Enum):
    """
    Enum for content types that can be voted on.
    """
    REVIEW = "review"
    REPLY = "reply"


class VoteType(str, Enum):
    """
    Enum for vote types.
    """
    UPVOTE = "upvote"
    DOWNVOTE = "downvote"


class Vote(BaseModel):
    """
    Vote model represents user votes on reviews and replies.

    Attributes:
        id: Unique vote identifier
        user_id: ID of the user who cast the vote
        content_type: Type of content being voted on (review or reply)
        content_id: ID of the review or reply being voted on
        vote_type: Type of vote (upvote or downvote)
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    content_type: ContentType
    content_id: PyObjectId
    vote_type: VoteType

    model_config = {
        """Pydantic model configuration."""
        "validate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "_id": "60d5ec9af682fbd3d45323b1",
                "user_id": "60d5ec9af682fbd3d45323a4",
                "content_type": "review",
                "content_id": "60d5ec9af682fbd3d45323a6",
                "vote_type": "upvote"
            }
        }
    }


class VoteCreate(BaseModel):
    """Schema for vote creation requests."""
    content_type: ContentType
    content_id: str
    vote_type: VoteType


class VoteUpdate(BaseModel):
    """Schema for vote update requests."""
    vote_type: VoteType
