"""
Schemas for used email data.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, UUID4
from pydantic.version import VERSION as PYDANTIC_VERSION

config_dict = {}
if PYDANTIC_VERSION.startswith('2.'):
    config_dict = {"from_attributes": True}
else:
    config_dict = {"orm_mode": True}


class UsedEmailBase(BaseModel):
    """
    Base schema for used email.
    """
    email: EmailStr


class UsedEmailCreate(UsedEmailBase):
    """
    Schema for creating a used email entry.
    """
    pass


class UsedEmailUpdate(BaseModel):
    """
    Schema for updating a used email entry.
    """
    verified_at: datetime = datetime.utcnow()


class UsedEmailInDBBase(UsedEmailBase):
    """
    Base schema for used emails in the database.
    """
    id: UUID4
    verified_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        """
        Configuration for Pydantic models.
        """
        if PYDANTIC_VERSION.startswith('2.'):
            from_attributes = True
        else:
            orm_mode = True


class UsedEmail(UsedEmailInDBBase):
    """
    Schema for used email response.
    """
    pass
