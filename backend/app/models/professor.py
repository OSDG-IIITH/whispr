"""
Professor model for storing professor information.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Numeric, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class Professor(Base):
    """
    Professor model for storing professor information.
    """
    __tablename__ = "professors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    lab = Column(String(255), nullable=True)
    review_summary = Column(Text, nullable=True)
    review_count = Column(Integer, default=0)
    average_rating = Column(Numeric(3, 2), default=0.0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    social_media = relationship(
        "ProfessorSocialMedia",
        back_populates="professor",
        cascade="all, delete-orphan"
    )
    course_instructors = relationship(
        "CourseInstructor",
        back_populates="professor",
        cascade="all, delete-orphan"
    )
    reviews = relationship(
        "Review", back_populates="professor", cascade="all, delete-orphan")
    review_professors = relationship("ReviewProfessor", back_populates="professor",
                                   cascade="all, delete-orphan")
