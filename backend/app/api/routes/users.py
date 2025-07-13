"""
User-related routes for fetching and manipulating user data.
"""

from typing import List, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.db.session import get_db
from app.models.user import User as UserModel
from app.schemas.user import User, UserUpdate
from app.auth.jwt import get_current_user, get_current_unmuffled_user
from app.auth.password import get_password_hash
from app.core.notifications import notify_on_follow

router = APIRouter()


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


@router.get("/search", response_model=List[User])
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


@router.get("/{user_id}", response_model=User)
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


@router.get("/by-username/{username}", response_model=User)
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



@router.put("/me", response_model=User)
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

    stmt = update(UserModel).where(
        UserModel.id == current_user.id
    ).values(**update_data).returning(*UserModel.__table__.c)
    result = await db.execute(stmt)
    updated_user = result.fetchone()
    await db.commit()

    return updated_user


@router.post("/{user_id}/follow", response_model=User)
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

    # Add the relationship
    if user_to_follow not in current_user.following:
        current_user.following.append(user_to_follow)
        await db.commit()
        
        # Create notification
        await notify_on_follow(db, user_id, current_user.username)
        await db.commit()

    return current_user


@router.post("/{user_id}/unfollow", response_model=User)
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

    # Remove the relationship
    if user_to_unfollow in current_user.following:
        current_user.following.remove(user_to_unfollow)
        await db.commit()

    return current_user
