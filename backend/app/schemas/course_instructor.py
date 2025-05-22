"""
Schemas for course instructor data.
"""

from typing import Optional, Any
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, UUID4, Field
from pydantic.version import VERSION as PYDANTIC_VERSION

config_dict = {}
if PYDANTIC_VERSION.startswith('2.'):
    config_dict = {"from_attributes": True}
else:
    config_dict = {"orm_mode": True}


class CourseInstructorBase(BaseModel):
    """
    Base schema for course instructor.
    """
    semester: Optional[str] = None
    year: Optional[int] = None
    summary: Optional[str] = None


class CourseInstructorCreate(CourseInstructorBase):
    """
    Schema for creating a course instructor.
    """
    professor_id: UUID4
    course_id: UUID4


class CourseInstructorUpdate(BaseModel):
    """
    Schema for updating a course instructor.
    """
    semester: Optional[str] = None
    year: Optional[int] = None
    summary: Optional[str] = None


class CourseInstructorInDBBase(CourseInstructorBase):
    """
    Base schema for course instructors in the database.
    """
    id: UUID4
    professor_id: UUID4
    course_id: UUID4
    review_count: int = 0
    average_rating: Decimal = Field(default=Decimal('0.0'), decimal_places=2)
    created_at: datetime

    class Config:
        """
        Configuration for Pydantic models.
        """
        if PYDANTIC_VERSION.startswith('2.'):
            from_attributes = True
        else:
            orm_mode = True


class CourseInstructor(CourseInstructorInDBBase):
    """
    Schema for course instructor response.
    """
    pass


class CourseInstructorDetail(CourseInstructor):
    """
    Schema for course instructor with detailed information.
    """
    professor: Any  # Using Any to avoid circular import
    course: Any     # Using Any to avoid circular import
