"""
Course model for storing course information.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Numeric, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class Course(Base):
    """
    Course model for storing course information.
    """
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(20), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    credits = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    official_document_url = Column(Text, nullable=True)
    review_summary = Column(Text, nullable=True)
    review_count = Column(Integer, default=0)
    average_rating = Column(Numeric(3, 2), default=0.0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    course_instructors = relationship(
        "CourseInstructor",
        back_populates="course",
        cascade="all, delete-orphan"
    )
    reviews = relationship(
        "Review", back_populates="course", cascade="all, delete-orphan")
