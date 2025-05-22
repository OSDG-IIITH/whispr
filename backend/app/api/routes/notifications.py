"""
Routes for notification-related endpoints.
"""

from typing import List, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete, and_

from app.db.session import get_db
from app.models.notification import Notification as NotificationModel
from app.schemas.notification import (Notification, NotificationCreate,
                                      NotificationUpdate)
from app.auth.jwt import get_current_user, get_current_admin_user
from app.models.user import User as UserModel

router = APIRouter()


@router.get("/", response_model=List[Notification])
async def read_notifications(
    skip: int = 0,
    limit: int = 100,
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Retrieve current user's notifications.
    """
    query = select(NotificationModel).where(
        NotificationModel.username == current_user.username
    )

    if unread_only:
        query = query.where(NotificationModel.is_read.is_(False))

    query = query.order_by(
        NotificationModel.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    notifications = result.scalars().all()

    return notifications


@router.get("/{notification_id}", response_model=Notification)
async def read_notification(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Get a specific notification by id.
    """
    stmt = select(NotificationModel).where(
        and_(
            NotificationModel.id == notification_id,
            NotificationModel.username == current_user.username
        )
    )
    result = await db.execute(stmt)
    notification = result.scalar_one_or_none()

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    return notification


@router.post(
    "/", response_model=Notification, status_code=status.HTTP_201_CREATED
)
async def create_notification(
    notification_in: NotificationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """
    Create a new notification (admin only).
    """
    async with db.begin():
        stmt = insert(NotificationModel).values(
            **notification_in.dict()
        ).returning(*NotificationModel.__table__.c)
        result = await db.execute(stmt)
        notification = result.fetchone()

    return notification


@router.put("/{notification_id}", response_model=Notification)
async def update_notification(
    notification_id: UUID,
    notification_in: NotificationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Update a notification (mark as read).
    """
    stmt = select(NotificationModel).where(
        and_(
            NotificationModel.id == notification_id,
            NotificationModel.username == current_user.username
        )
    )
    result = await db.execute(stmt)
    notification = result.scalar_one_or_none()

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    update_data = notification_in.dict(exclude_unset=True)

    async with db.begin():
        stmt = update(NotificationModel).where(
            NotificationModel.id == notification_id
        ).values(**update_data).returning(*NotificationModel.__table__.c)
        result = await db.execute(stmt)
        updated_notification = result.fetchone()

    return updated_notification


@router.put("/mark-all-read", response_model=dict)
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Mark all of the current user's notifications as read.
    """
    async with db.begin():
        stmt = update(NotificationModel).where(
            and_(
                NotificationModel.username == current_user.username,
                NotificationModel.is_read.is_(False)
            )
        ).values(is_read=True)
        await db.execute(stmt)

    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> None:
    """
    Delete a notification.
    """
    stmt = select(NotificationModel).where(
        and_(
            NotificationModel.id == notification_id,
            NotificationModel.username == current_user.username
        )
    )
    result = await db.execute(stmt)
    notification = result.scalar_one_or_none()

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    async with db.begin():
        stmt = delete(NotificationModel).where(
            NotificationModel.id == notification_id)
        await db.execute(stmt)
