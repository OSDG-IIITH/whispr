"""
Courses routes for the Whispr API.

This module provides endpoints for course-related operations such as
fetching course data, listing courses, and searching for courses.
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query

from models.course import Course
from managers.course import CourseManager
from managers.course_instructor import CourseInstructorManager

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/{course_id}", response_model=Course)
async def get_course(course_id: str):
    """
    Get a course by ID.

    Args:
        course_id: Course ID to retrieve

    Returns:
        Course object

    Raises:
        HTTPException: If course not found
    """
    course_manager = CourseManager()
    course = await course_manager.get_by_id(course_id)

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    return course


@router.get("/code/{course_code}", response_model=Course)
async def get_course_by_code(course_code: str):
    """
    Get a course by its code.

    Args:
        course_code: Course code to retrieve

    Returns:
        Course object

    Raises:
        HTTPException: If course not found
    """
    course_manager = CourseManager()
    course = await course_manager.collection.find_one({"code": course_code})

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    return course


@router.get("/", response_model=List[Course])
async def list_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = Query(None),
    sort_order: int = Query(1, ge=-1, le=1)
):
    """
    Get a list of courses with pagination and sorting.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        sort_by: Field to sort by
        sort_order: Sort order (1 for ascending, -1 for descending)

    Returns:
        List of course objects
    """
    course_manager = CourseManager()
    courses = await course_manager.get_courses(
        skip, limit, filters={}, sort_by=sort_by, sort_order=sort_order
    )

    return courses


@router.get("/search/{query}", response_model=List[Course])
async def search_courses(
    query: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Search for courses by name or code.

    Args:
        query: Search query
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of matching course objects
    """
    course_manager = CourseManager()
    courses = await course_manager.search_courses(query, skip, limit)

    return courses


@router.get("/popular", response_model=List[Course])
async def get_popular_courses(limit: int = Query(10, ge=1, le=50)):
    """
    Get the most popular courses based on review count and rating.

    Args:
        limit: Maximum number of courses to return

    Returns:
        List of popular course objects
    """
    course_manager = CourseManager()
    courses = await course_manager.get_popular_courses(limit)

    return courses


@router.get("/{course_id}/instructors")
async def get_course_instructors(
    course_id: str,
    year: Optional[int] = None,
    semester: Optional[str] = None
):
    """
    Get all instructors who have taught a course.

    Args:
        course_id: Course ID
        year: Optional year filter
        semester: Optional semester filter

    Returns:
        List of instructor objects

    Raises:
        HTTPException: If course not found
    """
    # First check if course exists
    course_manager = CourseManager()
    course = await course_manager.get_by_id(course_id)

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    # Get instructors
    course_instructor_manager = CourseInstructorManager()
    instructors = await course_instructor_manager.get_instructors_for_course(
        course_id, year, semester
    )

    return instructors


# @router.post("/", response_model=Course, status_code=status.HTTP_201_CREATED)
# async def create_course(
#     course_data: CourseCreate,
# ):
#     """
#     Create a new course.

#     Args:
#         course_data: Course data
#         current_user: Current authenticated and active user

#     Returns:
#         Created course object
#     """
#     course_manager = CourseManager()
#     course = await course_manager.create_course(
#         course_data.dict()
#     )

#     return course


# @router.put("/{course_id}", response_model=Course)
# async def update_course(
#     course_id: str,
#     course_update: CourseUpdate,
# ):
#     """
#     Update a course.

#     Args:
#         course_id: Course ID to update
#         course_update: Course update data
#         current_user: Current authenticated and active user

#     Returns:
#         Updated course object

#     Raises:
#         HTTPException: If course not found
#     """
#     # First check if course exists
#     course_manager = CourseManager()
#     course = await course_manager.get_by_id(course_id)

#     if not course:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Course not found"
#         )

#     # Update course
#     updated_course = await course_manager.update_course(
#         course_id,
#         course_update.dict(exclude_unset=True)
#     )

#     return updated_course
