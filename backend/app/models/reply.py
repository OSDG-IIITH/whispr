"""
Reply model for storing replies to reviews.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class Reply(Base):
    """
    Reply model for storing replies to reviews.
    """
    __tablename__ = "replies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id = Column(UUID(as_uuid=True), ForeignKey(
        "reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)

    # Stats
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)

    # Flags
    is_edited = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    review = relationship("Review", back_populates="replies")
    user = relationship("User", back_populates="replies")
    votes = relationship("Vote", back_populates="reply",
                         cascade="all, delete-orphan")
