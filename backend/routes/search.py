"""
Search routes for the Whispr API.

This module provides endpoints for search operations across multiple entities 
such as courses, professors, reviews, and users.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any, Optional
import asyncio

from managers.course import CourseManager
from managers.professor import ProfessorManager
from managers.review import ReviewManager
from managers.user import UserManager
from routes.base import get_current_user

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/global/{query}")
async def global_search(
    query: str,
    limit: int = Query(5, ge=1, le=20)
):
    """
    Perform a global search across all entity types.

    Args:
        query: Search query
        limit: Maximum number of results per entity type

    Returns:
        Combined search results
    """
    # Create managers
    course_manager = CourseManager()
    professor_manager = ProfessorManager()
    review_manager = ReviewManager()
    user_manager = UserManager()

    # Run searches in parallel
    course_task = asyncio.create_task(
        course_manager.search_courses(query, 0, limit)
    )
    professor_task = asyncio.create_task(
        professor_manager.search_professors(query, 0, limit)
    )
    review_task = asyncio.create_task(
        review_manager.search_reviews(query, 0, limit)
    )
    user_task = asyncio.create_task(
        user_manager.search_users(query, 0, limit)
    )

    # Wait for all searches to complete
    courses = await course_task
    professors = await professor_task
    reviews = await review_task
    users = await user_task

    # Combine results
    results = {
        "courses": courses,
        "professors": professors,
        "reviews": reviews,
        "users": users
    }

    # Count total results
    total = sum(len(results[key]) for key in results)

    return {
        "query": query,
        "total_results": total,
        "results": results
    }


@router.get("/courses/{query}")
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
        Course search results
    """
    course_manager = CourseManager()
    courses = await course_manager.search_courses(query, skip, limit)

    return {
        "query": query,
        "count": len(courses),
        "results": courses
    }


@router.get("/professors/{query}")
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
        Professor search results
    """
    professor_manager = ProfessorManager()
    professors = await professor_manager.search_professors(query, skip, limit)

    return {
        "query": query,
        "count": len(professors),
        "results": professors
    }


@router.get("/reviews/{query}")
async def search_reviews(
    query: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Search for reviews by content or tags.

    Args:
        query: Search query
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        Review search results
    """
    review_manager = ReviewManager()
    reviews = await review_manager.search_reviews(query, skip, limit)

    return {
        "query": query,
        "count": len(reviews),
        "results": reviews
    }


@router.get("/deep-reviews/{query}")
async def deep_search_reviews(
    query: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Perform a deep semantic search on review content.

    Args:
        query: Search query
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        Deep review search results
    """
    review_manager = ReviewManager()
    reviews = await review_manager.deep_search_reviews(query, skip, limit)

    return {
        "query": query,
        "count": len(reviews),
        "results": reviews
    }


@router.get("/users/{query}")
async def search_users(
    query: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Search for users by username or display name.

    Args:
        query: Search query
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        User search results
    """
    user_manager = UserManager()
    users = await user_manager.search_users(query, skip, limit)

    return {
        "query": query,
        "count": len(users),
        "results": users
    }


@router.get("/suggestions/{query}")
async def get_search_suggestions(
    query: str,
    limit: int = Query(5, ge=1, le=20)
):
    """
    Get search suggestions based on a partial query.

    Args:
        query: Partial search query
        limit: Maximum number of suggestions

    Returns:
        Search suggestions by entity type
    """
    # Create managers
    course_manager = CourseManager()
    professor_manager = ProfessorManager()
    review_manager = ReviewManager()

    # Run suggestion queries in parallel
    course_task = asyncio.create_task(
        course_manager.search_courses(query, 0, limit)
    )
    professor_task = asyncio.create_task(
        professor_manager.search_professors(query, 0, limit)
    )
    review_task = asyncio.create_task(
        review_manager.get_review_suggestions(query, limit)
    )

    # Wait for all queries to complete
    courses = await course_task
    professors = await professor_task
    review_suggestions = await review_task

    # Format suggestions
    course_suggestions = [
        {"text": course.get("name", ""), "type": "course",
         "id": str(course.get("_id"))}
        for course in courses
    ]

    professor_suggestions = [
        {"text": professor.get("name", ""), "type": "professor",
         "id": str(professor.get("_id"))}
        for professor in professors
    ]

    # Combine and limit
    all_suggestions = (
        course_suggestions + professor_suggestions + review_suggestions
    )

    return all_suggestions[:limit]
