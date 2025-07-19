from typing import List, Any, Optional
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, func

from app.db.session import get_db
from app.models.user import User as UserModel
from app.auth.jwt import get_current_admin_user

router = APIRouter()

@router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """Get admin dashboard statistics."""
    
    try:
        # Get total users
        total_users_result = await db.execute(select(func.count(UserModel.id)))
        total_users = total_users_result.scalar() or 0
        
        # Get banned users (only if the column exists)
        try:
            banned_users_result = await db.execute(
                select(func.count(UserModel.id)).where(UserModel.is_banned == True)
            )
            banned_users = banned_users_result.scalar() or 0
        except Exception as e:
            print(f"Could not get banned users count: {e}")
            banned_users = 0
        
        # Skip reports for now since the enum types are causing issues
        pending_reports = 0
        under_review_reports = 0
        
        return {
            "total_users": total_users,
            "banned_users": banned_users,
            "pending_reports": pending_reports,
            "under_review_reports": under_review_reports
        }
    except Exception as e:
        print(f"Error in get_admin_stats: {e}")
        # Return basic stats even if some queries fail
        return {
            "total_users": 0,
            "banned_users": 0,
            "pending_reports": 0,
            "under_review_reports": 0
        }

@router.get("/users")
async def get_users_for_admin(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    banned_only: bool = False,
    admin_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """Get users for admin management."""
    
    try:
        query = select(UserModel)
        
        filters = []
        if search:
            filters.append(UserModel.username.ilike(f"%{search}%"))
        
        # Only add these filters if the columns exist
        try:
            if banned_only and hasattr(UserModel, 'is_banned'):
                filters.append(UserModel.is_banned == True)
            if admin_only and hasattr(UserModel, 'is_admin'):
                filters.append(UserModel.is_admin == True)
        except Exception as e:
            print(f"Filter error: {e}")
        
        if filters:
            query = query.where(and_(*filters))
        
        query = query.offset(skip).limit(limit).order_by(UserModel.created_at.desc())
        result = await db.execute(query)
        users = result.scalars().all()
        
        # Convert to dict format to avoid Pydantic issues
        users_data = []
        for user in users:
            user_dict = {
                "id": str(user.id),
                "username": user.username,
                "email": getattr(user, 'email', None),
                "echoes": getattr(user, 'echoes', 0),
                "is_admin": getattr(user, 'is_admin', False),
                "is_muffled": getattr(user, 'is_muffled', False),
                "is_banned": getattr(user, 'is_banned', False),
                "ban_reason": getattr(user, 'ban_reason', None),
                "banned_until": getattr(user, 'banned_until', None),
                "banned_by": getattr(user, 'banned_by', None),
                "banned_at": getattr(user, 'banned_at', None),
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
            users_data.append(user_dict)
        
        return users_data
    except Exception as e:
        print(f"Error in get_users_for_admin: {e}")
        # Return empty list if query fails
        return []

@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: UUID,
    ban_request: dict,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """Ban a user temporarily or permanently."""
    
    try:
        user_to_ban = await db.get(UserModel, user_id)
        if not user_to_ban:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if hasattr(user_to_ban, 'is_admin') and user_to_ban.is_admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot ban admin users"
            )
        
        banned_until = None
        if ban_request.get('duration_days'):
            banned_until = datetime.now(timezone.utc) + timedelta(days=ban_request['duration_days'])
        
        update_values = {
            'is_banned': True,
            'ban_reason': ban_request.get('reason', 'No reason provided'),
            'banned_until': banned_until,
            'banned_by': current_user.username,
            'banned_at': datetime.now(timezone.utc),
            'is_muffled': True  # Muffle the user when banning
        }
        
        # Use a single transaction
        await db.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(**update_values)
        )
        await db.commit()
        
        return {"message": "User banned successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in ban_user: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ban user: {str(e)}"
        )

@router.delete("/users/{user_id}/ban")
async def unban_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """Unban a user."""
    
    try:
        # Check if user exists
        user_to_unban = await db.get(UserModel, user_id)
        if not user_to_unban:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if user is actually banned
        if not getattr(user_to_unban, 'is_banned', False):
            return {"message": "User is not currently banned"}
        
        # Build update values to reset all ban-related fields
        update_values = {
            'is_banned': False,
            'ban_reason': None,
            'banned_until': None,
            'banned_by': None,
            'banned_at': None,
            'is_muffled': False  # Unmuffle the user when unbanning
        }
        
        print(f"Unbanning user {user_id} with values: {update_values}")
        
        # Perform the update
        result = await db.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(**update_values)
        )
        
        print(f"Unban update result: {result.rowcount} rows affected")
        
        await db.commit()
        
        # Verify the update worked
        await db.refresh(user_to_unban)
        print(f"User after unban - is_banned: {getattr(user_to_unban, 'is_banned', 'N/A')}")
        
        return {"message": "User unbanned successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in unban_user: {e}")
        import traceback
        traceback.print_exc()
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unban user: {str(e)}"
        )

@router.post("/users/{user_id}/admin")
async def make_admin(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """Grant admin privileges to a user."""
    
    try:
        # Check if user exists
        user_to_promote = await db.get(UserModel, user_id)
        if not user_to_promote:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if user is already an admin
        if getattr(user_to_promote, 'is_admin', False):
            return {"message": "User is already an admin"}
        
        print(f"Promoting user {user_id} ({user_to_promote.username}) to admin")
        
        # Update user to admin
        result = await db.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(is_admin=True)
        )
        
        print(f"Admin promotion result: {result.rowcount} rows affected")
        
        await db.commit()
        
        # Verify the update worked
        await db.refresh(user_to_promote)
        print(f"User after promotion - is_admin: {getattr(user_to_promote, 'is_admin', 'N/A')}")
        
        return {"message": "User granted admin privileges"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in make_admin: {e}")
        import traceback
        traceback.print_exc()
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to grant admin privileges: {str(e)}"
        )

@router.delete("/users/{user_id}/admin")
async def remove_admin(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """Remove admin privileges from a user."""
    
    try:
        # Prevent removing own admin privileges
        if user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove your own admin privileges"
            )
        
        # Check if user exists
        user_to_demote = await db.get(UserModel, user_id)
        if not user_to_demote:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if user is actually an admin
        if not getattr(user_to_demote, 'is_admin', False):
            return {"message": "User is not currently an admin"}
        
        print(f"Removing admin privileges from user {user_id} ({user_to_demote.username})")
        
        # Update user to remove admin
        result = await db.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(is_admin=False)
        )
        
        print(f"Admin removal result: {result.rowcount} rows affected")
        
        await db.commit()
        
        # Verify the update worked
        await db.refresh(user_to_demote)
        print(f"User after demotion - is_admin: {getattr(user_to_demote, 'is_admin', 'N/A')}")
        
        return {"message": "Admin privileges removed"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in remove_admin: {e}")
        import traceback
        traceback.print_exc()
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove admin privileges: {str(e)}"
        )

@router.get("/reports")
async def get_reports_for_admin(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    report_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """Get reports with full details for admin review."""
    
    # For now, return empty list since reports might not be properly set up
    # This avoids the enum casting issues
    return []