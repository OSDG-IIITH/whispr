"""
Course manager module for course-related database operations.

This module defines the CourseManager class that provides operations
for managing course records, including creation, querying,
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


class CourseManager(BaseManager):
    """
    Manager for course-related operations.

    This class provides methods for course record creation, querying,
    and statistics aggregation related to courses.
    """

    def __init__(self):
        """Initialize the course manager."""
        super().__init__('courses')

    @log_operation
    async def create_course(self, course_data: Dict) -> Dict:
        """
        Create a new course record.

        Args:
            course_data: Course data

        Returns:
            Created course document
        """
        # Set default review summary
        course_data['review_summary'] = {
            'count': 0,
            'overall_rating': 0.0,
            'text_summary': None
        }

        course_data['created_at'] = datetime.utcnow()

        result = await self.collection.insert_one(course_data)
        return await self.get_by_id(str(result.inserted_id))

    @log_operation
    @require_auth
    async def update_course(
        self, course_id: str, course_data: Dict
    ) -> Optional[Dict]:
        """
        Update a course record.

        Args:
            course_id: Course ID to update
            course_data: Updated course data

        Returns:
            Updated course document
        """
        course_data['updated_at'] = datetime.utcnow()
        return await self.update(course_id, course_data)

    @log_operation
    async def get_courses(
        self,
        skip: int = 0,
        limit: int = 20,
        filters: Dict = None,
        sort_by: str = None,
        sort_order: int = 1
    ) -> List[Dict]:
        """
        Get courses with pagination and filtering.

        Args:
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            filters: Query filters to apply
            sort_by: Field to sort by
            sort_order: Sort order (1 for ascending, -1 for descending)

        Returns:
            List of course documents
        """
        return await self.get_all(skip, limit, filters, sort_by, sort_order)

    @log_operation
    async def search_courses(
        self, query: str, skip: int = 0, limit: int = 20
    ) -> List[Dict]:
        """
        Search for courses by name or code.

        Args:
            query: Search query string
            skip: Number of documents to skip
            limit: Maximum number of documents to return

        Returns:
            List of matching course documents
        """
        # Create case-insensitive regex for search
        regex = re.compile(f".*{re.escape(query)}.*", re.IGNORECASE)

        # Search in name and code fields
        filters = {
            "$or": [
                {"name": {"$regex": regex}},
                {"code": {"$regex": regex}}
            ]
        }

        # Sort by relevance (more matches in the name or code)
        cursor = self.collection.find(filters).skip(skip).limit(limit)

        return await cursor.to_list(length=limit)

    @log_operation
    async def update_review_stats(self, course_id: str) -> Dict:
        """
        Update the review statistics for a course.

        Args:
            course_id: Course ID to update statistics for

        Returns:
            Updated course document
        """
        db = self.collection.database
        course_obj_id = ObjectId(course_id)

        # Get all reviews for this course
        pipeline = [
            {"$match": {"type": "course", "type_id": course_obj_id}},
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

        # Update the course with new statistics
        await self.update(course_id, {"review_summary": review_summary})

        return await self.get_by_id(course_id)

    @log_operation
    async def get_courses_by_instructor(
        self, instructor_id: str
    ) -> List[Dict]:
        """
        Get all courses taught by a specific instructor.

        Args:
            instructor_id: Instructor ID

        Returns:
            List of course documents
        """
        db = self.collection.database
        instructor_obj_id = ObjectId(instructor_id)

        # Find course-instructor relationships
        relationships = await db.course_instructors.find(
            {"instructor_id": instructor_obj_id}
        ).to_list(length=None)

        if not relationships:
            return []

        # Extract course IDs
        course_ids = [ObjectId(rel["course_id"]) for rel in relationships]

        # Find course documents
        courses = await self.collection.find(
            {"_id": {"$in": course_ids}}
        ).to_list(length=None)

        return courses

    @log_operation
    async def get_popular_courses(self, limit: int = 10) -> List[Dict]:
        """
        Get the most popular courses based on review count and rating.

        Args:
            limit: Maximum number of courses to return

        Returns:
            List of popular course documents
        """
        pipeline = [
            # Only consider courses with at least some reviews
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
