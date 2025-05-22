"""
UsedEmail model for tracking which email addresses
have been used for verification.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class UsedEmail(Base):
    """
    UsedEmail model for tracking which email addresses
    have been used for verification.
    This model is completely separated from users to
    maintain privacy - we don't store which user is associated
    with which email, just that an email has been used and verified.
    """
    __tablename__ = "used_emails"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
