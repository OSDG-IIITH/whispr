import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.user import User
from app.auth.password import get_password_hash
from app.core.config import settings

async def create_admin_user():
    # Check if admin password is configured
    if not settings.ADMIN_DEFAULT_PASSWORD:
        print("Error: ADMIN_DEFAULT_PASSWORD not set in environment variables!")
        print("Please add ADMIN_DEFAULT_PASSWORD=your_password to your .env file")
        return
    if not settings.ADMIN_DEFAULT_USERNAME:
        print("Error: ADMIN_DEFAULT_USERNAME not set in environment variables!")
        print("Please add ADMIN_DEFAULT_USERNAME=your_username to your .env file")
        return
    
    database_url = settings.DATABASE_URL
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)

    # Create engine and session
    engine = create_async_engine(database_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if admin already exists
        existing_admin = await session.execute(
            select(User).where(User.username == "admin")
        )
        existing_admin = existing_admin.scalar_one_or_none()
        
        if existing_admin:
            print("Admin user already exists!")
            return
        
        # Create admin user
        admin_user = User(
            username=settings.ADMIN_DEFAULT_USERNAME,
            hashed_password=get_password_hash(settings.ADMIN_DEFAULT_PASSWORD),
            is_admin=True,
            is_muffled=False,
            echoes=0
        )
        
        session.add(admin_user)
        await session.commit()
        print("Admin user created successfully!")

if __name__ == "__main__":
    asyncio.run(create_admin_user())
