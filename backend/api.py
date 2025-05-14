"""
Main API entry point for the Whispr application.

This module initializes the FastAPI application, configures CORS middleware,
defines basic endpoints, includes the main router,
and manages database connections.
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import Config

from routes import main_router
from database.mongodb import connect_to_mongo, close_mongo_connection

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)

# Initialize FastAPI application
app = FastAPI(
    title="Whispr API",
    description="Backend API for the Whispr application",
    version="1.0.0"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """
    Root endpoint that redirects users to the UI.

    Returns:
        dict: A message indicating users should use the UI.
    """
    return {"message": "Shoo away peasants, use the UI"}


@app.get("/debug")
async def debug():
    """
    Debug endpoint to verify the API is running.

    Returns:
        dict: A message confirming the API is operational.
    """
    return {"message": "FastAPI is running, let's goooooo"}

# Register startup and shutdown events for database connections


@app.on_event("startup")
async def startup_db_client():
    """
    Event handler that runs at application startup.
    Initializes database connections and performs startup tasks.
    """
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_db_client():
    """
    Event handler that runs at application shutdown.
    Closes database connections and performs cleanup tasks.
    """
    await close_mongo_connection()

# Include all routes from the main router
app.include_router(main_router)
