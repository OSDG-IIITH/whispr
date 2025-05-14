"""
Routes package for the Whispr API.

This module initializes the main router and imports all route modules.
"""
from routes.base import api_router
# Import all route modules
from routes.users import router as users_router
from routes.courses import router as courses_router
from routes.professors import router as professors_router
from routes.reviews import router as reviews_router
from routes.replies import router as replies_router
from routes.notifications import router as notifications_router
from routes.search import router as search_router
from routes.auth import router as auth_router

# Combine all routers into the main router
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(courses_router)
api_router.include_router(professors_router)
api_router.include_router(reviews_router)
api_router.include_router(replies_router)
api_router.include_router(notifications_router)
api_router.include_router(search_router)

# Export the main router for the API
main_router = api_router
