"""
User-related routes for fetching and manipulating user data.
"""

from typing import List, Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, insert, and_, delete, func, desc, asc

from app.db.session import get_db
from app.models.user import User as UserModel
from app.schemas.user import User, UserUpdate
from app.auth.jwt import get_current_user, get_current_unmuffled_user
from app.auth.password import get_password_hash
from app.core.notifications import notify_on_follow

router = APIRouter()


@router.get("/leaderboard/", response_model=List[User])
async def get_leaderboard(
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get top users by echo points (leaderboard).
    """
    stmt = (
        select(UserModel)
        .order_by(desc(UserModel.echoes))
        .limit(limit)
    )
    result = await db.execute(stmt)
    users = result.scalars().all()
    return users


@router.get("/browse/", response_model=List[User])
async def browse_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, description="Search by username or bio"),
    sort_by: Optional[str] = Query("echoes", description="Sort by: echoes, username, created_at"),
    order: Optional[str] = Query("desc", description="Sort order: desc, asc"),
    min_echoes: Optional[int] = Query(None, ge=0, description="Minimum echo points"),
    is_verified: Optional[bool] = Query(None, description="Filter by verification status"),
    exclude_leaderboard: Optional[bool] = Query(False, description="Exclude top users from leaderboard"),
    leaderboard_limit: Optional[int] = Query(10, ge=1, le=100, description="Number of top users to exclude if exclude_leaderboard=True"),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Browse all users with filtering, sorting, and search capabilities.
    """
    # Start with base query
    query = select(UserModel)
    
    # Apply search filter
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.where(
            UserModel.username.ilike(search_term) | 
            UserModel.bio.ilike(search_term)
        )
    
    # Apply filters
    if min_echoes is not None:
        query = query.where(UserModel.echoes >= min_echoes)
    
    if is_verified is not None:
        query = query.where(UserModel.is_muffled == (not is_verified) and UserModel.is_banned.is_(False))
    
    # Exclude leaderboard users if requested
    if exclude_leaderboard:
        # Get the IDs of top users to exclude
        leaderboard_query = (
            select(UserModel.id)
            .order_by(desc(UserModel.echoes))
            .limit(leaderboard_limit)
        )
        leaderboard_result = await db.execute(leaderboard_query)
        leaderboard_ids = [row[0] for row in leaderboard_result.fetchall()]
        
        if leaderboard_ids:
            query = query.where(~UserModel.id.in_(leaderboard_ids))
    
    # Apply sorting
    if sort_by == "username":
        order_by = UserModel.username
    elif sort_by == "created_at":
        order_by = UserModel.created_at
    else:  # default to echoes
        order_by = UserModel.echoes
    
    if order == "asc":
        query = query.order_by(asc(order_by))
    else:  # default to desc
        query = query.order_by(desc(order_by))
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    users = result.scalars().all()
    return users


@router.get("/stats/", response_model=dict)
async def get_user_stats(
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get user statistics for the profiles page.
    """
    # Total users
    total_users_stmt = select(func.count(UserModel.id))
    total_users_result = await db.execute(total_users_stmt)
    total_users = total_users_result.scalar() or 0
    
    # Verified users
    verified_users_stmt = select(func.count(UserModel.id)).where(
        UserModel.is_muffled == False
    )
    verified_users_result = await db.execute(verified_users_stmt)
    verified_users = verified_users_result.scalar() or 0
    
    # Total echo points
    total_echoes_stmt = select(func.sum(UserModel.echoes))
    total_echoes_result = await db.execute(total_echoes_stmt)
    total_echoes = total_echoes_result.scalar() or 0
    
    # Average echo points
    avg_echoes_stmt = select(func.avg(UserModel.echoes))
    avg_echoes_result = await db.execute(avg_echoes_stmt)
    avg_echoes = avg_echoes_result.scalar() or 0
    
    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "total_echoes": int(total_echoes),
        "average_echoes": float(avg_echoes)
    }


@router.get("/", response_model=List[User])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Retrieve users.
    """
    stmt = select(UserModel).offset(skip).limit(limit)
    result = await db.execute(stmt)
    users = result.scalars().all()
    return users


@router.get("/search/", response_model=List[User])
async def search_users(
    q: str = "",
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Search users by username for mentions.
    """
    try:
        # Return empty if query is too short
        if not q or len(q.strip()) < 1:
            return []
        
        query_clean = q.strip()
        
        # Search for users whose username starts with the query (case insensitive)
        stmt = select(UserModel).where(
            UserModel.username.ilike(f"{query_clean}%")
        ).limit(min(limit, 20))  # Cap at 20 results
        result = await db.execute(stmt)
        users = result.scalars().all()
        return users
        
    except Exception as e:
        # Log the error but return empty list to not break the UI
        print(f"Error in user search: {e}")
        return []


@router.get("/{user_id}/", response_model=User)
async def read_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get a specific user by id.
    """
    stmt = select(UserModel).where(UserModel.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.get("/by-username/{username}/", response_model=User)
async def read_user_by_username(
    username: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get a specific user by username.
    """
    stmt = select(UserModel).where(UserModel.username == username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user



@router.put("/me/", response_model=User)
async def update_user_me(
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Update own user.
    """
    update_data = user_update.dict(exclude_unset=True)

    if "password" in update_data:
        hashed_password = get_password_hash(update_data["password"])
        update_data["hashed_password"] = hashed_password
        del update_data["password"]

    # If username is being changed, delete all notifications that reference the old username
    # to prevent foreign key constraint violations
    if "username" in update_data:
        from app.models.notification import Notification as NotificationModel
        
        # Delete notifications where this user is the recipient
        delete_recipient_notifications = delete(NotificationModel).where(
            NotificationModel.username == current_user.username
        )
        await db.execute(delete_recipient_notifications)
        
        # Delete notifications where this user is the actor
        delete_actor_notifications = delete(NotificationModel).where(
            NotificationModel.actor_username == current_user.username
        )
        await db.execute(delete_actor_notifications)

    stmt = update(UserModel).where(
        UserModel.id == current_user.id
    ).values(**update_data).returning(*UserModel.__table__.c)
    result = await db.execute(stmt)
    updated_user = result.fetchone()
    await db.commit()

    return updated_user


@router.post("/{user_id}/follow/", response_model=User)
async def follow_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_unmuffled_user)
) -> Any:
    """
    Follow a user.
    """
    if getattr(current_user, "id", None) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself"
        )

    # Get the user to follow
    stmt = select(UserModel).where(UserModel.id == user_id)
    result = await db.execute(stmt)
    user_to_follow = result.scalar_one_or_none()

    if user_to_follow is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if already following using direct query
    from app.models.user_followers import user_followers
    check_stmt = select(user_followers).where(
        and_(
            user_followers.c.follower_id == current_user.id,
            user_followers.c.followed_id == user_id
        )
    )
    check_result = await db.execute(check_stmt)
    existing_follow = check_result.first()

    if existing_follow is None:
        # Add the relationship using direct insert
        insert_stmt = insert(user_followers).values(
            follower_id=current_user.id,
            followed_id=user_id
        )
        await db.execute(insert_stmt)
        await db.commit()
        
        # Create notification
        await notify_on_follow(db, user_id, current_user.username)
        await db.commit()

    return current_user


@router.post("/{user_id}/unfollow/", response_model=User)
async def unfollow_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Unfollow a user.
    """
    # Get the user to unfollow
    stmt = select(UserModel).where(UserModel.id == user_id)
    result = await db.execute(stmt)
    user_to_unfollow = result.scalar_one_or_none()

    if user_to_unfollow is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Remove the relationship using direct delete
    from app.models.user_followers import user_followers
    delete_stmt = delete(user_followers).where(
        and_(
            user_followers.c.follower_id == current_user.id,
            user_followers.c.followed_id == user_id
        )
    )
    await db.execute(delete_stmt)
    await db.commit()

    return current_user


@router.get("/{user_id}/followers/", response_model=List[User])
async def get_user_followers(
    user_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get followers of a user.
    """
    stmt = select(UserModel).where(UserModel.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get followers with pagination using direct query
    from app.models.user_followers import user_followers
    followers_stmt = (
        select(UserModel)
        .join(user_followers, UserModel.id == user_followers.c.follower_id)
        .where(user_followers.c.followed_id == user_id)
        .offset(skip)
        .limit(limit)
    )
    followers_result = await db.execute(followers_stmt)
    followers = followers_result.scalars().all()
    return followers


@router.get("/{user_id}/following/", response_model=List[User])
async def get_user_following(
    user_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get users that a user is following.
    """
    stmt = select(UserModel).where(UserModel.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get following with pagination using direct query
    from app.models.user_followers import user_followers
    following_stmt = (
        select(UserModel)
        .join(user_followers, UserModel.id == user_followers.c.followed_id)
        .where(user_followers.c.follower_id == user_id)
        .offset(skip)
        .limit(limit)
    )
    following_result = await db.execute(following_stmt)
    following = following_result.scalars().all()
    return following


@router.get("/{user_id}/follow-status/", response_model=dict)
async def get_follow_status(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Get follow status between current user and target user.
    """
    # Get the target user
    stmt = select(UserModel).where(UserModel.id == user_id)
    result = await db.execute(stmt)
    target_user = result.scalar_one_or_none()

    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check follow status using direct queries
    from app.models.user_followers import user_followers
    
    # Check if current user is following target user
    is_following_stmt = select(user_followers).where(
        and_(
            user_followers.c.follower_id == current_user.id,
            user_followers.c.followed_id == user_id
        )
    )
    is_following_result = await db.execute(is_following_stmt)
    is_following = is_following_result.first() is not None

    # Check if target user is following current user
    is_followed_by_stmt = select(user_followers).where(
        and_(
            user_followers.c.follower_id == user_id,
            user_followers.c.followed_id == current_user.id
        )
    )
    is_followed_by_result = await db.execute(is_followed_by_stmt)
    is_followed_by = is_followed_by_result.first() is not None

    # Count followers and following using direct queries
    from sqlalchemy import func
    
    followers_count_stmt = select(func.count(user_followers.c.follower_id)).where(
        user_followers.c.followed_id == user_id
    )
    followers_count_result = await db.execute(followers_count_stmt)
    followers_count = followers_count_result.scalar() or 0

    following_count_stmt = select(func.count(user_followers.c.followed_id)).where(
        user_followers.c.follower_id == user_id
    )
    following_count_result = await db.execute(following_count_stmt)
    following_count = following_count_result.scalar() or 0

    return {
        "user_id": str(user_id),
        "is_following": is_following,
        "is_followed_by": is_followed_by,
        "followers_count": followers_count,
        "following_count": following_count
    }
