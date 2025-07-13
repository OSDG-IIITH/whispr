from fastapi import APIRouter
from app.api.routes import (
    auth,
    verification,
    users,
    professors,
    courses,
    course_instructors,
    reviews,
    replies,
    votes,
    notifications,
    search,
    reports
)

api_router = APIRouter()

# Include all routes
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(
    verification.router, prefix="/verify", tags=["verification", "CAS"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(
    professors.router, prefix="/professors", tags=["professors"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(course_instructors.router,
                          prefix="/course-instructors",
                          tags=["course-instructors"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(replies.router, prefix="/replies", tags=["replies"])
api_router.include_router(votes.router, prefix="/votes", tags=["votes"])
api_router.include_router(notifications.router,
                          prefix="/notifications", tags=["notifications"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
