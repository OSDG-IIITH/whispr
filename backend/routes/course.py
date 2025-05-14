"""
Course routes module for the Whispr application.

This module defines all endpoints related to course operations,
including listing courses and retrieving course details.
"""
from fastapi import APIRouter


# Create router for course-related endpoints
router = APIRouter()


@router.get("/all")
async def get_all_courses():
    """
    Retrieve a list of all available courses.

    Returns:
        dict: Dictionary containing a list of all courses
              or a message if no courses are found
    """
    # TODO: Implement database query to get all courses
    return {"message": "Get all courses"}


@router.get("/{course_code}")
async def get_course(course_code: str):
    """
    Retrieve details of a specific course by its code.

    Args:
        course_code (str): The unique code identifying the course

    Returns:
        dict: Course details if found

    Raises:
        HTTPException: If the course with the given code is not found
    """
    # TODO: Implement database query to get course by code
    return {"message": f"Get course with code {course_code}"}
