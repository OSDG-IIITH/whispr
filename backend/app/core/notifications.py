"""
Helper functions for creating notifications.
"""

from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert

from app.models.notification import Notification as NotificationModel
from app.models.user import User as UserModel
from app.models.review import Review as ReviewModel
from app.models.reply import Reply as ReplyModel
from app.models.user_followers import user_followers


async def create_notification(
    db: AsyncSession,
    username: str,
    notification_type: str,
    content: str,
    source_id: Optional[UUID] = None,
    source_type: Optional[str] = None,
    actor_username: Optional[str] = None
) -> None:
    """
    Create a notification for a user.
    """
    # Don't create notification if user is notifying themselves
    if username == actor_username:
        return

    stmt = insert(NotificationModel).values(
        username=username,
        type=notification_type,
        content=content,
        source_id=source_id,
        source_type=source_type,
        actor_username=actor_username
    )
    await db.execute(stmt)


async def notify_followers_on_review(
    db: AsyncSession,
    review_id: UUID,
    author_username: str
) -> None:
    """
    Create notifications for all followers when user creates a review.
    """
    # Get the author's user ID
    stmt = select(UserModel).where(UserModel.username == author_username)
    result = await db.execute(stmt)
    author = result.scalar_one_or_none()
    if not author:
        return

    # Get all followers of the author
    followers_stmt = (
        select(UserModel)
        .join(user_followers, UserModel.id == user_followers.c.follower_id)
        .where(user_followers.c.followed_id == author.id)
    )
    followers_result = await db.execute(followers_stmt)
    followers = followers_result.scalars().all()

    # Create notifications for each follower
    for follower in followers:
        await create_notification(
            db=db,
            username=follower.username,
            notification_type="FOLLOWER_REVIEW",
            content=f"{author_username} posted a new review",
            source_id=review_id,
            source_type="review",
            actor_username=author_username
        )


async def notify_followers_on_reply(
    db: AsyncSession,
    reply_id: UUID,
    author_username: str
) -> None:
    """
    Create notifications for all followers when user creates a reply.
    """
    # Get the author's user ID
    stmt = select(UserModel).where(UserModel.username == author_username)
    result = await db.execute(stmt)
    author = result.scalar_one_or_none()
    if not author:
        return

    # Get all followers of the author
    followers_stmt = (
        select(UserModel)
        .join(user_followers, UserModel.id == user_followers.c.follower_id)
        .where(user_followers.c.followed_id == author.id)
    )
    followers_result = await db.execute(followers_stmt)
    followers = followers_result.scalars().all()

    # Create notifications for each follower
    for follower in followers:
        await create_notification(
            db=db,
            username=follower.username,
            notification_type="FOLLOWER_REPLY",
            content=f"{author_username} posted a new reply",
            source_id=reply_id,
            source_type="reply",
            actor_username=author_username
        )


async def notify_on_vote(
    db: AsyncSession,
    target_id: UUID,
    target_type: str,
    vote_type: bool,
    voter_username: str
) -> None:
    """
    Create notification when someone votes on user's content.
    """
    # Get the author of the voted content
    if target_type == "review":
        stmt = select(ReviewModel).where(ReviewModel.id == target_id)
        result = await db.execute(stmt)
        review = result.scalar_one_or_none()
        if review:
            # Get author username
            stmt = select(UserModel).where(UserModel.id == review.user_id)
            result = await db.execute(stmt)
            author = result.scalar_one_or_none()
            if author:
                vote_text = "upvoted" if vote_type else "downvoted"
                await create_notification(
                    db=db,
                    username=author.username,
                    notification_type="VOTE",
                    content=f"{voter_username} {vote_text} your review",
                    source_id=target_id,
                    source_type="review",
                    actor_username=voter_username
                )

    elif target_type == "reply":
        stmt = select(ReplyModel).where(ReplyModel.id == target_id)
        result = await db.execute(stmt)
        reply = result.scalar_one_or_none()
        if reply:
            # Get author username
            stmt = select(UserModel).where(UserModel.id == reply.user_id)
            result = await db.execute(stmt)
            author = result.scalar_one_or_none()
            if author:
                vote_text = "upvoted" if vote_type else "downvoted"
                await create_notification(
                    db=db,
                    username=author.username,
                    notification_type="VOTE",
                    content=f"{voter_username} {vote_text} your reply",
                    source_id=target_id,
                    source_type="reply",
                    actor_username=voter_username
                )


async def notify_on_reply(
    db: AsyncSession,
    review_id: UUID,
    reply_id: UUID,
    replier_username: str
) -> None:
    """
    Create notification when someone replies to user's review.
    """
    # Get the author of the review
    stmt = select(ReviewModel).where(ReviewModel.id == review_id)
    result = await db.execute(stmt)
    review = result.scalar_one_or_none()
    if review:
        # Get author username
        stmt = select(UserModel).where(UserModel.id == review.user_id)
        result = await db.execute(stmt)
        author = result.scalar_one_or_none()
        if author:
            await create_notification(
                db=db,
                username=author.username,
                notification_type="REPLY",
                content=f"{replier_username} replied to your review",
                source_id=reply_id,
                source_type="reply",
                actor_username=replier_username
            )


async def notify_on_follow(
    db: AsyncSession,
    followed_user_id: UUID,
    follower_username: str
) -> None:
    """
    Create notification when someone follows a user.
    """
    # Get the followed user
    stmt = select(UserModel).where(UserModel.id == followed_user_id)
    result = await db.execute(stmt)
    followed_user = result.scalar_one_or_none()
    if followed_user:
        await create_notification(
            db=db,
            username=followed_user.username,
            notification_type="FOLLOW",
            content=f"{follower_username} started following you",
            source_id=None,
            source_type="user",
            actor_username=follower_username
        )


async def notify_on_rank_change(
    db: AsyncSession,
    user_id: UUID,
    new_echoes: int,
    old_echoes: int
) -> None:
    """
    Create notification when user's echo points change significantly.
    """
    # Only notify on significant changes (every 10 echoes)
    if new_echoes // 10 != old_echoes // 10:
        # Get user
        stmt = select(UserModel).where(UserModel.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            if new_echoes > old_echoes:
                await create_notification(
                    db=db,
                    username=user.username,
                    notification_type="RANK_CHANGE",
                    content=f"You've reached {new_echoes} echo points! Keep it up!",
                    source_id=None,
                    source_type="user",
                    actor_username=None
                )
            elif new_echoes < old_echoes and new_echoes % 10 == 0:
                await create_notification(
                    db=db,
                    username=user.username,
                    notification_type="RANK_CHANGE",
                    content=f"Your echo points have decreased to {new_echoes}",
                    source_id=None,
                    source_type="user",
                    actor_username=None
                )


async def notify_on_mention(
    db: AsyncSession,
    content: str,
    content_id: UUID,
    content_type: str,
    author_username: str
) -> None:
    """
    Create notifications for users mentioned in content (reviews, replies).
    """
    import re
    
    # Find all mentions in the content (@username)
    mentions = re.findall(r'@(\w+)', content)
    
    for mentioned_username in mentions:
        # Check if the mentioned user exists
        stmt = select(UserModel).where(UserModel.username == mentioned_username)
        result = await db.execute(stmt)
        mentioned_user = result.scalar_one_or_none()
        
        if mentioned_user:
            await create_notification(
                db=db,
                username=mentioned_username,
                notification_type="MENTION",
                content=f"{author_username} mentioned you in a {content_type}",
                source_id=content_id,
                source_type=content_type,
                actor_username=author_username
            )
