"""
Schemas for professor social media data.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, UUID4
from pydantic.version import VERSION as PYDANTIC_VERSION

config_dict = {}
if PYDANTIC_VERSION.startswith('2.'):
    config_dict = {"from_attributes": True}
else:
    config_dict = {"orm_mode": True}


class ProfessorSocialMediaBase(BaseModel):
    """
    Base schema for professor social media.
    """
    platform: str
    url: str


class ProfessorSocialMediaCreate(ProfessorSocialMediaBase):
    """
    Schema for creating a professor social media entry.
    """
    professor_id: UUID4


class ProfessorSocialMediaUpdate(BaseModel):
    """
    Schema for updating a professor social media entry.
    """
    platform: Optional[str] = None
    url: Optional[str] = None


class ProfessorSocialMediaInDBBase(ProfessorSocialMediaBase):
    """
    Base schema for professor social media in the database.
    """
    id: UUID4
    professor_id: UUID4
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


class ProfessorSocialMedia(ProfessorSocialMediaInDBBase):
    """
    Schema for professor social media response.
    """
    pass
