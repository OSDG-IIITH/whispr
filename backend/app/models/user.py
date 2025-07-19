"""
User model for authentication and profile information.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, String, Integer, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base
from app.models.user_followers import user_followers


class User(Base):
    """
    User model for authentication and profile information.
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    student_since_year = Column(Integer, nullable=True)
    is_muffled = Column(Boolean, default=True)
    echoes = Column(Integer, default=0)

    # Admin and moderation fields
    is_admin = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    ban_reason = Column(Text, nullable=True)
    banned_until = Column(DateTime(timezone=True), nullable=True) # None for permanent ban
    banned_by = Column(String(50), nullable=True) # Username of the admin who banned the user
    banned_at = Column(DateTime(timezone=True), nullable=True) # When the user was banned

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    following = relationship(
        "User",
        secondary=user_followers,
        primaryjoin=(id == user_followers.c.follower_id),
        secondaryjoin=(id == user_followers.c.followed_id),
        backref="followers"
    )

    # Relationship to other models
    reviews = relationship("Review", back_populates="user",
                           cascade="all, delete-orphan")
    replies = relationship("Reply", back_populates="user",
                           cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="user",
                         cascade="all, delete-orphan")
    notifications = relationship(
        "Notification",
        foreign_keys="Notification.username",
        primaryjoin="User.username==Notification.username",
        cascade="all, delete-orphan"
    )
    reports_made = relationship("Report", foreign_keys="Report.reporter_id",
                               back_populates="reporter",
                               cascade="all, delete-orphan")
    reports_received = relationship("Report", foreign_keys="Report.reported_user_id",
                                   back_populates="reported_user",
                                   cascade="all, delete-orphan")
