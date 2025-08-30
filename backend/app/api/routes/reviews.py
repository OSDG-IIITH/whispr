"""
Routes for review-related endpoints.
"""

from typing import List, Any, Optional
from uuid import UUID
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete, func, and_, desc, asc, case
from sqlalchemy.orm import joinedload

from app.db.session import get_db
from app.models.review import Review as ReviewModel
from app.models.course import Course as CourseModel
from app.models.professor import Professor as ProfessorModel
from app.models.course_instructor import \
    CourseInstructor as CourseInstructorModel
from app.models.course_instructor_review import \
    CourseInstructorReview as CourseInstructorReviewModel
from app.schemas.review import (
    Review, ReviewCreate, ReviewUpdate, ReviewWithUser, ReviewWithRelations)
from app.auth.jwt import get_current_unmuffled_user
from app.models.user import User as UserModel
from app.core.notifications import notify_on_mention, notify_followers_on_review

router = APIRouter()


class SortBy(str, Enum):
    """Available sorting options for reviews."""
    DATE_NEW = "date_new"  # Newest first
    DATE_OLD = "date_old"  # Oldest first
    VOTES_HIGH = "votes_high"  # Highest net votes first
    VOTES_LOW = "votes_low"  # Lowest net votes first
    RATING_HIGH = "rating_high"  # Highest rating first
    RATING_LOW = "rating_low"  # Lowest rating first
    CONTROVERSIAL = "controversial"  # Most controversial (high total votes)


@router.get("/", response_model=List[ReviewWithRelations])
async def read_reviews(
    skip: int = 0,
    limit: int = 100,
    course_id: Optional[UUID] = None,
    professor_id: Optional[UUID] = None,
    course_instructor_id: Optional[UUID] = None,
    user_id: Optional[UUID] = None,
    sort_by: SortBy = Query(SortBy.DATE_NEW, description="Sort reviews by"),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Retrieve reviews with optional filters.
    """
    # Load all relations for comprehensive data
    query = select(ReviewModel).options(
        joinedload(ReviewModel.user),
        joinedload(ReviewModel.course),
        joinedload(ReviewModel.professor),
        joinedload(ReviewModel.course_instructor_reviews).joinedload(
            CourseInstructorReviewModel.course_instructor).joinedload(
            CourseInstructorModel.course),
        joinedload(ReviewModel.course_instructor_reviews).joinedload(
            CourseInstructorReviewModel.course_instructor).joinedload(
            CourseInstructorModel.professor)
    )

    # Apply filters
    filters = []
    if course_id:
        filters.append(ReviewModel.course_id == course_id)
    if professor_id:
        filters.append(ReviewModel.professor_id == professor_id)
    if course_instructor_id:
        # Join with course_instructor_reviews to filter by course_instructor_id
        query = query.join(CourseInstructorReviewModel)
        filters.append(CourseInstructorReviewModel.course_instructor_id == course_instructor_id)
    if user_id:
        filters.append(ReviewModel.user_id == user_id)

    if filters:
        query = query.where(and_(*filters))

    # Apply sorting
    if sort_by == SortBy.DATE_NEW:
        query = query.order_by(desc(ReviewModel.created_at))
    elif sort_by == SortBy.DATE_OLD:
        query = query.order_by(asc(ReviewModel.created_at))
    elif sort_by == SortBy.VOTES_HIGH:
        # Sort by net votes (upvotes - downvotes) descending
        net_votes = ReviewModel.upvotes - ReviewModel.downvotes
        query = query.order_by(desc(net_votes), desc(ReviewModel.created_at))
    elif sort_by == SortBy.VOTES_LOW:
        # Sort by net votes (upvotes - downvotes) ascending
        net_votes = ReviewModel.upvotes - ReviewModel.downvotes
        query = query.order_by(asc(net_votes), desc(ReviewModel.created_at))
    elif sort_by == SortBy.RATING_HIGH:
        query = query.order_by(desc(ReviewModel.rating), desc(ReviewModel.created_at))
    elif sort_by == SortBy.RATING_LOW:
        query = query.order_by(asc(ReviewModel.rating), desc(ReviewModel.created_at))
    elif sort_by == SortBy.CONTROVERSIAL:
        # Sort by total votes (upvotes + downvotes) descending - most controversial first
        total_votes = ReviewModel.upvotes + ReviewModel.downvotes
        query = query.order_by(desc(total_votes), desc(ReviewModel.created_at))
    else:
        # Default to newest first
        query = query.order_by(desc(ReviewModel.created_at))

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    reviews = result.unique().scalars().all()

    # Transform the data to include course_instructors list
    for review in reviews:
        review.course_instructors = [cir.course_instructor for cir in review.course_instructor_reviews]

    return reviews


@router.get("/{review_id}", response_model=ReviewWithRelations)
async def read_review(
    review_id: UUID,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get a specific review by id.
    """
    stmt = (
        select(ReviewModel)
        .options(
            joinedload(ReviewModel.user),
            joinedload(ReviewModel.course),
            joinedload(ReviewModel.professor),
            joinedload(ReviewModel.course_instructor_reviews).joinedload(
                CourseInstructorReviewModel.course_instructor).joinedload(
                CourseInstructorModel.course),
            joinedload(ReviewModel.course_instructor_reviews).joinedload(
                CourseInstructorReviewModel.course_instructor).joinedload(
                CourseInstructorModel.professor)
        )
        .where(ReviewModel.id == review_id)
    )
    result = await db.execute(stmt)
    review = result.unique().scalar_one_or_none()

    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    # Transform the data to include course_instructors list
    review.course_instructors = [cir.course_instructor for cir in review.course_instructor_reviews]

    return review


@router.post("/", response_model=Review, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_in: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_unmuffled_user)
) -> Any:
    """
    Create a new review.
    """
    # Validate that at least one target is provided
    targets = [review_in.course_id, review_in.professor_id,
               review_in.course_instructor_ids]
    if not any(targets):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one of course_id, professor_id, \
or course_instructor_ids must be provided"
        )

    # Check if targets exist
    if review_in.course_id:
        stmt = select(CourseModel).where(CourseModel.id == review_in.course_id)
        result = await db.execute(stmt)
        course = result.scalar_one_or_none()
        if course is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )

    if review_in.professor_id:
        stmt = select(ProfessorModel).where(
            ProfessorModel.id == review_in.professor_id)
        result = await db.execute(stmt)
        professor = result.scalar_one_or_none()
        if professor is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Professor not found"
            )

    if review_in.course_instructor_ids:
        for course_instructor_id in review_in.course_instructor_ids:
            stmt = select(CourseInstructorModel).where(
                CourseInstructorModel.id == course_instructor_id)
            result = await db.execute(stmt)
            course_instructor = result.scalar_one_or_none()
            if course_instructor is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Course instructor {course_instructor_id} not found"
                )

    # Check if user already reviewed this target
    # For course_instructor reviews, check if user has already reviewed any of the specified course instructors
    filters = [ReviewModel.user_id == current_user.id]
    if review_in.course_id:
        filters.append(ReviewModel.course_id == review_in.course_id)
    if review_in.professor_id:
        filters.append(ReviewModel.professor_id == review_in.professor_id)
    
    if review_in.course_instructor_ids:
        # Check if user has already reviewed any of these course instructors
        for course_instructor_id in review_in.course_instructor_ids:
            stmt = select(ReviewModel).join(CourseInstructorReviewModel).where(
                and_(
                    ReviewModel.user_id == current_user.id,
                    CourseInstructorReviewModel.course_instructor_id == course_instructor_id
                )
            )
            result = await db.execute(stmt)
            existing_review = result.scalar_one_or_none()
            if existing_review:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"You have already reviewed course instructor {course_instructor_id}"
                )
    elif filters:  # Only check for course/professor if no course_instructor_ids
        stmt = select(ReviewModel).where(and_(*filters))
        result = await db.execute(stmt)
        existing_review = result.scalar_one_or_none()
        if existing_review:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already reviewed"
            )

    # Create the review without course_instructor_ids
    review_data = review_in.dict(exclude={"course_instructor_ids"})
    stmt = insert(ReviewModel).values(
        **review_data,
        user_id=current_user.id
    ).returning(*ReviewModel.__table__.c)
    result = await db.execute(stmt)
    review = result.fetchone()
    
    # Create course_instructor_reviews entries if provided
    if review_in.course_instructor_ids:
        for course_instructor_id in review_in.course_instructor_ids:
            stmt = insert(CourseInstructorReviewModel).values(
                review_id=review.id,
                course_instructor_id=course_instructor_id
            )
            await db.execute(stmt)

    # Update target's review stats
    if review_in.course_id:
        await _update_course_stats(db, review_in.course_id)
    if review_in.professor_id:
        await _update_professor_stats(db, review_in.professor_id)
    if review_in.course_instructor_ids:
        for course_instructor_id in review_in.course_instructor_ids:
            await _update_course_instructor_stats(db, course_instructor_id)

    # Check for mentions in the review content and send notifications
    if review_in.content:
        await notify_on_mention(
            db=db,
            content=review_in.content,
            content_id=review.id,
            content_type="review",
            author_username=current_user.username
        )

    # Notify followers about the new review
    await notify_followers_on_review(
        db=db,
        review_id=review.id,
        author_username=current_user.username
    )

    # Award echo points for creating a review (+5 points)
    from app.core.echo_points import update_user_echo_points
    await update_user_echo_points(db, current_user.id, notify=True)

    await db.commit()
    return review


@router.put("/{review_id}", response_model=Review)
async def update_review(
    review_id: UUID,
    review_in: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_unmuffled_user)
) -> Any:
    """
    Update a review.
    """
    # First check if the review exists outside of any transaction
    stmt = select(ReviewModel).where(ReviewModel.id == review_id)
    result = await db.execute(stmt)
    review = result.scalar_one_or_none()

    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    # Check ownership
    if (
        getattr(review, "user_id", None) != current_user.id
        and not bool(current_user.is_admin)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    update_data = review_in.dict(exclude_unset=True)

    # Check if content is being added to a rating-only review
    content_added = (
        "content" in update_data and 
        update_data["content"] is not None and 
        getattr(review, "content", None) is None
    )

    # Mark as edited if content or rating is updated
    if "content" in update_data or "rating" in update_data:
        update_data["is_edited"] = True

    # Get the values we'll need for stats updates
    course_id = getattr(review, "course_id", None)
    professor_id = getattr(review, "professor_id", None)
    rating_changed = "rating" in update_data
    
    # Get course_instructor_ids from related records
    stmt = select(CourseInstructorReviewModel.course_instructor_id).where(
        CourseInstructorReviewModel.review_id == review_id
    )
    result = await db.execute(stmt)
    course_instructor_ids = [row.course_instructor_id for row in result.fetchall()]

    # Perform the update without explicitly starting a new transaction
    stmt = update(ReviewModel).where(
        ReviewModel.id == review_id
    ).values(**update_data).returning(*ReviewModel.__table__.c)
    result = await db.execute(stmt)
    updated_review = result.fetchone()

    # Update target's review stats if rating changed
    if rating_changed:
        if course_id is not None:
            await _update_course_stats(db, course_id)
        if professor_id is not None:
            await _update_professor_stats(db, professor_id)
        for course_instructor_id in course_instructor_ids:
            await _update_course_instructor_stats(db, course_instructor_id)

    # Update echo points if content was added to a rating-only review
    if content_added:
        from app.core.echo_points import update_user_echo_points
        await update_user_echo_points(db, current_user.id, notify=True)

    # Commit the transaction
    await db.commit()
    
    return updated_review


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_unmuffled_user)
) -> None:
    """
    Delete a review.
    """
    # Get the review
    stmt = select(ReviewModel).where(ReviewModel.id == review_id)
    result = await db.execute(stmt)
    review = result.scalar_one_or_none()

    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    # Check ownership
    if (
        getattr(review, "user_id", None) != current_user.id
        and not bool(current_user.is_admin)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # Store IDs for stats updates
    course_id = getattr(review, "course_id", None)
    professor_id = getattr(review, "professor_id", None)
    review_user_id = getattr(review, "user_id", None)
    
    # Get course_instructor_ids from related records
    stmt = select(CourseInstructorReviewModel.course_instructor_id).where(
        CourseInstructorReviewModel.review_id == review_id
    )
    result = await db.execute(stmt)
    course_instructor_ids = [row.course_instructor_id for row in result.fetchall()]

    try:
        # Delete the review
        stmt = delete(ReviewModel).where(ReviewModel.id == review_id)
        await db.execute(stmt)

        # Update target's review stats
        if course_id is not None:
            await _update_course_stats(db, course_id)
        if professor_id is not None:
            await _update_professor_stats(db, professor_id)
        for course_instructor_id in course_instructor_ids:
            await _update_course_instructor_stats(db, course_instructor_id)
        
        # Update echo points for review author (subtract 5 points for deleted review)
        if review_user_id is not None:
            from app.core.echo_points import update_user_echo_points
            await update_user_echo_points(db, review_user_id, notify=True)
        
        # Commit the transaction
        await db.commit()
        
        return None
    
    except Exception as e:
        # Roll back in case of any error
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting review: {str(e)}"
        )


# Helper functions to update review statistics
async def _update_course_stats(db: AsyncSession, course_id: UUID) -> None:
    """Update course review stats."""
    # Get review count
    stmt = select(func.count()).where(ReviewModel.course_id == course_id)
    result = await db.execute(stmt)
    review_count = result.scalar_one()

    # Get average rating
    if review_count > 0:
        stmt = select(func.avg(ReviewModel.rating)).where(
            ReviewModel.course_id == course_id)
        result = await db.execute(stmt)
        avg_rating = result.scalar_one()
    else:
        avg_rating = 0

    # Update course
    stmt = update(CourseModel).where(
        CourseModel.id == course_id
    ).values(
        review_count=review_count,
        average_rating=avg_rating
    )
    await db.execute(stmt)


async def _update_professor_stats(
        db: AsyncSession, professor_id: UUID
) -> None:
    """Update professor review stats."""
    # Get review count
    stmt = select(func.count()).where(ReviewModel.professor_id == professor_id)
    result = await db.execute(stmt)
    review_count = result.scalar_one()

    # Get average rating
    if review_count > 0:
        stmt = select(func.avg(ReviewModel.rating)).where(
            ReviewModel.professor_id == professor_id)
        result = await db.execute(stmt)
        avg_rating = result.scalar_one()
    else:
        avg_rating = 0

    # Update professor
    stmt = update(ProfessorModel).where(
        ProfessorModel.id == professor_id
    ).values(
        review_count=review_count,
        average_rating=avg_rating
    )
    await db.execute(stmt)


async def _update_course_instructor_stats(
        db: AsyncSession, course_instructor_id: UUID
) -> None:
    """Update course instructor review stats."""
    # Get review count through junction table
    stmt = select(func.count()).select_from(
        CourseInstructorReviewModel.join(ReviewModel)
    ).where(
        CourseInstructorReviewModel.course_instructor_id == course_instructor_id
    )
    result = await db.execute(stmt)
    review_count = result.scalar_one()

    # Get average rating through junction table
    if review_count > 0:
        stmt = select(func.avg(ReviewModel.rating)).select_from(
            CourseInstructorReviewModel.join(ReviewModel)
        ).where(
            CourseInstructorReviewModel.course_instructor_id == course_instructor_id
        )
        result = await db.execute(stmt)
        avg_rating = result.scalar_one()
    else:
        avg_rating = 0

    # Update course instructor
    stmt = update(CourseInstructorModel).where(
        CourseInstructorModel.id == course_instructor_id
    ).values(
        review_count=review_count,
        average_rating=avg_rating
    )
    await db.execute(stmt)
