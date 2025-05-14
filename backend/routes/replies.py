"""
Reply routes for the Whispr API.

This module provides endpoints for reply-related operations such as
creating, updating, fetching replies and voting on replies.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from typing import List, Dict, Optional

from models.reply import Reply, ReplyCreate, ReplyUpdate
from managers.reply import ReplyManager
from managers.vote import VoteManager
from managers.review import ReviewManager
from routes.base import get_current_user, get_current_active_user

router = APIRouter(prefix="/replies", tags=["replies"])


@router.get("/{reply_id}", response_model=Reply)
async def get_reply(reply_id: str):
    """
    Get a reply by ID.

    Args:
        reply_id: Reply ID to retrieve

    Returns:
        Reply object

    Raises:
        HTTPException: If reply not found
    """
    reply_manager = ReplyManager()
    reply = await reply_manager.get_by_id(reply_id)

    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )

    return reply


@router.get("/review/{review_id}", response_model=List[Reply])
async def get_review_replies(
    review_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("timestamp"),
    sort_order: int = Query(1, ge=-1, le=1)
):
    """
    Get all replies for a specific review.

    Args:
        review_id: Review ID
        skip: Number of records to skip
        limit: Maximum number of records to return
        sort_by: Field to sort by
        sort_order: Sort order (1 for ascending, -1 for descending)

    Returns:
        List of reply objects

    Raises:
        HTTPException: If review not found
    """
    # Check if the review exists
    review_manager = ReviewManager()
    review = await review_manager.get_by_id(review_id)

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    reply_manager = ReplyManager()
    replies = await reply_manager.get_replies_for_review(
        review_id, skip, limit, sort_by, sort_order
    )

    return replies


@router.get("/user/{user_id}", response_model=List[Reply])
async def get_user_replies(
    user_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("timestamp"),
    sort_order: int = Query(-1, ge=-1, le=1)
):
    """
    Get all replies by a specific user.

    Args:
        user_id: User ID
        skip: Number of records to skip
        limit: Maximum number of records to return
        sort_by: Field to sort by
        sort_order: Sort order (1 for ascending, -1 for descending)

    Returns:
        List of reply objects
    """
    reply_manager = ReplyManager()
    replies = await reply_manager.get_replies_by_user(
        user_id, skip, limit, sort_by, sort_order
    )

    return replies


@router.get("/user/{user_id}/context")
async def get_user_replies_with_context(
    user_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("timestamp"),
    sort_order: int = Query(-1, ge=-1, le=1)
):
    """
    Get replies by a user with their review context.

    Args:
        user_id: User ID
        skip: Number of records to skip
        limit: Maximum number of records to return
        sort_by: Field to sort by
        sort_order: Sort order (1 for ascending, -1 for descending)

    Returns:
        List of reply objects with review context
    """
    reply_manager = ReplyManager()
    replies_with_context = await reply_manager.get_replies_with_review_data(
        user_id, skip, limit, sort_by, sort_order
    )

    return replies_with_context


@router.post("/", response_model=Reply, status_code=status.HTTP_201_CREATED)
async def create_reply(
    reply_data: ReplyCreate,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Create a new reply to a review.

    Args:
        reply_data: Reply data
        current_user: Current authenticated and active user

    Returns:
        Created reply object

    Raises:
        HTTPException: If review not found
    """
    # Check if the review exists
    review_manager = ReviewManager()
    review = await review_manager.get_by_id(reply_data.review_id)

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    reply_manager = ReplyManager()
    reply = await reply_manager.create_reply(
        reply_data.dict(),
        user_id=str(current_user["_id"])
    )

    return reply


@router.put("/{reply_id}", response_model=Reply)
async def update_reply(
    reply_id: str,
    reply_update: ReplyUpdate,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Update a reply.

    Args:
        reply_id: Reply ID to update
        reply_update: Reply update data
        current_user: Current authenticated and active user

    Returns:
        Updated reply object

    Raises:
        HTTPException: If reply not found or user not authorized
    """
    reply_manager = ReplyManager()

    try:
        updated_reply = await reply_manager.update_reply(
            reply_id,
            reply_update.dict(exclude_unset=True),
            user_id=str(current_user["_id"])
        )
        return updated_reply
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/{reply_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reply(
    reply_id: str,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Delete a reply.

    Args:
        reply_id: Reply ID to delete
        current_user: Current authenticated and active user

    Raises:
        HTTPException: If reply not found or user not authorized
    """
    reply_manager = ReplyManager()

    try:
        result = await reply_manager.delete_reply(
            reply_id,
            user_id=str(current_user["_id"])
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reply not found"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post("/{reply_id}/vote")
async def vote_on_reply(
    reply_id: str,
    vote_type: str = Body(...),
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Vote on a reply (upvote or downvote).

    Args:
        reply_id: Reply ID to vote on
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

    # Check if reply exists
    reply_manager = ReplyManager()
    reply = await reply_manager.get_by_id(reply_id)

    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )

    # Create or update vote
    vote_manager = VoteManager()
    vote_data = {
        "content_type": "reply",
        "content_id": reply_id,
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


@router.delete("/{reply_id}/vote", status_code=status.HTTP_204_NO_CONTENT)
async def remove_reply_vote(
    reply_id: str,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Remove a vote from a reply.

    Args:
        reply_id: Reply ID to remove vote from
        current_user: Current authenticated and active user

    Raises:
        HTTPException: If vote not found
    """
    vote_manager = VoteManager()
    result = await vote_manager.remove_vote(
        "reply",
        reply_id,
        user_id=str(current_user["_id"])
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vote not found"
        )
