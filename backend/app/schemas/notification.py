"""
Schemas for notification data.
"""

from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, UUID4
from pydantic.version import VERSION as PYDANTIC_VERSION

config_dict = {}
if PYDANTIC_VERSION.startswith('2.'):
    config_dict = {"from_attributes": True}
else:
    config_dict = {"orm_mode": True}


class NotificationBase(BaseModel):
    """
    Base schema for notification.
    """
    type: Literal['MENTION', 'VOTE', 'REPLY', 'RANK_CHANGE', 'SYSTEM', 'FOLLOW', 'FOLLOWER_REVIEW', 'FOLLOWER_REPLY']
    content: str
    source_id: Optional[UUID4] = None
    source_type: Optional[str] = None
    actor_username: Optional[str] = None


class NotificationCreate(NotificationBase):
    """
    Schema for creating a notification.
    """
    username: str


class NotificationUpdate(BaseModel):
    """
    Schema for updating a notification.
    """
    is_read: Optional[bool] = None


class NotificationInDBBase(NotificationBase):
    """
    Base schema for notifications in the database.
    """
    id: UUID4
    username: str
    is_read: bool = False
    created_at: datetime

    class Config:
        """
        Configuration for Pydantic models.
        """
        if PYDANTIC_VERSION.startswith('2.'):
            from_attributes = True
        else:
            orm_mode = True


class Notification(NotificationInDBBase):
    """
    Schema for notification response.
    """
    pass
