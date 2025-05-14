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
        JWT_SECRET_KEY (str): Secret key for JWT token encryption
        FRONTEND_URL (str): URL of the frontend application
        SERVICE_URL (str): URL of the service API
        CAS_URL (str): URL for the Central Authentication Service
    """
    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000").split(",")
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwtsecretkey")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    SERVICE_URL = os.getenv("SERVICE_URL", "http://localhost:3000")
    CAS_URL = os.getenv("CAS_URL", "https://login.iiit.ac.in/cas")
