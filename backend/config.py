"""
Configuration module for the Whispr backend application.

This module loads environment variables and provides configuration settings
for the application through the Config class.
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """
    Configuration class for the Whispr backend application.

    This class centralizes all configuration settings and provides
    default values for development environments.

    Attributes:
        CORS_ORIGINS (list): Allowed origins for CORS, comma-separated in .env
        MONGODB_URI (str): Connection string for MongoDB database
        SECRET_KEY (str): Secret key for various encryptions
        ALGORITHM (str): Algorithm used for JWT token encryption
        ACCESS_TOKEN_EXPIRE_MINUTES (int): Expiration time for access tokens
        FRONTEND_URL (str): URL of the frontend application
        SERVICE_URL (str): URL of the service API
        CAS_URL (str): URL for the Central Authentication Service
        DATABASE_NAME (str): Name of the MongoDB database
        MIN_PASSWORD_LENGTH (int): Minimum length for user passwords
    """
    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000").split(",")
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    SERVICE_URL = os.getenv("SERVICE_URL", "http://localhost:8000")
    CAS_URL = os.getenv("CAS_URL", "https://login.iiit.ac.in/cas")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "whispr")
    MIN_PASSWORD_LENGTH = int(os.getenv("MIN_PASSWORD_LENGTH", "8"))
    ALLOWED_DOMAINS = [
        r".*@students\.iiit\.ac\.in$",  # Student email
        r".*@research\.iiit\.ac\.in$",   # Research email
    ]
