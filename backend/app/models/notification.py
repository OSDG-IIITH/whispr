"""
Notification model for storing user notifications.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class Notification(Base):
    """
    Notification model for storing user notifications.
    """
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), ForeignKey(
        "users.username", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)
    content = Column(Text, nullable=False)

    # Source of the notification (e.g., review_id, reply_id, user_id)
    source_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    source_type = Column(String(50), nullable=True)

    # Actor that triggered the notification (optional)
    actor_username = Column(String(50), ForeignKey(
        "users.username", ondelete="CASCADE"), nullable=True, index=True)

    # Read status
    is_read = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
