"""
Schemas for course data.
"""

from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, UUID4, Field
from pydantic.version import VERSION as PYDANTIC_VERSION

config_dict = {}
if PYDANTIC_VERSION.startswith('2.'):
    config_dict = {"from_attributes": True}
else:
    config_dict = {"orm_mode": True}


class ProfessorBase(BaseModel):
    """
    Base schema for professor in course instructor context.
    """
    id: UUID4
    name: str
    lab: Optional[str] = None

    class Config:
        """
        Configuration for Pydantic models.
        """
        if PYDANTIC_VERSION.startswith('2.'):
            from_attributes = True
        else:
            orm_mode = True


class CourseInstructorWithProfessor(BaseModel):
    """
    Schema for course instructor with professor information.
    """
    id: UUID4
    professor_id: UUID4
    course_id: UUID4
    semester: Optional[str] = None
    year: Optional[int] = None
    summary: Optional[str] = None
    review_count: int = 0
    average_rating: Decimal = Field(default=Decimal('0.0'), decimal_places=2)
    created_at: datetime
    professor: ProfessorBase

    class Config:
        """
        Configuration for Pydantic models.
        """
        if PYDANTIC_VERSION.startswith('2.'):
            from_attributes = True
        else:
            orm_mode = True


class CourseBase(BaseModel):
    """
    Base schema for course.
    """
    code: str
    name: str
    credits: Optional[int] = None
    description: Optional[str] = None
    official_document_url: Optional[str] = None
    review_summary: Optional[str] = None


class CourseCreate(CourseBase):
    """
    Schema for creating a course.
    """
    pass


class CourseUpdate(BaseModel):
    """
    Schema for updating a course.
    """
    name: Optional[str] = None
    credits: Optional[int] = None
    description: Optional[str] = None
    official_document_url: Optional[str] = None
    review_summary: Optional[str] = None


class CourseInDBBase(CourseBase):
    """
    Base schema for courses in the database.
    """
    id: UUID4
    review_count: int = 0
    average_rating: Decimal = Field(default=Decimal('0.0'), decimal_places=2)
    created_at: datetime
    updated_at: datetime

    class Config:
        """
        Configuration for Pydantic models.
        """
        if PYDANTIC_VERSION.startswith('2.'):
            from_attributes = True
        else:
            orm_mode = True


class Course(CourseInDBBase):
    """
    Schema for course response.
    """
    pass


class CourseWithInstructors(Course):
    """
    Schema for course response with instructor information.
    """
    course_instructors: List[CourseInstructorWithProfessor] = []
