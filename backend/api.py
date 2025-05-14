"""
Main API entry point for Whispr.

This module initializes the FastAPI application, configures CORS middleware,
defines basic endpoints, includes the main router,
and manages database connections.
"""
import logging
from contextlib import asynccontextmanager

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


@asynccontextmanager
async def lifespan(_: FastAPI):
    """
    Lifespan manager for the application.
    Handles startup and shutdown events.
    """
    # Startup: connect to database
    await connect_to_mongo()
    yield
    # Shutdown: close database connection
    await close_mongo_connection()


# Initialize FastAPI application
app = FastAPI(
    title="Whispr API",
    description="Backend API for Whispr",
    version="1.0.0",
    lifespan=lifespan
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

# Include all routes from the main router
app.include_router(main_router)

# Run the server if the script is executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
