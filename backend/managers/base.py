"""
Base manager module for common database operations.

This module defines the BaseManager class that provides common CRUD operations
and utility functions for all data managers in the application.
"""
import logging
import functools
from datetime import datetime
from typing import List, Dict, Optional, Callable, TypeVar
from bson import ObjectId
from database.mongodb import get_database
from database.helpers import get_document_by_id

# Configure logging
logger = logging.getLogger(__name__)

# Type variable for function annotations
T = TypeVar('T')


def log_operation(func: Callable[..., T]) -> Callable[..., T]:
    """
    Decorator for logging database operations.

    Args:
        func: The function to wrap with logging

    Returns:
        Wrapped function that logs operations
    """
    @functools.wraps(func)
    async def wrapper(self, *args, **kwargs):
        collection_name = self.collection.name if hasattr(
            self, 'collection') else "unknown"
        username = kwargs.get('username', 'anonymous')

        # Don't log sensitive data, only log the operation and username
        logger.info(
            "Operation: %s, Collection: %s, User: %s",
            func.__name__, collection_name, username
        )

        return await func(self, *args, **kwargs)
    return wrapper


def require_auth(func: Callable[..., T]) -> Callable[..., T]:
    """
    Decorator for requiring authentication for operations.

    Args:
        func: The function to wrap with authentication check

    Returns:
        Wrapped function that checks for authentication
    """
    @functools.wraps(func)
    async def wrapper(self, *args, **kwargs):
        user_id = kwargs.get('user_id')
        if not user_id:
            raise ValueError("Authentication required for this operation")

        # Check if user is in muffled status
        # for operations that require verification
        if getattr(self, 'require_unmuffled', False):
            db = get_database()
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            if not user or user.get('muffled', True):
                raise ValueError("Verified status required for this operation")

        return await func(self, *args, **kwargs)
    return wrapper


class BaseManager:
    """
    Base manager class for database operations.

    This class provides common CRUD operations and utility functions
    that all other managers can inherit from.

    Attributes:
        collection_name: Name of the MongoDB collection
        require_unmuffled: Whether operations require unmuffled status
    """

    def __init__(self, collection_name: str, require_unmuffled: bool = False):
        """
        Initialize the manager with a collection.

        Args:
            collection_name: Name of the MongoDB collection
            require_unmuffled: Whether operations require unmuffled status
        """
        self.collection_name = collection_name
        self.require_unmuffled = require_unmuffled
        db = get_database()
        self.collection = getattr(db, collection_name)

    @log_operation
    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Dict = None,
        sort_by: str = None,
        sort_order: int = 1
    ) -> List[Dict]:
        """
        Get all documents from the collection with pagination.

        Args:
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            filters: Query filters to apply
            sort_by: Field to sort by
            sort_order: Sort order (1 for ascending, -1 for descending)

        Returns:
            List of documents from the collection
        """
        filters = filters or {}
        cursor = self.collection.find(filters).skip(skip).limit(limit)

        if sort_by:
            cursor = cursor.sort(sort_by, sort_order)

        return await cursor.to_list(length=limit)

    @log_operation
    async def get_by_id(self, doc_id: str) -> Dict:
        """
        Get a document by its ID.

        Args:
            doc_id: Document ID

        Returns:
            Document if found, None otherwise
        """
        return await get_document_by_id(self.collection, doc_id)

    @log_operation
    async def create(self, data: Dict) -> Dict:
        """
        Create a new document in the collection.

        Args:
            data: Document data

        Returns:
            Created document with ID
        """
        if 'created_at' not in data:
            data['created_at'] = datetime.utcnow()

        result = await self.collection.insert_one(data)
        return await self.get_by_id(str(result.inserted_id))

    @log_operation
    async def update(self, doc_id: str, data: Dict) -> Optional[Dict]:
        """
        Update a document by its ID.

        Args:
            doc_id: Document ID
            data: Updated data

        Returns:
            Updated document if found and updated, None otherwise
        """
        # Process data to ensure MongoDB compatibility
        processed_data = {}
        for key, value in data.items():
            # Convert any Pydantic HttpUrl to string
            if hasattr(value, '__str__') and 'HttpUrl' in str(type(value)):
                processed_data[key] = str(value)
            else:
                processed_data[key] = value

        # Add updated_at timestamp
        update_data = {
            "$set": {**processed_data, "updated_at": datetime.utcnow()}
        }

        await self.collection.update_one(
            {"_id": ObjectId(doc_id)}, update_data
        )
        return await self.get_by_id(doc_id)

    @log_operation
    async def delete(self, doc_id: str) -> bool:
        """
        Delete a document by its ID.

        Args:
            doc_id: Document ID

        Returns:
            True if document was deleted, False otherwise
        """
        result = await self.collection.delete_one({"_id": ObjectId(doc_id)})
        return result.deleted_count > 0

    @log_operation
    async def count(self, filters: Dict = None) -> int:
        """
        Count documents in the collection that match the filters.

        Args:
            filters: Query filters to apply

        Returns:
            Number of documents that match the filters
        """
        filters = filters or {}
        return await self.collection.count_documents(filters)

    async def exists(self, filters: Dict) -> bool:
        """
        Check if a document exists in the collection.

        Args:
            filters: Query filters to apply

        Returns:
            True if document exists, False otherwise
        """
        count = await self.count(filters)
        return count > 0
