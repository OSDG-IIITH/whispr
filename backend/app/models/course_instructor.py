"""
CourseInstructor model for linking professors to courses.
"""

import uuid
from datetime import datetime
from sqlalchemy import (Column, String, Integer, DateTime,
                        ForeignKey, UniqueConstraint, Text, Numeric)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class CourseInstructor(Base):
    """
    CourseInstructor model for linking professors to courses.
    """
    __tablename__ = "course_instructors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    professor_id = Column(UUID(as_uuid=True), ForeignKey(
        "professors.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey(
        "courses.id", ondelete="CASCADE"), nullable=False, index=True)
    semester = Column(String(20), nullable=True)
    year = Column(Integer, nullable=True)
    summary = Column(Text, nullable=True)
    review_count = Column(Integer, default=0)
    average_rating = Column(Numeric(3, 2), default=0.0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    professor = relationship("Professor", back_populates="course_instructors")
    course = relationship("Course", back_populates="course_instructors")
    course_instructor_reviews = relationship(
        "CourseInstructorReview", back_populates="course_instructor",
        cascade="all, delete-orphan")

    # Ensure uniqueness of professor-course-semester-year combination
    __table_args__ = (
        UniqueConstraint('professor_id', 'course_id', 'semester',
                         'year', name='uix_course_instructor'),
    )
