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
    # For Pydantic V2
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        """
        Define validation schema for Pydantic v2.

        Args:
            _source_type: Source type
            _handler: Schema handler

        Returns:
            Schema for validation
        """
        from pydantic_core import core_schema

        def validate_from_str(value: str) -> ObjectId:
            if not ObjectId.is_valid(value):
                raise ValueError("Invalid ObjectId")
            return ObjectId(value)

        def validate_from_any(value: any) -> ObjectId:
            if isinstance(value, ObjectId):
                return value
            if isinstance(value, str):
                return validate_from_str(value)
            raise ValueError("Invalid ObjectId")

        # Using proper schema types for Pydantic v2
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.with_info_plain_validator_function(
                validate_from_str,
                serialization=core_schema.plain_serializer_function_ser_schema(
                    lambda x: str(x)
                )
            ),
            core_schema.no_info_plain_validator_function(validate_from_any),
        ])

    @classmethod
    def __get_pydantic_json_schema__(cls, _core_schema, handler):
        """
        Modify the schema to represent the ObjectId correctly for Pydantic v2.

        Args:
            _core_schema: Core schema
            handler: Schema handler

        Returns:
            dict: Modified field schema
        """
        json_schema = handler(_core_schema)
        json_schema.update(type="string")
        return json_schema


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
