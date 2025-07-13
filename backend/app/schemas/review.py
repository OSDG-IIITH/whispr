"""
Schemas for review data.
"""

from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, UUID4, Field, validator
from pydantic.version import VERSION as PYDANTIC_VERSION

config_dict = {}
if PYDANTIC_VERSION.startswith('2.'):
    config_dict = {"from_attributes": True}
else:
    config_dict = {"orm_mode": True}


class ReviewBase(BaseModel):
    """
    Base schema for review.
    """
    rating: int = Field(..., ge=1, le=5)
    content: Optional[str] = None


class ReviewCreate(ReviewBase):
    """
    Schema for creating a review.
    """
    course_id: Optional[UUID4] = None
    professor_id: Optional[UUID4] = None
    course_instructor_id: Optional[UUID4] = None

    @validator('course_id', 'professor_id', 'course_instructor_id')
    def check_at_least_one_target(cls, v, values):
        if v is None and not any(values.get(field) for field in [
                'course_id', 'professor_id', 'course_instructor_id']):
            raise ValueError(
                'At least one of course_id, professor_id, \
or course_instructor_id must be provided')
        return v


class ReviewUpdate(BaseModel):
    """
    Schema for updating a review.
    """
    rating: Optional[int] = Field(None, ge=1, le=5)
    content: Optional[str] = None


class ReviewInDBBase(ReviewBase):
    """
    Base schema for reviews in the database.
    """
    id: UUID4
    user_id: UUID4
    course_id: Optional[UUID4] = None
    professor_id: Optional[UUID4] = None
    course_instructor_id: Optional[UUID4] = None
    upvotes: int = 0
    downvotes: int = 0
    is_edited: bool = False
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


class Review(ReviewInDBBase):
    """
    Schema for review response.
    """
    pass


from app.schemas.user import User


class ReviewWithUser(Review):
    """
    Schema for review with user information.
    """
    user: User
