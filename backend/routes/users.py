"""
User routes for the Whispr API.

This module provides endpoints for user-related operations such as
profile management, following/unfollowing users, and fetching user data.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Optional

from models.user import User, UserCreate, UserUpdate, UsernameUpdate
from managers.user import UserManager
from routes.base import get_current_user, get_current_active_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}", response_model=User)
async def get_user_by_id(user_id: str):
    """
    Get a user by ID.

    Args:
        user_id: User ID to retrieve

    Returns:
        User object

    Raises:
        HTTPException: If user not found
    """
    user_manager = UserManager()
    user = await user_manager.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.get("/username/{username}", response_model=User)
async def get_user_by_username(username: str):
    """
    Get a user by username.

    Args:
        username: Username to retrieve

    Returns:
        User object

    Raises:
        HTTPException: If user not found
    """
    user_manager = UserManager()
    user = await user_manager.collection.find_one({"username": username})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.get("/me", response_model=User)
async def get_current_user_profile(current_user: Dict = Depends(get_current_user)):
    """
    Get the current user's profile.

    Args:
        current_user: Current authenticated user (from token)

    Returns:
        Current user profile
    """
    return current_user


@router.patch("/me", response_model=User)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: Dict = Depends(get_current_user)
):
    """
    Update the current user's profile.

    Args:
        user_update: User fields to update
        current_user: Current authenticated user (from token)

    Returns:
        Updated user profile
    """
    user_manager = UserManager()
    updated_user = await user_manager.update_profile(
        str(current_user["_id"]),
        user_update.dict(exclude_unset=True),
        user_id=str(current_user["_id"])
    )

    return updated_user


@router.patch("/me/username", response_model=User)
async def update_username(
    username_update: UsernameUpdate,
    current_user: Dict = Depends(get_current_user)
):
    """
    Update the current user's username.

    Args:
        username_update: New username
        current_user: Current authenticated user (from token)

    Returns:
        Updated user profile

    Raises:
        HTTPException: If username is already taken
    """
    user_manager = UserManager()

    try:
        updated_user = await user_manager.update_username(
            str(current_user["_id"]),
            username_update.username,
            user_id=str(current_user["_id"])
        )
        return updated_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/follow/{username}", response_model=User)
async def follow_user(
    username: str,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Follow another user.

    Args:
        username: Username to follow
        current_user: Current authenticated user (from token)

    Returns:
        Updated user profile

    Raises:
        HTTPException: If user to follow doesn't exist or is the current user
    """
    if current_user.get("username") == username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself"
        )

    user_manager = UserManager()

    try:
        updated_user = await user_manager.follow_user(
            str(current_user["_id"]),
            username,
            user_id=str(current_user["_id"])
        )
        return updated_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/unfollow/{username}", response_model=User)
async def unfollow_user(
    username: str,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Unfollow another user.

    Args:
        username: Username to unfollow
        current_user: Current authenticated user (from token)

    Returns:
        Updated user profile
    """
    user_manager = UserManager()
    updated_user = await user_manager.unfollow_user(
        str(current_user["_id"]),
        username,
        user_id=str(current_user["_id"])
    )

    return updated_user


@router.get("/me/stats")
async def get_user_stats(current_user: Dict = Depends(get_current_user)):
    """
    Get statistics for the current user.

    Args:
        current_user: Current authenticated user (from token)

    Returns:
        User statistics
    """
    user_manager = UserManager()
    stats = await user_manager.get_user_stats(str(current_user["_id"]))

    return stats


@router.get("/me/rank")
async def get_user_rank(current_user: Dict = Depends(get_current_user)):
    """
    Get the current rank for the authenticated user.

    Args:
        current_user: Current authenticated user (from token)

    Returns:
        User rank information
    """
    user_manager = UserManager()
    rank_info = await user_manager.get_user_rank(str(current_user["_id"]))

    return rank_info


@router.get("/leaderboard")
async def get_user_leaderboard(limit: int = Query(10, ge=1, le=100)):
    """
    Get the user leaderboard based on echo points.

    Args:
        limit: Maximum number of users to return

    Returns:
        User leaderboard
    """
    user_manager = UserManager()
    leaderboard = await user_manager.get_leaderboard(limit)

    return leaderboard


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(current_user: Dict = Depends(get_current_user)):
    """
    Delete the current user's account and all associated content.

    Args:
        current_user: Current authenticated user (from token)
    """
    user_manager = UserManager()
    result = await user_manager.delete_account(
        str(current_user["_id"]),
        user_id=str(current_user["_id"])
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        )
