"""
Configuration settings for the application.
"""

from typing import List, Literal, Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator
from dotenv import load_dotenv
import json

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

    # CORS settings - can be JSON string or comma-separated values
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

    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def validate_cors_origins(cls, v):
        """Parse CORS origins from JSON string or return as-is if already a list."""
        if isinstance(v, str):
            try:
                # Try to parse as JSON first
                return json.loads(v)
            except json.JSONDecodeError:
                # If JSON parsing fails, treat as comma-separated string
                return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v

    @field_validator('ALLOWED_EMAIL_DOMAINS', mode='before')
    @classmethod
    def validate_allowed_domains(cls, v):
        """Parse allowed email domains from JSON string or return as-is if already a list."""
        if isinstance(v, str):
            try:
                # Try to parse as JSON first
                return json.loads(v)
            except json.JSONDecodeError:
                # If JSON parsing fails, treat as comma-separated string
                return [domain.strip() for domain in v.split(',') if domain.strip()]
        return v

    class Config:
        """
        Configuration for Pydantic settings.
        """
        env_file = ".env"
        case_sensitive = True


settings = Settings()
