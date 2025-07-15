"""
Course Instructor Review model for linking reviews to course instructors.
"""

import uuid
from sqlalchemy import Column, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class CourseInstructorReview(Base):
    """
    Junction table for many-to-many relationship between reviews and course instructors.
    """
    __tablename__ = "course_instructor_reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id = Column(UUID(as_uuid=True), ForeignKey(
        "reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    course_instructor_id = Column(UUID(as_uuid=True), ForeignKey(
        "course_instructors.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    review = relationship("Review", back_populates="course_instructor_reviews")
    course_instructor = relationship("CourseInstructor", back_populates="course_instructor_reviews")

    # Ensure unique combinations
    __table_args__ = (
        UniqueConstraint(
            "review_id", "course_instructor_id", 
            name="unique_review_course_instructor"
        ),
    )