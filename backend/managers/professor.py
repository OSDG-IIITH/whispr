"""
Professor manager module for professor-related database operations.

This module defines the ProfessorManager class that provides operations
for managing professor records, including creation, querying,
and statistics aggregation.
"""
import logging
import re
from typing import Dict, List, Optional
from datetime import datetime
from bson import ObjectId

from managers.base import BaseManager, log_operation, require_auth

# Configure logging
logger = logging.getLogger(__name__)


class ProfessorManager(BaseManager):
    """
    Manager for professor-related operations.

    This class provides methods for professor record creation, querying,
    and statistics aggregation related to professors.
    """

    def __init__(self):
        """Initialize the professor manager."""
        super().__init__('professors')

    @log_operation
    async def create_professor(self, professor_data: Dict) -> Dict:
        """
        Create a new professor record.

        Args:
            professor_data: Professor data

        Returns:
            Created professor document
        """
        # Set default review summary
        professor_data['review_summary'] = {
            'count': 0,
            'overall_rating': 0.0,
            'text_summary': None
        }

        professor_data['created_at'] = datetime.utcnow()

        result = await self.collection.insert_one(professor_data)
        return await self.get_by_id(str(result.inserted_id))

    @log_operation
    @require_auth
    async def update_professor(
        self, professor_id: str, professor_data: Dict
    ) -> Optional[Dict]:
        """
        Update a professor record.

        Args:
            professor_id: Professor ID to update
            professor_data: Updated professor data

        Returns:
            Updated professor document
        """
        professor_data['updated_at'] = datetime.utcnow()
        return await self.update(professor_id, professor_data)

    @log_operation
    async def get_professors(
        self,
        skip: int = 0,
        limit: int = 20,
        filters: Dict = None,
        sort_by: str = None,
        sort_order: int = 1
    ) -> List[Dict]:
        """
        Get professors with pagination and filtering.

        Args:
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            filters: Query filters to apply
            sort_by: Field to sort by
            sort_order: Sort order (1 for ascending, -1 for descending)

        Returns:
            List of professor documents
        """
        return await self.get_all(skip, limit, filters, sort_by, sort_order)

    @log_operation
    async def search_professors(
        self, query: str, skip: int = 0, limit: int = 20
    ) -> List[Dict]:
        """
        Search for professors by name or lab.

        Args:
            query: Search query string
            skip: Number of documents to skip
            limit: Maximum number of documents to return

        Returns:
            List of matching professor documents
        """
        # Create case-insensitive regex for search
        regex = re.compile(f".*{re.escape(query)}.*", re.IGNORECASE)

        # Search in name and lab fields
        filters = {
            "$or": [
                {"name": {"$regex": regex}},
                {"lab": {"$regex": regex}}
            ]
        }

        cursor = self.collection.find(filters).skip(skip).limit(limit)

        return await cursor.to_list(length=limit)

    @log_operation
    async def update_review_stats(self, professor_id: str) -> Dict:
        """
        Update the review statistics for a professor.

        Args:
            professor_id: Professor ID to update statistics for

        Returns:
            Updated professor document
        """
        db = self.collection.database
        professor_obj_id = ObjectId(professor_id)

        # Get all reviews for this professor
        pipeline = [
            {"$match": {"type": "professor", "type_id": professor_obj_id}},
            {"$group": {
                "_id": None,
                "count": {"$sum": 1},
                "avg_rating": {"$avg": "$rating"}
            }}
        ]

        results = await db.reviews.aggregate(pipeline).to_list(length=1)

        if results:
            stats = results[0]
            review_summary = {
                "count": stats["count"],
                "overall_rating": round(stats["avg_rating"], 1)
            }
        else:
            review_summary = {"count": 0, "overall_rating": 0.0}

        # Update the professor with new statistics
        await self.update(professor_id, {"review_summary": review_summary})

        return await self.get_by_id(professor_id)

    @log_operation
    async def get_professors_by_course(self, course_id: str) -> List[Dict]:
        """
        Get all professors who have taught a specific course.

        Args:
            course_id: Course ID

        Returns:
            List of professor documents
        """
        db = self.collection.database
        course_obj_id = ObjectId(course_id)

        # Find course-instructor relationships
        relationships = await db.course_instructors.find(
            {"course_id": course_obj_id}
        ).to_list(length=None)

        if not relationships:
            return []

        # Extract instructor IDs
        instructor_ids = [ObjectId(rel["instructor_id"])
                          for rel in relationships]

        # Find professor documents
        professors = await self.collection.find(
            {"_id": {"$in": instructor_ids}}
        ).to_list(length=None)

        return professors

    @log_operation
    async def get_popular_professors(self, limit: int = 10) -> List[Dict]:
        """
        Get the most popular professors based on review count and rating.

        Args:
            limit: Maximum number of professors to return

        Returns:
            List of popular professor documents
        """
        pipeline = [
            # Only consider professors with at least some reviews
            {"$match": {"review_summary.count": {"$gt": 0}}},
            # Sort by a combination of review count and overall rating
            {"$sort": {
                "review_summary.overall_rating": -1,
                "review_summary.count": -1
            }},
            {"$limit": limit}
        ]

        cursor = self.collection.aggregate(pipeline)
        return await cursor.to_list(length=limit)
