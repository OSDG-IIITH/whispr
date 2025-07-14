"""
Schemas for report data.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, UUID4
from pydantic.version import VERSION as PYDANTIC_VERSION
from enum import Enum


class ReportType(str, Enum):
    """Enumeration for report types."""
    SPAM = "spam"
    HARASSMENT = "harassment"
    INAPPROPRIATE = "inappropriate"
    MISINFORMATION = "misinformation"
    OTHER = "other"


class ReportStatus(str, Enum):
    """Enumeration for report statuses."""
    PENDING = "pending"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class ReportBase(BaseModel):
    """
    Base schema for report.
    """
    report_type: ReportType
    reason: str


class ReportCreate(ReportBase):
    """
    Schema for creating a report.
    """
    review_id: Optional[UUID4] = None
    reply_id: Optional[UUID4] = None
    reported_user_id: Optional[UUID4] = None


class ReportUpdate(BaseModel):
    """
    Schema for updating a report (admin only).
    """
    status: Optional[ReportStatus] = None
    admin_notes: Optional[str] = None


class ReportInDBBase(ReportBase):
    """
    Base schema for reports in the database.
    """
    id: UUID4
    reporter_id: UUID4
    review_id: Optional[UUID4] = None
    reply_id: Optional[UUID4] = None
    reported_user_id: Optional[UUID4] = None
    status: ReportStatus
    admin_notes: Optional[str] = None
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


class Report(ReportInDBBase):
    """
    Schema for report response.
    """
    pass


class ReportWithDetails(Report):
    """
    Schema for report with detailed information.
    """
    reporter: Optional[dict] = None
    reported_user: Optional[dict] = None
