"""
MongoDB connection and client management module.

This module initializes the MongoDB connection using Motor, an asynchronous
MongoDB driver for Python, and provides the database client to the application.
"""
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from config import Config


# Configure logging
logger = logging.getLogger(__name__)


class Database:
    """
    MongoDB database client manager class.

    This class handles the connection to MongoDB using Motor, providing
    async database operations for the application.

    Attributes:
        client (AsyncIOMotorClient): The MongoDB client instance
        db: The database instance for the application
    """
    client = None
    db = None


def get_database():
    """
    Get the database instance.

    Returns:
        Database instance for direct database operations
    """
    return Database.db


async def connect_to_mongo():
    """
    Initialize connection to MongoDB.

    Establishes an asynchronous connection to the MongoDB server
    using configuration parameters and sets up the database client.
    """
    logger.info("Connecting to MongoDB...")
    try:
        Database.client = AsyncIOMotorClient(Config.MONGODB_URI)
        # Extract database name from the connection string, or use default
        db_name = Config.MONGODB_URI.split("/")[-1] or "whispr"
        Database.db = Database.client.get_database(db_name)
        logger.info("Connected to MongoDB successfully")
    except Exception as e:
        logger.error("Failed to connect to MongoDB: %s", e)
        raise


async def close_mongo_connection():
    """
    Close the MongoDB connection.

    Properly closes the MongoDB client connection on application shut down.
    """
    logger.info("Closing MongoDB connection...")
    if Database.client:
        Database.client.close()
        logger.info("MongoDB connection closed")
