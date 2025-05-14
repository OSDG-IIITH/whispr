"""
Course-Instructor relationship manager module.

This module defines the CourseInstructorManager class that provides operations
for managing relationships between courses and instructors.
"""
import logging
from typing import Dict, List
from datetime import datetime
from bson import ObjectId

from managers.base import BaseManager, log_operation, require_auth

# Configure logging
logger = logging.getLogger(__name__)


class CourseInstructorManager(BaseManager):
    """
    Manager for course-instructor relationship operations.

    This class provides methods for creating, querying, and updating the
    relationships between courses and their instructors across semesters.
    """

    def __init__(self):
        """Initialize the course-instructor relationship manager."""
        super().__init__('course_instructors')

    @log_operation
    @require_auth
    async def create_relationship(self, relationship_data: Dict) -> Dict:
        """
        Create a new course-instructor relationship.

        Args:
            relationship_data: Relationship data

        Returns:
            Created relationship document
        """
        # Convert string IDs to ObjectIds
        if 'course_id' in relationship_data and isinstance(
                relationship_data['course_id'], str):
            relationship_data['course_id'] = ObjectId(
                relationship_data['course_id'])

        if 'instructor_id' in relationship_data and isinstance(
                relationship_data['instructor_id'], str):
            relationship_data['instructor_id'] = ObjectId(
                relationship_data['instructor_id']
            )

        # Check if this relationship already exists
        existing = await self.collection.find_one({
            "course_id": relationship_data['course_id'],
            "instructor_id": relationship_data['instructor_id']
        })

        if existing:
            # Update the existing relationship with new iterations
            new_iterations = relationship_data.get('iterations', [])
            existing_iterations = existing.get('iterations', [])

            # Combine iterations, avoiding duplicates
            combined = existing_iterations.copy()
            for iteration in new_iterations:
                if iteration not in combined:
                    combined.append(iteration)

            # Update the existing document
            await self.collection.update_one(
                {"_id": existing['_id']},
                {
                    "$set": {
                        "iterations": combined,
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            return await self.get_by_id(str(existing['_id']))

        # Create new relationship
        relationship_data['created_at'] = datetime.utcnow()
        result = await self.collection.insert_one(relationship_data)
        return await self.get_by_id(str(result.inserted_id))

    @log_operation
    @require_auth
    async def update_relationship(
        self, relationship_id: str, relationship_data: Dict
    ) -> Dict:
        """
        Update an existing course-instructor relationship.

        Args:
            relationship_id: Relationship ID to update
            relationship_data: Updated relationship data

        Returns:
            Updated relationship document
        """
        update_data = relationship_data.copy()
        update_data['updated_at'] = datetime.utcnow()

        return await self.update(relationship_id, update_data)

    @log_operation
    async def get_instructors_for_course(
        self, course_id: str, year: int = None, semester: str = None
    ) -> List[Dict]:
        """
        Get all instructors for a specific course.

        Args:
            course_id: Course ID
            year: Optional year filter
            semester: Optional semester filter

        Returns:
            List of instructor documents
        """
        db = self.collection.database
        course_obj_id = ObjectId(course_id)

        # Build query
        query = {"course_id": course_obj_id}

        # Apply iteration filters if provided
        iteration_conditions = []
        if year or semester:
            if year:
                iteration_conditions.append({"iterations.year": year})
            if semester:
                iteration_conditions.append({"iterations.semester": semester})

            if iteration_conditions:
                query["$and"] = iteration_conditions

        # Find relationships
        relationships = await self.collection.find(query).to_list(length=None)

        if not relationships:
            return []

        # Extract instructor IDs
        instructor_ids = [
            relationship['instructor_id'] for relationship in relationships
        ]

        # Get instructor documents
        instructors = await db.professors.find(
            {"_id": {"$in": instructor_ids}}
        ).to_list(length=None)

        return instructors

    @log_operation
    async def get_courses_for_instructor(
        self, instructor_id: str, year: int = None, semester: str = None
    ) -> List[Dict]:
        """
        Get all courses for a specific instructor.

        Args:
            instructor_id: Instructor ID
            year: Optional year filter
            semester: Optional semester filter

        Returns:
            List of course documents
        """
        db = self.collection.database
        instructor_obj_id = ObjectId(instructor_id)

        # Build query
        query = {"instructor_id": instructor_obj_id}

        # Apply iteration filters if provided
        iteration_conditions = []
        if year or semester:
            if year:
                iteration_conditions.append({"iterations.year": year})
            if semester:
                iteration_conditions.append({"iterations.semester": semester})

            if iteration_conditions:
                query["$and"] = iteration_conditions

        # Find relationships
        relationships = await self.collection.find(query).to_list(length=None)

        if not relationships:
            return []

        # Extract course IDs
        course_ids = [
            relationship['course_id'] for relationship in relationships
        ]

        # Get course documents
        courses = await db.courses.find(
            {"_id": {"$in": course_ids}}
        ).to_list(length=None)

        return courses

    @log_operation
    async def get_iterations_for_relationship(
        self, course_id: str, instructor_id: str
    ) -> List[Dict]:
        """
        Get all semester iterations for a specific course-instructor relation.

        Args:
            course_id: Course ID
            instructor_id: Instructor ID

        Returns:
            List of iteration documents (year/semester pairs)
        """
        relationship = await self.collection.find_one({
            "course_id": ObjectId(course_id),
            "instructor_id": ObjectId(instructor_id)
        })

        if not relationship:
            return []

        return relationship.get('iterations', [])

    @log_operation
    @require_auth
    async def add_iteration(
        self, course_id: str, instructor_id: str,
        year: int, semester: str
    ) -> Dict:
        """
        Add a new semester iteration to a course-instructor relationship.

        Args:
            course_id: Course ID
            instructor_id: Instructor ID
            year: Academic year
            semester: Academic semester

        Returns:
            Updated relationship document
        """
        # Find the relationship
        relationship = await self.collection.find_one({
            "course_id": ObjectId(course_id),
            "instructor_id": ObjectId(instructor_id)
        })

        if not relationship:
            # Create a new relationship if it doesn't exist
            return await self.create_relationship({
                "course_id": ObjectId(course_id),
                "instructor_id": ObjectId(instructor_id),
                "iterations": [{"year": year, "semester": semester}]
            })

        # Check if this iteration already exists
        iterations = relationship.get('iterations', [])
        new_iteration = {"year": year, "semester": semester}

        if new_iteration not in iterations:
            iterations.append(new_iteration)

            # Update the relationship
            await self.collection.update_one(
                {"_id": relationship['_id']},
                {
                    "$set": {
                        "iterations": iterations,
                        "updated_at": datetime.utcnow()
                    }
                }
            )

        return await self.get_by_id(str(relationship['_id']))

    @log_operation
    @require_auth
    async def remove_iteration(
        self, course_id: str, instructor_id: str,
        year: int, semester: str
    ) -> Dict:
        """
        Remove a semester iteration from a course-instructor relationship.

        Args:
            course_id: Course ID
            instructor_id: Instructor ID
            year: Academic year
            semester: Academic semester

        Returns:
            Updated relationship document, or None if not found
        """
        # Find the relationship
        relationship = await self.collection.find_one({
            "course_id": ObjectId(course_id),
            "instructor_id": ObjectId(instructor_id)
        })

        if not relationship:
            return None

        # Remove the iteration
        iterations = relationship.get('iterations', [])
        target_iteration = {"year": year, "semester": semester}

        if target_iteration in iterations:
            iterations.remove(target_iteration)

            # Update the relationship
            await self.collection.update_one(
                {"_id": relationship['_id']},
                {
                    "$set": {
                        "iterations": iterations,
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            # Delete the relationship if no iterations remain
            if not iterations:
                await self.delete(str(relationship['_id']))
                return None

        return await self.get_by_id(str(relationship['_id']))
