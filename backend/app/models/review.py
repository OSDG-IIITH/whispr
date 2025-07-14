"""
Review model for storing reviews of courses and professors.
"""

import uuid
from datetime import datetime
from sqlalchemy import (Column, Integer, DateTime, Text,
                        Boolean, ForeignKey, CheckConstraint)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class Review(Base):
    """
    Review model for storing reviews of courses and professors.
    """
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey(
        "courses.id", ondelete="CASCADE"), nullable=True, index=True)
    professor_id = Column(UUID(as_uuid=True), ForeignKey(
        "professors.id", ondelete="CASCADE"), nullable=True, index=True)
    course_instructor_id = Column(UUID(as_uuid=True), ForeignKey(
        "course_instructors.id", ondelete="CASCADE"), nullable=True, index=True
    )

    rating = Column(Integer, nullable=False)
    content = Column(Text, nullable=True)

    # Stats
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)

    # Flags
    is_edited = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="reviews")
    course = relationship("Course", back_populates="reviews")
    professor = relationship("Professor", back_populates="reviews")
    course_instructor = relationship(
        "CourseInstructor", back_populates="reviews")
    replies = relationship("Reply", back_populates="review",
                           cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="review",
                         cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="review",
                          cascade="all, delete-orphan")

    # Ensure at least one of course_id, professor_id,
    # or course_instructor_id is not null
    # Also ensure that rating is between 1 and 5
    __table_args__ = (
        CheckConstraint(
            "(course_id IS NOT NULL) OR (professor_id IS NOT NULL) \
OR (course_instructor_id IS NOT NULL)",
            name="check_review_target"
        ),
        CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="check_rating_range"
        ),
    )
