"""
Routes for reply-related endpoints.
"""

from typing import List, Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete
from sqlalchemy.orm import joinedload

from app.db.session import get_db
from app.models.reply import Reply as ReplyModel
from app.models.review import Review as ReviewModel
from app.schemas.reply import Reply, ReplyCreate, ReplyUpdate, ReplyWithUser
from app.auth.jwt import get_current_unmuffled_user
from app.models.user import User as UserModel

router = APIRouter()


@router.get("/", response_model=List[ReplyWithUser])
async def read_replies(
    skip: int = 0,
    limit: int = 100,
    review_id: Optional[UUID] = None,
    user_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Retrieve replies with optional filters.
    """
    query = select(ReplyModel).options(joinedload(ReplyModel.user))

    if review_id:
        query = query.where(ReplyModel.review_id == review_id)
    if user_id:
        query = query.where(ReplyModel.user_id == user_id)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    replies = result.unique().scalars().all()

    return replies


@router.get("/{reply_id}", response_model=ReplyWithUser)
async def read_reply(
    reply_id: UUID,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get a specific reply by id.
    """
    stmt = (
        select(ReplyModel)
        .options(joinedload(ReplyModel.user))
        .where(ReplyModel.id == reply_id)
    )
    result = await db.execute(stmt)
    reply = result.unique().scalar_one_or_none()

    if reply is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )

    return reply


@router.post("/", response_model=Reply, status_code=status.HTTP_201_CREATED)
async def create_reply(
    reply_in: ReplyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_unmuffled_user)
) -> Any:
    """
    Create a new reply.
    """
    # Check if review exists
    stmt = select(ReviewModel).where(ReviewModel.id == reply_in.review_id)
    result = await db.execute(stmt)
    review = result.scalar_one_or_none()

    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    async with db.begin():
        stmt = insert(ReplyModel).values(
            **reply_in.dict(),
            user_id=current_user.id
        ).returning(*ReplyModel.__table__.c)
        result = await db.execute(stmt)
        reply = result.fetchone()

    return reply


@router.put("/{reply_id}", response_model=Reply)
async def update_reply(
    reply_id: UUID,
    reply_in: ReplyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_unmuffled_user)
) -> Any:
    """
    Update a reply.
    """
    stmt = select(ReplyModel).where(ReplyModel.id == reply_id)
    result = await db.execute(stmt)
    reply = result.scalar_one_or_none()

    if reply is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )

    # Check ownership
    if (
        getattr(reply, "user_id", None) != current_user.id
        and not bool(current_user.is_admin)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    update_data = reply_in.dict(exclude_unset=True)

    # Mark as edited if content is updated
    if "content" in update_data:
        update_data["is_edited"] = True

    async with db.begin():
        stmt = update(ReplyModel).where(
            ReplyModel.id == reply_id
        ).values(**update_data).returning(*ReplyModel.__table__.c)
        result = await db.execute(stmt)
        updated_reply = result.fetchone()

    return updated_reply


@router.delete("/{reply_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reply(
    reply_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_unmuffled_user)
) -> None:
    """
    Delete a reply.
    """
    stmt = select(ReplyModel).where(ReplyModel.id == reply_id)
    result = await db.execute(stmt)
    reply = result.scalar_one_or_none()

    if reply is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )

    # Check ownership
    if (
        getattr(reply, "user_id", None) != current_user.id
        and not bool(current_user.is_admin)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    async with db.begin():
        stmt = delete(ReplyModel).where(ReplyModel.id == reply_id)
        await db.execute(stmt)
