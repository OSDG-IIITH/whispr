"""
Notification model for user system notifications.

This module defines the Notification model representing system notifications
for users, including alerts about mentions, votes, and system events.
"""
from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from database.helpers import PyObjectId
from bson import ObjectId


class NotificationType(str, Enum):
    """
    Enum for notification types.
    """
    MENTION = "mention"           # User mentioned in content
    VOTE = "vote"                 # User received a vote
    REPLY = "reply"               # User's content received a reply
    RANK_CHANGE = "rank_change"   # User's rank changed
    SYSTEM = "system"             # System notification


class Notification(BaseModel):
    """
    Notification model represents system notifications for users.

    Attributes:
        id: Unique notification identifier
        username: Username of the notification recipient
        type: Type of notification
        message: Text content of the notification
        read: Whether the notification has been read
        source_id: ID of the content that triggered the notification
        source_type: Type of content that triggered the notification
        actor_username: Username of the user who triggered the notification
        timestamp: When the notification was created
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    username: str
    type: NotificationType
    message: str
    read: bool = False
    source_id: Optional[str] = None
    source_type: Optional[str] = None
    actor_username: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        """Pydantic model configuration."""
        "validate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "_id": "60d5ec9af682fbd3d45323c1",
                "username": "student_123",
                "type": "mention",
                "message": "You were mentioned in a review",
                "read": False,
                "source_id": "60d5ec9af682fbd3d45323a6",
                "source_type": "review",
                "actor_username": "other_student",
                "timestamp": "2023-03-16T15:30:00.000Z"
            }
        }
    }


class NotificationCreate(BaseModel):
    """Schema for notification creation requests."""
    username: str
    type: NotificationType
    message: str
    source_id: Optional[str] = None
    source_type: Optional[str] = None
    actor_username: Optional[str] = None
