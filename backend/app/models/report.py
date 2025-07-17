"""
Report model for storing user reports on content.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.db.session import Base


class ReportType(enum.Enum):
    """Enumeration for report types."""
    SPAM = "spam"
    HARASSMENT = "harassment"
    INAPPROPRIATE = "inappropriate"
    MISINFORMATION = "misinformation"
    OTHER = "other"


class ReportStatus(enum.Enum):
    """Enumeration for report statuses."""
    PENDING = "pending"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class Report(Base):
    """
    Report model for storing user reports on content.
    """
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    review_id = Column(UUID(as_uuid=True), ForeignKey(
        "reviews.id", ondelete="CASCADE"), nullable=True, index=True)
    reply_id = Column(UUID(as_uuid=True), ForeignKey(
        "replies.id", ondelete="CASCADE"), nullable=True, index=True)
    reported_user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=True, index=True)
    
    report_type = Column(Enum(ReportType), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(Enum(ReportStatus), default=ReportStatus.PENDING, nullable=False)
    admin_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reports_made")
    reported_user = relationship("User", foreign_keys=[reported_user_id], back_populates="reports_received")
    review = relationship("Review", back_populates="reports")
    reply = relationship("Reply", back_populates="reports")

    ## Admin handling fields
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True, index=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    admin_action = Column(String, nullable=True)  # Action taken by the admin (e.g., "banned user", "deleted content", etc)
