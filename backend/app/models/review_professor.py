"""
ReviewProfessor model for linking reviews to multiple professors.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class ReviewProfessor(Base):
    """
    ReviewProfessor model for linking reviews to multiple professors.
    """
    __tablename__ = "review_professors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id = Column(UUID(as_uuid=True), ForeignKey(
        "reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    professor_id = Column(UUID(as_uuid=True), ForeignKey(
        "professors.id", ondelete="CASCADE"), nullable=False, index=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    review = relationship("Review", back_populates="review_professors")
    professor = relationship("Professor", back_populates="review_professors")

    # Ensure uniqueness of review-professor combination
    __table_args__ = (
        UniqueConstraint('review_id', 'professor_id', 
                        name='uix_review_professor'),
    )