"""
Initialize the database by creating tables for all models.
"""

from app.db.session import engine, Base
# Import all models to ensure they're registered with Base
from app.models import *


async def create_tables():
    """
    Create database tables for all models.
    """
    async with engine.begin() as conn:
        # Create tables based on models
        await conn.run_sync(Base.metadata.create_all)
