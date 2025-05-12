"""
File containing all the routes related to reviews.
"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/{course_code}")
async def get_reviews(course_code: str, limit: int = 10, offset: int = 0):
    """
    Get reviews for a course.
    """
    return {"message": f"Get reviews for course {course_code} with limit {limit} and offset {offset}"}

@router.post("/{course_code}")
async def create_review(course_code: str, review: dict):
    """
    Create a review for a course.
    """
    return {"message": f"Create review for course {course_code}", "review": review}

