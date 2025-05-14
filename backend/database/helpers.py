"""
Database model helper module for MongoDB operations.

This module provides base CRUD operations and helper functions
for working with MongoDB collections in an object-oriented manner.
"""
from bson import ObjectId


class PyObjectId(ObjectId):
    """
    Custom ObjectId type for proper de/serialization in Pydantic models.

    Extends the MongoDB ObjectId class to properly handle Pydantic validation.
    """
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        """
        Validate if a value is a valid ObjectId.

        Args:
            v: Value to validate

        Returns:
            ObjectId: A valid ObjectId instance

        Raises:
            ValueError: If value is not a valid ObjectId
        """
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, schema):
        """
        Modify the schema to represent the ObjectId correctly.

        Args:
            schema: Schema to modify
        """
        schema.update(type="string")


async def get_collection_data(collection, skip=0, limit=100, filters=None):
    """
    Get data from a MongoDB collection with pagination.

    Args:
        collection: MongoDB collection object
        skip (int): Number of documents to skip
        limit (int): Maximum number of documents to return
        filters (dict): Query filters to apply

    Returns:
        list: Collection items that match the query
    """
    filters = filters or {}
    cursor = collection.find(filters).skip(skip).limit(limit)
    return await cursor.to_list(length=limit)


async def get_document_by_id(collection, document_id):
    """
    Get a document from a collection by its ID.

    Args:
        collection: MongoDB collection object
        document_id: Document's ObjectId or string ID

    Returns:
        dict: Document if found, None otherwise
    """
    if isinstance(document_id, str):
        document_id = ObjectId(document_id)

    return await collection.find_one({"_id": document_id})
