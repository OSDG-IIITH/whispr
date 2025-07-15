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

    rating = Column(Integer, nullable=False)
    content = Column(Text, nullable=True)
    semester = Column(Text, nullable=True)
    year = Column(Integer, nullable=True)

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
    course_instructor_reviews = relationship(
        "CourseInstructorReview", back_populates="review",
        cascade="all, delete-orphan")
    replies = relationship("Reply", back_populates="review",
                           cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="review",
                         cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="review",
                          cascade="all, delete-orphan")

    @property
    def course_instructors(self):
        """
        Get the course instructors associated with this review.
        Returns a list of course instructor objects with their course and professor details.
        """
        if not self.course_instructor_reviews:
            return []
        
        instructors = []
        for cir in self.course_instructor_reviews:
            if cir.course_instructor:
                instructors.append(cir.course_instructor)
        return instructors

    @property
    def effective_course(self):
        """
        Get the effective course for this review.
        If course_id is null but course_instructors exist, return the course from the first instructor.
        """
        if self.course:
            return self.course
        elif self.course_instructors:
            return self.course_instructors[0].course
        return None

    # Ensure at least one of course_id, professor_id, or course_instructor_reviews is not null
    # Also ensure that rating is between 1 and 5
    __table_args__ = (
        CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="check_rating_range"
        ),
    )
