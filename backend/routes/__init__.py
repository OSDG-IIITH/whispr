"""
Routes package for the Whispr application.

This module initializes the main router and includes all route submodules
with appropriate prefixes and tags for API documentation.
"""

from fastapi import APIRouter

from .auth import router as auth_router
from .user import router as user_router
from .course import router as course_router
from .review import router as review_router

# Create the main router that will include all subrouters
main_router = APIRouter()

# Include all routers with their respective prefixes and tags
main_router.include_router(
    auth_router, prefix="/auth", tags=["Authentication"])
main_router.include_router(user_router, prefix="/user", tags=["User"])
main_router.include_router(course_router, prefix="/course", tags=["Course"])
main_router.include_router(review_router, prefix="/review", tags=["Review"])
