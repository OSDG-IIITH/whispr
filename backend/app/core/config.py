"""
Configuration settings for the application.
"""

from typing import List, Literal, Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    """
    Application settings with environment variable support.
    """
    # Project settings
    PROJECT_NAME: str = "Whispr"
    API_V1_STR: str = ""

    # Security settings
    JWT_SECRET: str = "supersecretkey"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 86400  # 24 hours in seconds

    # Database settings
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/whispr"
    DATABASE_NAME: str = "whispr"

    # CORS settings - Pydantic will parse comma-separated values automatically
    CORS_ORIGINS: List[str] = ["http://localhost"]

    # Frontend URL
    FRONTEND_URL: str = "http://localhost"

    # Password settings
    MIN_PASSWORD_LENGTH: int = 8

    # Cookie settings
    COOKIE_DOMAIN: str = "localhost"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: Optional[Literal['lax', 'strict', 'none']] = "lax"

    # Email verification settings
    ALLOWED_EMAIL_DOMAINS: List[str] = ["students.iiit.ac.in", "research.iiit.ac.in"]

    # CAS settings
    CAS_SERVER_URL: str = "https://login.iiit.ac.in/cas"
    CAS_SERVICE_URL: str = "http://localhost/api/verify/callback"
    VERIFICATION_SESSION_EXPIRE_MINUTES: int = 30

    class Config:
        """
        Configuration for Pydantic settings.
        """
        env_file = ".env"
        case_sensitive = True


settings = Settings()
