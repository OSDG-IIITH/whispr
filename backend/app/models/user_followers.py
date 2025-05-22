"""
User followers association table.
"""

from sqlalchemy import Column, ForeignKey, Table, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base
from datetime import datetime

# Association table for user following
user_followers = Table(
    'user_followers',
    Base.metadata,
    Column('follower_id', UUID(as_uuid=True), ForeignKey(
        'users.id', ondelete="CASCADE"), primary_key=True),
    Column('followed_id', UUID(as_uuid=True), ForeignKey(
        'users.id', ondelete="CASCADE"), primary_key=True),
    Column('created_at', DateTime(timezone=True), default=datetime.utcnow)
)
