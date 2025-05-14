"""
Professor routes for the Whispr API.

This module provides endpoints for professor-related operations such as
fetching professor data, listing professors, and searching for professors.
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query

from models.professor import Professor
from managers.professor import ProfessorManager
from managers.course_instructor import CourseInstructorManager


router = APIRouter(prefix="/professors", tags=["professors"])


@router.get("/{professor_id}", response_model=Professor)
async def get_professor(professor_id: str):
    """
    Get a professor by ID.

    Args:
        professor_id: Professor ID to retrieve

    Returns:
        Professor object

    Raises:
        HTTPException: If professor not found
    """
    professor_manager = ProfessorManager()
    professor = await professor_manager.get_by_id(professor_id)

    if not professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor not found"
        )

    return professor


@router.get("/", response_model=List[Professor])
async def list_professors(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = Query(None),
    sort_order: int = Query(1, ge=-1, le=1)
):
    """
    Get a list of professors with pagination and sorting.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        sort_by: Field to sort by
        sort_order: Sort order (1 for ascending, -1 for descending)

    Returns:
        List of professor objects
    """
    professor_manager = ProfessorManager()
    professors = await professor_manager.get_professors(
        skip, limit, filters={}, sort_by=sort_by, sort_order=sort_order
    )

    return professors


@router.get("/search/{query}", response_model=List[Professor])
async def search_professors(
    query: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Search for professors by name or lab.

    Args:
        query: Search query
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of matching professor objects
    """
    professor_manager = ProfessorManager()
    professors = await professor_manager.search_professors(query, skip, limit)

    return professors


@router.get("/popular", response_model=List[Professor])
async def get_popular_professors(limit: int = Query(10, ge=1, le=50)):
    """
    Get the most popular professors based on review count and rating.

    Args:
        limit: Maximum number of professors to return

    Returns:
        List of popular professor objects
    """
    professor_manager = ProfessorManager()
    professors = await professor_manager.get_popular_professors(limit)

    return professors


@router.get("/{professor_id}/courses")
async def get_professor_courses(
    professor_id: str,
    year: Optional[int] = None,
    semester: Optional[str] = None
):
    """
    Get all courses taught by a professor.

    Args:
        professor_id: Professor ID
        year: Optional year filter
        semester: Optional semester filter

    Returns:
        List of course objects

    Raises:
        HTTPException: If professor not found
    """
    # First check if professor exists
    professor_manager = ProfessorManager()
    professor = await professor_manager.get_by_id(professor_id)

    if not professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor not found"
        )

    # Get courses
    course_instructor_manager = CourseInstructorManager()
    courses = await course_instructor_manager.get_courses_for_instructor(
        professor_id, year, semester
    )

    return courses


# @router.post(
#     "/", response_model=Professor, status_code=status.HTTP_201_CREATED
# )
# async def create_professor(
#     professor_data: ProfessorCreate,
#     current_user: Dict = Depends(get_current_active_user)
# ):
#     """
#     Create a new professor.

#     Args:
#         professor_data: Professor data
#         current_user: Current authenticated and active user

#     Returns:
#         Created professor object
#     """
#     professor_manager = ProfessorManager()
#     professor = await professor_manager.create_professor(
#         professor_data.dict(),
#         user_id=str(current_user["_id"])
#     )

#     return professor


# @router.put("/{professor_id}", response_model=Professor)
# async def update_professor(
#     professor_id: str,
#     professor_update: ProfessorUpdate,
#     current_user: Dict = Depends(get_current_active_user)
# ):
#     """
#     Update a professor.

#     Args:
#         professor_id: Professor ID to update
#         professor_update: Professor update data
#         current_user: Current authenticated and active user

#     Returns:
#         Updated professor object

#     Raises:
#         HTTPException: If professor not found
#     """
#     # First check if professor exists
#     professor_manager = ProfessorManager()
#     professor = await professor_manager.get_by_id(professor_id)

#     if not professor:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Professor not found"
#         )

#     # Update professor
#     updated_professor = await professor_manager.update_professor(
#         professor_id,
#         professor_update.dict(exclude_unset=True),
#         user_id=str(current_user["_id"])
#     )

#     return updated_professor
