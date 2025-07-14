"""
Configuration settings for the application.
"""

import os
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
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretkey")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRATION: int = int(
        os.getenv("JWT_EXPIRATION", "86400"))  # 24 hours in seconds

    # Database settings
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/whispr")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "whispr")

    # CORS settings
    CORS_ORIGINS: List[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000").split(",")

    # Frontend URL
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Password settings
    MIN_PASSWORD_LENGTH: int = int(os.getenv("MIN_PASSWORD_LENGTH", "8"))

    # Cookie settings
    COOKIE_DOMAIN: str = os.getenv("COOKIE_DOMAIN", "localhost")
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "False").lower() == "true"
    _cookie_samesite_str: str = os.getenv("COOKIE_SAMESITE", "lax").lower()
    COOKIE_SAMESITE: Optional[Literal['lax', 'strict', 'none']] = (
        _cookie_samesite_str if _cookie_samesite_str in (
            "lax", "strict", "none") else None
    )

    # Email verification settings
    ALLOWED_EMAIL_DOMAINS: List[str] = os.getenv(
        "ALLOWED_EMAIL_DOMAINS",
        "students.iiit.ac.in,research.iiit.ac.in"
    ).split(",")

    # CAS settings
    CAS_SERVER_URL: str = os.getenv(
        "CAS_SERVER_URL", "https://login.iiit.ac.in/cas")
    CAS_SERVICE_URL: str = os.getenv(
        "CAS_SERVICE_URL", "http://localhost:8000/api/verify/callback")
    VERIFICATION_SESSION_EXPIRE_MINUTES: int = int(
        os.getenv("VERIFICATION_SESSION_EXPIRE_MINUTES", "30")
    )

    class Config:
        """
        Configuration for Pydantic settings.
        """
        env_file = ".env"
        case_sensitive = True


settings = Settings()
