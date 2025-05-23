"""
VerificationSession model for temporary CAS verification flow.
"""

import uuid
from datetime import datetime, timedelta
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.db.init_db import Base
from app.core.config import settings


class VerificationSession(Base):
    """
    Temporary storage for CAS verification sessions.

    These sessions are created when a user starts verification
    and deleted immediately after completion (success or failure).
    """
    __tablename__ = "verification_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)
    session_token = Column(String(255), unique=True,
                           nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.expires_at:
            self.expires_at = datetime.utcnow() + timedelta(
                minutes=settings.verification_session_expire_minutes
            )

    @property
    def is_expired(self) -> bool:
        """Check if session has expired."""
        return datetime.utcnow() > self.expires_at
