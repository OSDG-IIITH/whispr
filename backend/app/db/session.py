"""
Database session setup.
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    create_async_engine, async_sessionmaker, AsyncSession)
from sqlalchemy.orm import declarative_base

from app.core.config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    echo=False,
    future=True,
)

# Create async session factory
async_session = async_sessionmaker(
    engine,
    expire_on_commit=False,
)

# Base class for all the models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting async database session.
    """
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
