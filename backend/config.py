"""
Configuration file for the backend of the application.
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """
    Configuration class for the backend application.
    """
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwtsecretkey")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    SERVICE_URL = os.getenv("SERVICE_URL", "http://localhost:3000")
    CAS_URL = os.getenv("CAS_URL", "https://login.iiit.ac.in/cas")
