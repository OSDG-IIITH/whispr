"""
Whispr API - Main entry point for the backend API.
Anonymous review platform for IIITH with CAS verification.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import api_router
from app.db.init_db import create_tables

from create_admin import create_admin_user


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """
    Lifespan context manager for the FastAPI application.

    Performs setup and teardown operations for the application:
    - Creates database tables on startup
    """
    # Create tables on startup
    await create_tables()
    try:
        await create_admin_user()
    except Exception as e:
        print(f"Error creating admin user: {e}")
    yield
    # Cleanup resources on shutdown


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Anonymous review platform for IIITH \
- Speak softly. Help loudly.",
    version="1.0.0",
    lifespan=lifespan,
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost", "http://localhost:3000/", "http://localhost/",],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Shoo away, peasants! Use the UI. \
Or check out the API documentation at /docs"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "OK", "version": "1.0.0"}

@app.on_event("startup")
async def startup_event():
    """Startup event handler."""
    print("Starting up the Whispr API...")
    print("Admin user setup")