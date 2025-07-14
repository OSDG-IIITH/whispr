"""
Helper functions for managing echo points.
"""

from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, and_, case

from app.models.user import User as UserModel
from app.models.vote import Vote as VoteModel
from app.models.review import Review as ReviewModel
from app.models.reply import Reply as ReplyModel
from app.core.notifications import notify_on_rank_change


async def calculate_user_echo_points(
    db: AsyncSession,
    user_id: UUID
) -> int:
    """
    Calculate a user's echo points based on their content votes.
    
    Echo points calculation:
    - +1 for each upvote on your review
    - -1 for each downvote on your review
    - +0.5 for each upvote on your reply
    - -0.5 for each downvote on your reply
    """
    # Get votes on user's reviews
    stmt = select(func.sum(
        case(
            (VoteModel.vote_type.is_(True), 1),
            (VoteModel.vote_type.is_(False), -1),
            else_=0
        )
    )).select_from(
        VoteModel.__table__.join(
            ReviewModel.__table__,
            VoteModel.review_id == ReviewModel.id
        )
    ).where(ReviewModel.user_id == user_id)
    
    result = await db.execute(stmt)
    review_points = result.scalar_one() or 0

    # Get votes on user's replies
    stmt = select(func.sum(
        case(
            (VoteModel.vote_type.is_(True), 0.5),
            (VoteModel.vote_type.is_(False), -0.5),
            else_=0
        )
    )).select_from(
        VoteModel.__table__.join(
            ReplyModel.__table__,
            VoteModel.reply_id == ReplyModel.id
        )
    ).where(ReplyModel.user_id == user_id)
    
    result = await db.execute(stmt)
    reply_points = result.scalar_one() or 0

    return int(review_points + reply_points)


async def update_user_echo_points(
    db: AsyncSession,
    user_id: UUID,
    notify: bool = True
) -> None:
    """
    Update a user's echo points based on their current votes.
    """
    # Get current echo points
    stmt = select(UserModel.echoes).where(UserModel.id == user_id)
    result = await db.execute(stmt)
    old_echoes = result.scalar_one() or 0

    # Calculate new echo points
    new_echoes = await calculate_user_echo_points(db, user_id)

    # Update user's echo points
    stmt = update(UserModel).where(
        UserModel.id == user_id
    ).values(echoes=new_echoes)
    await db.execute(stmt)

    # Notify on significant changes
    if notify:
        await notify_on_rank_change(db, user_id, new_echoes, old_echoes)


async def update_multiple_users_echo_points(
    db: AsyncSession,
    user_ids: list[UUID]
) -> None:
    """
    Update echo points for multiple users.
    Useful when a vote affects multiple users.
    """
    for user_id in user_ids:
        await update_user_echo_points(db, user_id, notify=False)


async def get_user_rank_from_echoes(echoes: int) -> dict:
    """
    Get user rank information based on echo points.
    """
    if echoes < 0:
        return {"rank": "Muffled", "color": "red", "icon": "VolumeX"}
    elif echoes < 10:
        return {"rank": "Whisper", "color": "gray", "icon": "User"}
    elif echoes < 25:
        return {"rank": "Voice", "color": "blue", "icon": "MessageSquare"}
    elif echoes < 50:
        return {"rank": "Speaker", "color": "green", "icon": "Megaphone"}
    elif echoes < 100:
        return {"rank": "Resonator", "color": "purple", "icon": "Music"}
    elif echoes < 200:
        return {"rank": "Amplifier", "color": "orange", "icon": "Radio"}
    else:
        return {"rank": "Echo Master", "color": "gold", "icon": "Crown"}
