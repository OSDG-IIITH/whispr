"""
Schemas for reply data.
"""

from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, UUID4
from pydantic.version import VERSION as PYDANTIC_VERSION

config_dict = {}
if PYDANTIC_VERSION.startswith('2.'):
    config_dict = {"from_attributes": True}
else:
    config_dict = {"orm_mode": True}


class ReplyBase(BaseModel):
    """
    Base schema for reply.
    """
    content: str


class ReplyCreate(ReplyBase):
    """
    Schema for creating a reply.
    """
    review_id: UUID4


class ReplyUpdate(BaseModel):
    """
    Schema for updating a reply.
    """
    content: Optional[str] = None


class ReplyInDBBase(ReplyBase):
    """
    Base schema for replies in the database.
    """
    id: UUID4
    review_id: UUID4
    user_id: UUID4
    upvotes: int = 0
    downvotes: int = 0
    is_edited: bool = False
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


class Reply(ReplyInDBBase):
    """
    Schema for reply response.
    """
    pass


class ReplyWithUser(Reply):
    """
    Schema for reply with user information.
    """
    user: Any  # Using Any to avoid circular import
