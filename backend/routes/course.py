"""
File containing all the routes related to courses.
"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/all")
async def get_all_courses():
    """
    Get all courses.
    """
    return {"message": "Get all courses"}

@router.get("/{course_code}")
async def get_course(course_code: str):
    """
    Get a course by course code.
    """
    return {"message": f"Get course with code {course_code}"}