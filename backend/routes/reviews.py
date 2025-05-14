"""
Review routes for the Whispr API.

This module provides endpoints for review-related operations such as
creating, updating, fetching reviews and voting on reviews.
"""
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body

from models.review import Review, ReviewCreate, ReviewUpdate
from managers.review import ReviewManager
from managers.vote import VoteManager
from routes.base import get_current_active_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/{review_id}", response_model=Review)
async def get_review(review_id: str):
    """
    Get a review by ID.

    Args:
        review_id: Review ID to retrieve

    Returns:
        Review object

    Raises:
        HTTPException: If review not found
    """
    review_manager = ReviewManager()
    review = await review_manager.get_by_id(review_id)

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    return review


@router.get("/", response_model=List[Review])
async def list_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("timestamp"),
    sort_order: int = Query(-1, ge=-1, le=1)
):
    """
    Get a list of reviews with pagination and sorting.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        sort_by: Field to sort by
        sort_order: Sort order (1 for ascending, -1 for descending)

    Returns:
        List of review objects
    """
    review_manager = ReviewManager()
    reviews = await review_manager.get_reviews(
        skip, limit, filters={}, sort_by=sort_by, sort_order=sort_order
    )

    return reviews


@router.get("/user/{user_id}", response_model=List[Review])
async def get_user_reviews(
    user_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("timestamp"),
    sort_order: int = Query(-1, ge=-1, le=1)
):
    """
    Get reviews by a specific user.

    Args:
        user_id: User ID
        skip: Number of records to skip
        limit: Maximum number of records to return
        sort_by: Field to sort by
        sort_order: Sort order (1 for ascending, -1 for descending)

    Returns:
        List of review objects
    """
    review_manager = ReviewManager()
    reviews = await review_manager.get_reviews_by_user(
        user_id, skip, limit, sort_by, sort_order
    )

    return reviews


@router.get("/type/{entity_type}/{type_id}", response_model=List[Review])
async def get_entity_reviews(
    entity_type: str,
    type_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("timestamp"),
    sort_order: int = Query(-1, ge=-1, le=1)
):
    """
    Get reviews for a specific course or professor.

    Args:
        entity_type: Review type ("course" or "professor")
        type_id: ID of the course or professor
        skip: Number of records to skip
        limit: Maximum number of records to return
        sort_by: Field to sort by
        sort_order: Sort order (1 for ascending, -1 for descending)

    Returns:
        List of review objects

    Raises:
        HTTPException: If entity_type is invalid
    """
    if entity_type not in ["course", "professor"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid review type. Must be 'course' or 'professor'"
        )

    review_manager = ReviewManager()
    reviews = await review_manager.get_reviews_by_type_id(
        entity_type, type_id, skip, limit, sort_by, sort_order
    )

    return reviews


@router.get("/search/{query}", response_model=List[Review])
async def search_reviews(
    query: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("timestamp"),
    sort_order: int = Query(-1, ge=-1, le=1)
):
    """
    Search for reviews by content or tags.

    Args:
        query: Search query
        skip: Number of records to skip
        limit: Maximum number of records to return
        sort_by: Field to sort by
        sort_order: Sort order (1 for ascending, -1 for descending)

    Returns:
        List of matching review objects
    """
    review_manager = ReviewManager()
    reviews = await review_manager.search_reviews(
        query, skip, limit, sort_by, sort_order
    )

    return reviews


@router.get("/tags/{tags}", response_model=List[Review])
async def get_reviews_by_tags(
    tags: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("timestamp"),
    sort_order: int = Query(-1, ge=-1, le=1)
):
    """
    Get reviews that match specified tags.

    Args:
        tags: Comma-separated list of tags
        skip: Number of records to skip
        limit: Maximum number of records to return
        sort_by: Field to sort by
        sort_order: Sort order (1 for ascending, -1 for descending)

    Returns:
        List of matching review objects
    """
    tag_list = tags.split(",")
    review_manager = ReviewManager()
    reviews = await review_manager.get_reviews_by_tags(
        tag_list, skip, limit, sort_by, sort_order
    )

    return reviews


@router.post("/", response_model=Review, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: ReviewCreate,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Create a new review.

    Args:
        review_data: Review data
        current_user: Current authenticated and active user

    Returns:
        Created review object
    """
    review_manager = ReviewManager()
    review = await review_manager.create_review(
        review_data.dict(),
        user_id=str(current_user["_id"])
    )

    return review


@router.put("/{review_id}", response_model=Review)
async def update_review(
    review_id: str,
    review_update: ReviewUpdate,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Update a review.

    Args:
        review_id: Review ID to update
        review_update: Review update data
        current_user: Current authenticated and active user

    Returns:
        Updated review object

    Raises:
        HTTPException: If review not found or user not authorized
    """
    review_manager = ReviewManager()

    try:
        updated_review = await review_manager.update_review(
            review_id,
            review_update.dict(exclude_unset=True),
            user_id=str(current_user["_id"])
        )
        return updated_review
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        ) from e


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: str,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Delete a review.

    Args:
        review_id: Review ID to delete
        current_user: Current authenticated and active user

    Raises:
        HTTPException: If review not found or user not authorized
    """
    review_manager = ReviewManager()

    try:
        result = await review_manager.delete_review(
            review_id,
            user_id=str(current_user["_id"])
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        ) from e


@router.post("/{review_id}/vote")
async def vote_on_review(
    review_id: str,
    vote_type: str = Body(...),
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Vote on a review (upvote or downvote).

    Args:
        review_id: Review ID to vote on
        vote_type: Type of vote ("upvote" or "downvote")
        current_user: Current authenticated and active user

    Returns:
        Vote status

    Raises:
        HTTPException: If vote type is invalid
    """
    if vote_type not in ["upvote", "downvote"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid vote type. Must be 'upvote' or 'downvote'"
        )

    # Check if review exists
    review_manager = ReviewManager()
    review = await review_manager.get_by_id(review_id)

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    # Create or update vote
    vote_manager = VoteManager()
    vote_data = {
        "content_type": "review",
        "content_id": review_id,
        "vote_type": vote_type
    }

    vote = await vote_manager.create_or_update_vote(
        vote_data,
        user_id=str(current_user["_id"])
    )

    return {
        "success": True,
        "vote_id": str(vote["_id"]),
        "vote_type": vote["vote_type"]
    }


@router.delete("/{review_id}/vote", status_code=status.HTTP_204_NO_CONTENT)
async def remove_review_vote(
    review_id: str,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Remove a vote from a review.

    Args:
        review_id: Review ID to remove vote from
        current_user: Current authenticated and active user

    Raises:
        HTTPException: If vote not found
    """
    vote_manager = VoteManager()
    result = await vote_manager.remove_vote(
        "review",
        review_id,
        user_id=str(current_user["_id"])
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vote not found"
        )
