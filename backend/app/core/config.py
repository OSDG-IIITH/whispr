"""
Configuration settings for the application.
"""

from typing import List, Literal, Optional
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import field_validator
from dotenv import load_dotenv
import json

# Determine the location of the .env file
# Try multiple possible locations
base_dir = Path(__file__).resolve().parent.parent.parent.parent  # project root
env_paths = [
    base_dir / ".env",  # project root
    Path(os.getcwd()) / ".env",  # current working directory
]

# Load environment variables from the first .env file that exists
for env_path in env_paths:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        print(f"Loaded environment from {env_path}")
        break


class Settings(BaseSettings):
    """
    Application settings with environment variable support.
    """
    # Project settings
    PROJECT_NAME: str = "Whispr"
    API_V1_STR: str = ""

    # Security settings - pulled from environment variables
    JWT_SECRET: str
    JWT_ALGORITHM: str
    JWT_EXPIRATION: int  # in seconds

    # Database settings - pulled from environment variables
    DATABASE_URL: str
    DATABASE_NAME: str

    # CORS settings - can be JSON string or comma-separated values
    CORS_ORIGINS: List[str]

    # Frontend URL
    FRONTEND_URL: str

    # Password settings
    MIN_PASSWORD_LENGTH: int

    # Cookie settings
    COOKIE_DOMAIN: str
    COOKIE_SECURE: bool
    COOKIE_SAMESITE: Optional[Literal['lax', 'strict', 'none']]

    # Email verification settings
    ALLOWED_EMAIL_DOMAINS: List[str]

    # CAS settings
    CAS_SERVER_URL: str = "https://login.iiit.ac.in/cas"
    CAS_SERVICE_URL: str
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

    # Admin user settings
    ADMIN_DEFAULT_USERNAME: str = os.getenv("ADMIN_DEFAULT_USERNAME", "admin")
    ADMIN_DEFAULT_PASSWORD: str = os.getenv("ADMIN_DEFAULT_PASSWORD", "admin123")

    class Config:
        """
        Configuration for Pydantic settings.
        """
        # Use env_file as a fallback if environment variables aren't already loaded
        env_file = str(base_dir / ".env")  # Use absolute path to project root .env file
        case_sensitive = True


settings = Settings()
