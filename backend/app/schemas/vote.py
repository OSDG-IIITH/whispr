"""
Schemas for vote data.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, UUID4, model_validator
from pydantic.version import VERSION as PYDANTIC_VERSION

config_dict = {}
if PYDANTIC_VERSION.startswith('2.'):
    config_dict = {"from_attributes": True}
else:
    config_dict = {"orm_mode": True}


class VoteBase(BaseModel):
    """
    Base schema for vote.
    """
    vote_type: bool  # True for upvote, False for downvote


class VoteCreate(VoteBase):
    """
    Schema for creating a vote.
    """
    review_id: Optional[UUID4] = None
    reply_id: Optional[UUID4] = None

    @model_validator(mode='after')
    def check_exactly_one_target(self) -> 'VoteCreate':
        if self.review_id is not None and self.reply_id is not None:
            raise ValueError("Cannot vote on both a review and a reply")
        if self.review_id is None and self.reply_id is None:
            raise ValueError("Must vote on either a review or a reply")
        return self


class VoteUpdate(BaseModel):
    """
    Schema for updating a vote.
    """
    vote_type: Optional[bool] = None


class VoteInDBBase(VoteBase):
    """
    Base schema for votes in the database.
    """
    id: UUID4
    user_id: UUID4
    review_id: Optional[UUID4] = None
    reply_id: Optional[UUID4] = None
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


class Vote(VoteInDBBase):
    """
    Schema for vote response.
    """
    pass
