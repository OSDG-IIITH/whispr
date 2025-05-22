"""
Vote model for storing votes on reviews and replies.
"""

import uuid
from datetime import datetime
from sqlalchemy import (Column, DateTime, Boolean,
                        ForeignKey, CheckConstraint, UniqueConstraint)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class Vote(Base):
    """
    Vote model for storing votes on reviews and replies.
    """
    __tablename__ = "votes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    review_id = Column(UUID(as_uuid=True), ForeignKey(
        "reviews.id", ondelete="CASCADE"), nullable=True, index=True)
    reply_id = Column(UUID(as_uuid=True), ForeignKey(
        "replies.id", ondelete="CASCADE"), nullable=True, index=True)

    # TRUE for upvote, FALSE for downvote
    vote_type = Column(Boolean, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="votes")
    review = relationship("Review", back_populates="votes")
    reply = relationship("Reply", back_populates="votes")

    # Ensure that a vote is either for a review or a reply, but not both
    # Also ensure that a user can only vote once per review/reply
    __table_args__ = (
        CheckConstraint(
            "(review_id IS NOT NULL AND reply_id IS NULL) OR \
(review_id IS NULL AND reply_id IS NOT NULL)",
            name="check_vote_target"
        ),
        UniqueConstraint("user_id", "review_id", name="uix_user_review_vote"),
        UniqueConstraint("user_id", "reply_id", name="uix_user_reply_vote"),
    )
