import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class VerifiedEmail(Base):
    """
    VerifiedEmail model for tracking verified email addresses.
    """
    __tablename__ = "verified_emails"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, unique=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True)

    # Timestamps
    verified_at = Column(DateTime, default=datetime.utcnow)
