"""
Notification routes for the Whispr API.

This module provides endpoints for notification-related operations such as
fetching notifications, marking them as read, and deleting them.
"""
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query

from models.notification import Notification
from managers.notification import NotificationManager
from routes.base import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=List[Notification])
async def get_user_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    sort_by: str = Query("timestamp"),
    sort_order: int = Query(-1, ge=-1, le=1),
    current_user: Dict = Depends(get_current_user)
):
    """
    Get notifications for the current user.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        unread_only: Whether to return only unread notifications
        sort_by: Field to sort by
        sort_order: Sort order (1 for ascending, -1 for descending)
        current_user: Current authenticated user

    Returns:
        List of notification objects
    """
    notification_manager = NotificationManager()
    notifications = await notification_manager.get_user_notifications(
        current_user["username"],
        skip,
        limit,
        unread_only,
        sort_by,
        sort_order
    )

    return notifications


@router.get("/count")
async def get_unread_notification_count(
    current_user: Dict = Depends(get_current_user)
):
    """
    Get count of unread notifications for the current user.

    Args:
        current_user: Current authenticated user

    Returns:
        Count of unread notifications
    """
    notification_manager = NotificationManager()
    count = await notification_manager.count_unread_notifications(
        current_user["username"]
    )

    return {"count": count}


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    Mark a notification as read.

    Args:
        notification_id: Notification ID to mark as read
        current_user: Current authenticated user

    Returns:
        Updated notification object

    Raises:
        HTTPException: If notification not found or user not authorized
    """
    notification_manager = NotificationManager()

    try:
        updated_notification = await \
            notification_manager.mark_notification_read(
                notification_id,
                user_id=str(current_user["_id"])
            )

        if not updated_notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )

        return updated_notification
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        ) from e


@router.post("/read-all")
async def mark_all_notifications_read(
    current_user: Dict = Depends(get_current_user)
):
    """
    Mark all notifications as read for the current user.

    Args:
        current_user: Current authenticated user

    Returns:
        Count of notifications marked as read
    """
    notification_manager = NotificationManager()
    count = await notification_manager.mark_all_notifications_read(
        user_id=str(current_user["_id"])
    )

    return {"marked_read": count}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    Delete a notification.

    Args:
        notification_id: Notification ID to delete
        current_user: Current authenticated user

    Raises:
        HTTPException: If notification not found or user not authorized
    """
    notification_manager = NotificationManager()

    try:
        result = await notification_manager.delete_notification(
            notification_id,
            user_id=str(current_user["_id"])
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        ) from e
