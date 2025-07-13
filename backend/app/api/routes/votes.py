"""
Routes for vote-related endpoints.
"""

from typing import List, Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete, func, and_

from app.db.session import get_db
from app.models.vote import Vote as VoteModel
from app.models.review import Review as ReviewModel
from app.models.reply import Reply as ReplyModel
from app.schemas.vote import Vote, VoteCreate
from app.auth.jwt import get_current_unmuffled_user
from app.models.user import User as UserModel
from app.core.notifications import notify_on_vote
from app.core.echo_points import update_user_echo_points

router = APIRouter()


@router.get("/", response_model=List[Vote])
async def read_votes(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[UUID] = None,
    review_id: Optional[UUID] = None,
    reply_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_unmuffled_user)
) -> Any:
    """
    Retrieve votes with optional filters.
    """
    query = select(VoteModel)

    # Apply filters
    filters = []
    if user_id:
        filters.append(VoteModel.user_id == user_id)
    if review_id:
        filters.append(VoteModel.review_id == review_id)
    if reply_id:
        filters.append(VoteModel.reply_id == reply_id)

    if filters:
        query = query.where(and_(*filters))

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    votes = result.scalars().all()

    return votes


@router.get("/me", response_model=List[Vote])
async def read_my_votes(
    skip: int = 0,
    limit: int = 100,
    review_id: Optional[UUID] = None,
    reply_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_unmuffled_user)
) -> Any:
    """
    Retrieve current user's votes with optional filters.
    """
    query = select(VoteModel).where(VoteModel.user_id == current_user.id)

    # Apply filters
    if review_id:
        query = query.where(VoteModel.review_id == review_id)
    if reply_id:
        query = query.where(VoteModel.reply_id == reply_id)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    votes = result.scalars().all()

    return votes


@router.post("/", response_model=Vote, status_code=status.HTTP_201_CREATED)
async def create_vote(
    vote_in: VoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_unmuffled_user)
) -> Any:
    """
    Create a new vote.
    """
    # Validate that exactly one target is provided
    if (vote_in.review_id is None and vote_in.reply_id is None) or \
            (vote_in.review_id is not None and vote_in.reply_id is not None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exactly one of review_id or reply_id must be provided"
        )

    # Check if target exists
    if vote_in.review_id:
        stmt = select(ReviewModel).where(ReviewModel.id == vote_in.review_id)
        result = await db.execute(stmt)
        review = result.scalar_one_or_none()
        if review is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )

    if vote_in.reply_id:
        stmt = select(ReplyModel).where(ReplyModel.id == vote_in.reply_id)
        result = await db.execute(stmt)
        reply = result.scalar_one_or_none()
        if reply is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reply not found"
            )

    # Check if user already voted on this target
    filters = [VoteModel.user_id == current_user.id]
    if vote_in.review_id:
        filters.append(VoteModel.review_id == vote_in.review_id)
    if vote_in.reply_id:
        filters.append(VoteModel.reply_id == vote_in.reply_id)

    stmt = select(VoteModel).where(and_(*filters))
    result = await db.execute(stmt)
    existing_vote = result.scalar_one_or_none()

    if existing_vote:
        # If vote type is the same, return existing vote
        if getattr(existing_vote, "vote_type", None) == vote_in.vote_type:
            return existing_vote

        # If vote type is different, update the existing vote
        async with db.begin():
            stmt = update(VoteModel).where(
                VoteModel.id == existing_vote.id
            ).values(
                vote_type=vote_in.vote_type
            ).returning(*VoteModel.__table__.c)
            result = await db.execute(stmt)
            updated_vote = result.fetchone()

            # Update target's vote stats
            if vote_in.review_id:
                await _update_review_vote_stats(db, vote_in.review_id)
                # Update echo points for review author
                review = await db.execute(select(ReviewModel).where(ReviewModel.id == vote_in.review_id))
                review_obj = review.scalar_one_or_none()
                if review_obj:
                    await update_user_echo_points(db, review_obj.user_id, notify=False)
            if vote_in.reply_id:
                await _update_reply_vote_stats(db, vote_in.reply_id)
                # Update echo points for reply author
                reply = await db.execute(select(ReplyModel).where(ReplyModel.id == vote_in.reply_id))
                reply_obj = reply.scalar_one_or_none()
                if reply_obj:
                    await update_user_echo_points(db, reply_obj.user_id, notify=False)

            # Create notification
            if vote_in.review_id:
                await notify_on_vote(db, vote_in.review_id, "review", vote_in.vote_type, current_user.username)
            if vote_in.reply_id:
                await notify_on_vote(db, vote_in.reply_id, "reply", vote_in.vote_type, current_user.username)

        return updated_vote

    # Create new vote
    async with db.begin():
        stmt = insert(VoteModel).values(
            user_id=current_user.id,
            review_id=vote_in.review_id,
            reply_id=vote_in.reply_id,
            vote_type=vote_in.vote_type
        ).returning(*VoteModel.__table__.c)
        result = await db.execute(stmt)
        vote = result.fetchone()

        # Update target's vote stats
        if vote_in.review_id:
            await _update_review_vote_stats(db, vote_in.review_id)
            # Update echo points for review author
            review = await db.execute(select(ReviewModel).where(ReviewModel.id == vote_in.review_id))
            review_obj = review.scalar_one_or_none()
            if review_obj:
                await update_user_echo_points(db, review_obj.user_id, notify=False)
        if vote_in.reply_id:
            await _update_reply_vote_stats(db, vote_in.reply_id)
            # Update echo points for reply author
            reply = await db.execute(select(ReplyModel).where(ReplyModel.id == vote_in.reply_id))
            reply_obj = reply.scalar_one_or_none()
            if reply_obj:
                await update_user_echo_points(db, reply_obj.user_id, notify=False)

        # Create notification
        if vote_in.review_id:
            await notify_on_vote(db, vote_in.review_id, "review", vote_in.vote_type, current_user.username)
        if vote_in.reply_id:
            await notify_on_vote(db, vote_in.reply_id, "reply", vote_in.vote_type, current_user.username)

    return vote


@router.delete("/{vote_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vote(
    vote_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_unmuffled_user)
) -> None:
    """
    Delete a vote.
    """
    stmt = select(VoteModel).where(VoteModel.id == vote_id)
    result = await db.execute(stmt)
    vote = result.scalar_one_or_none()

    if vote is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vote not found"
        )

    # Check ownership
    if (
        getattr(vote, "user_id", None) != current_user.id
        and not bool(current_user.is_admin)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    review_id = getattr(vote, "review_id", None)
    reply_id = getattr(vote, "reply_id", None)

    async with db.begin():
        stmt = delete(VoteModel).where(VoteModel.id == vote_id)
        await db.execute(stmt)

        # Update target's vote stats
        if review_id:
            await _update_review_vote_stats(db, review_id)
            # Update echo points for review author
            review = await db.execute(select(ReviewModel).where(ReviewModel.id == review_id))
            review_obj = review.scalar_one_or_none()
            if review_obj:
                await update_user_echo_points(db, review_obj.user_id, notify=False)
        if reply_id:
            await _update_reply_vote_stats(db, reply_id)
            # Update echo points for reply author
            reply = await db.execute(select(ReplyModel).where(ReplyModel.id == reply_id))
            reply_obj = reply.scalar_one_or_none()
            if reply_obj:
                await update_user_echo_points(db, reply_obj.user_id, notify=False)


# Helper functions to update vote statistics
async def _update_review_vote_stats(db: AsyncSession, review_id: UUID) -> None:
    """Update review vote stats."""
    # Get upvotes count
    stmt = select(func.count()).where(and_(
        VoteModel.review_id == review_id,
        VoteModel.vote_type.is_(True)
    ))
    result = await db.execute(stmt)
    upvotes = result.scalar_one()

    # Get downvotes count
    stmt = select(func.count()).where(and_(
        VoteModel.review_id == review_id,
        VoteModel.vote_type.is_(False)
    ))
    result = await db.execute(stmt)
    downvotes = result.scalar_one()

    # Update review
    stmt = update(ReviewModel).where(
        ReviewModel.id == review_id
    ).values(
        upvotes=upvotes,
        downvotes=downvotes
    )
    await db.execute(stmt)


async def _update_reply_vote_stats(db: AsyncSession, reply_id: UUID) -> None:
    """Update reply vote stats."""
    # Get upvotes count
    stmt = select(func.count()).where(and_(
        VoteModel.reply_id == reply_id,
        VoteModel.vote_type.is_(True)
    ))
    result = await db.execute(stmt)
    upvotes = result.scalar_one()

    # Get downvotes count
    stmt = select(func.count()).where(and_(
        VoteModel.reply_id == reply_id,
        VoteModel.vote_type.is_(False)
    ))
    result = await db.execute(stmt)
    downvotes = result.scalar_one()

    # Update reply
    stmt = update(ReplyModel).where(
        ReplyModel.id == reply_id
    ).values(
        upvotes=upvotes,
        downvotes=downvotes
    )
    await db.execute(stmt)
