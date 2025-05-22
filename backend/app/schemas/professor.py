"""
Schemas for professor data.
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
    Base schema for professor.
    """
    name: str
    lab: Optional[str] = None
    review_summary: Optional[str] = None


class ProfessorCreate(ProfessorBase):
    """
    Schema for creating a professor.
    """
    pass


class ProfessorUpdate(BaseModel):
    """
    Schema for updating a professor.
    """
    name: Optional[str] = None
    lab: Optional[str] = None
    review_summary: Optional[str] = None


class ProfessorInDBBase(ProfessorBase):
    """
    Base schema for professors in the database.
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


class Professor(ProfessorInDBBase):
    """
    Schema for professor response.
    """
    pass


# Schema for including social media with professor
class ProfessorWithSocialMedia(Professor):
    """
    Schema for professor with social media.
    """
    social_media: List[Any] = []  # Using Any to avoid circular import
