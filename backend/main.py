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


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """
    Lifespan context manager for the FastAPI application.

    Performs setup and teardown operations for the application:
    - Creates database tables on startup
    """
    # Create tables on startup
    await create_tables()
    yield
    # Cleanup resources on shutdown


app = FastAPI(
    title=settings.PROJECT_NAME,
    root_path="/whispr",
    description="Anonymous review platform for IIITH \
- Speak softly. Help loudly.",
    version="1.0.0",
    lifespan=lifespan,
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://osdg.iiit.ac.in", "https://osdg.iiit.ac.in/", "http://localhost:3000", "http://localhost", "http://localhost:3000/", "http://localhost/",],
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
