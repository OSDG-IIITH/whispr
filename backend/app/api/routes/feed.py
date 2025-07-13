"""
Feed-related routes for serving personalized content.
"""

from typing import List, Any
from datetime import datetime, timedelta, timezone
from uuid import UUID
import random

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import joinedload

from app.db.session import get_db
from app.models.user import User as UserModel
from app.models.user_followers import user_followers
from app.models.review import Review as ReviewModel
from app.models.course import Course as CourseModel
from app.models.professor import Professor as ProfessorModel
from app.models.course_instructor import CourseInstructor as CourseInstructorModel
from app.schemas.review import Review
from app.auth.jwt import get_current_user

router = APIRouter()


@router.get("/", response_model=List[Review])
async def get_feed(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Get personalized feed for the current user.
    
    The feed algorithm:
    1. Recent reviews (within 1 week) by followed users - higher probability
    2. Recent reviews of courses/professors followed users have reviewed - medium probability
    3. Random reviews (preferring recent ones) - lower probability
    
    Uses stochastic ordering to create engaging, doom-scrolling experience.
    """
    # Get one week ago timestamp
    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    # Get all users current user follows
    stmt = select(user_followers.c.followed_id).where(
        user_followers.c.follower_id == current_user.id
    )
    result = await db.execute(stmt)
    followed_user_ids = [str(row.followed_id) for row in result.fetchall()]
    
    feed_reviews = []
    
    # Phase 1: Recent reviews by followed users (high priority)
    if followed_user_ids:
        stmt = (
            select(ReviewModel)
            .options(
                joinedload(ReviewModel.user),
                joinedload(ReviewModel.course),
                joinedload(ReviewModel.professor),
                joinedload(ReviewModel.course_instructor).joinedload(CourseInstructorModel.course),
                joinedload(ReviewModel.course_instructor).joinedload(CourseInstructorModel.professor)
            )
            .where(
                and_(
                    ReviewModel.user_id.in_(followed_user_ids),
                    ReviewModel.created_at >= one_week_ago
                )
            )
            .order_by(ReviewModel.created_at.desc())
        )
        
        result = await db.execute(stmt)
        followed_recent_reviews = result.scalars().all()
        
        # Add all recent reviews from followed users with high probability
        for review in followed_recent_reviews:
            if random.random() < 0.8:  # 80% chance to include
                feed_reviews.append(review)
    
    # Phase 2: Reviews of courses/professors that followed users have reviewed
    if followed_user_ids and len(feed_reviews) < limit:
        # Get courses/professors that followed users have reviewed
        stmt = select(ReviewModel.course_id, ReviewModel.professor_id, ReviewModel.course_instructor_id).where(
            ReviewModel.user_id.in_(followed_user_ids)
        ).distinct()
        
        result = await db.execute(stmt)
        followed_subjects = result.fetchall()
        
        course_ids = [str(row.course_id) for row in followed_subjects if row.course_id]
        professor_ids = [str(row.professor_id) for row in followed_subjects if row.professor_id]
        course_instructor_ids = [str(row.course_instructor_id) for row in followed_subjects if row.course_instructor_id]
        
        if course_ids or professor_ids or course_instructor_ids:
            conditions = []
            if course_ids:
                conditions.append(ReviewModel.course_id.in_(course_ids))
            if professor_ids:
                conditions.append(ReviewModel.professor_id.in_(professor_ids))
            if course_instructor_ids:
                conditions.append(ReviewModel.course_instructor_id.in_(course_instructor_ids))
            
            stmt = (
                select(ReviewModel)
                .options(
                    joinedload(ReviewModel.user),
                    joinedload(ReviewModel.course),
                    joinedload(ReviewModel.professor),
                    joinedload(ReviewModel.course_instructor).joinedload(CourseInstructorModel.course),
                    joinedload(ReviewModel.course_instructor).joinedload(CourseInstructorModel.professor)
                )
                .where(
                    and_(
                        or_(*conditions),
                        ReviewModel.user_id.notin_(followed_user_ids),  # Don't duplicate
                        ReviewModel.user_id != current_user.id  # Don't include own reviews
                    )
                )
                .order_by(ReviewModel.created_at.desc())
                .limit(50)  # Get more to sample from
            )
            
            result = await db.execute(stmt)
            subject_reviews = result.scalars().all()
            
            # Add with medium probability, preferring recent ones
            for review in subject_reviews:
                if len(feed_reviews) >= limit:
                    break
                
                # Higher probability for recent reviews
                review_time = review.created_at
                if review_time.tzinfo is None:
                    review_time = review_time.replace(tzinfo=timezone.utc)
                days_old = (datetime.now(timezone.utc) - review_time).days
                probability = max(0.1, 0.5 - (days_old * 0.05))  # Decreases with age
                
                if random.random() < probability:
                    feed_reviews.append(review)
    
    # Phase 3: Random reviews (fill remaining slots)
    if len(feed_reviews) < limit:
        remaining_slots = limit - len(feed_reviews)
        
        # Get random reviews, excluding already included ones and own reviews
        excluded_ids = [str(review.id) for review in feed_reviews]
        
        stmt = (
            select(ReviewModel)
            .options(
                joinedload(ReviewModel.user),
                joinedload(ReviewModel.course),
                joinedload(ReviewModel.professor),
                joinedload(ReviewModel.course_instructor).joinedload(CourseInstructorModel.course),
                joinedload(ReviewModel.course_instructor).joinedload(CourseInstructorModel.professor)
            )
            .where(
                and_(
                    ReviewModel.id.notin_(excluded_ids) if excluded_ids else True,
                    ReviewModel.user_id != current_user.id
                )
            )
            .order_by(func.random())
            .limit(remaining_slots * 3)  # Get more to sample from
        )
        
        result = await db.execute(stmt)
        random_reviews = result.scalars().all()
        
        # Add with probability favoring recent reviews
        for review in random_reviews:
            if len(feed_reviews) >= limit:
                break
                
            # Higher probability for recent reviews
            review_time = review.created_at
            if review_time.tzinfo is None:
                review_time = review_time.replace(tzinfo=timezone.utc)
            days_old = (datetime.now(timezone.utc) - review_time).days
            probability = max(0.1, 0.3 - (days_old * 0.02))  # Decreases with age
            
            if random.random() < probability:
                feed_reviews.append(review)
    
    # Shuffle the final feed to create variety
    random.shuffle(feed_reviews)
    
    # Apply pagination
    paginated_reviews = feed_reviews[skip:skip + limit]
    
    return paginated_reviews


@router.get("/stats", response_model=dict)
async def get_feed_stats(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Get feed statistics for the current user.
    """
    # Get user's review count
    stmt = select(func.count(ReviewModel.id)).where(ReviewModel.user_id == current_user.id)
    result = await db.execute(stmt)
    review_count = result.scalar()
    
    # Get user's reply count
    from app.models.reply import Reply as ReplyModel
    stmt = select(func.count(ReplyModel.id)).where(ReplyModel.user_id == current_user.id)
    result = await db.execute(stmt)
    reply_count = result.scalar()
    
    # Get user's vote count
    from app.models.vote import Vote as VoteModel
    stmt = select(func.count(VoteModel.id)).where(VoteModel.user_id == current_user.id)
    result = await db.execute(stmt)
    vote_count = result.scalar()
    
    # Get follower and following counts using direct queries
    followers_stmt = select(func.count(user_followers.c.follower_id)).where(
        user_followers.c.followed_id == current_user.id
    )
    following_stmt = select(func.count(user_followers.c.followed_id)).where(
        user_followers.c.follower_id == current_user.id
    )
    
    followers_result = await db.execute(followers_stmt)
    following_result = await db.execute(following_stmt)
    
    followers_count = followers_result.scalar()
    following_count = following_result.scalar()
    
    return {
        "review_count": review_count,
        "reply_count": reply_count,
        "vote_count": vote_count,
        "followers_count": followers_count,
        "following_count": following_count,
        "echoes": current_user.echoes
    }
