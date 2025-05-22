"""
Authentication routes for user login, registration, and verification.
"""

from datetime import timedelta, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert

from app.db.session import get_db
from app.core.config import settings
from app.auth.jwt import authenticate_user, create_access_token, \
    get_current_user
from app.auth.cookie import set_auth_cookie, clear_auth_cookie
from app.auth.password import get_password_hash
from app.schemas.token import Token
from app.schemas.user import UserCreate, User
from app.models.user import User as UserModel

router = APIRouter()


@router.post("/login", response_model=Token)
async def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    Uses username for authentication.
    """
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(seconds=settings.JWT_EXPIRATION)
    access_token = create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )

    # Set auth cookie
    set_auth_cookie(response, access_token)

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(response: Response) -> Any:
    """
    Logout the current user.
    """
    clear_auth_cookie(response)
    return {"message": "Successfully logged out"}


@router.post(
    "/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Register a new user.
    """
    # Check if user with this username already exists
    stmt = select(UserModel).where(UserModel.username == user_in.username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    # Create the user
    hashed_password = get_password_hash(user_in.password)
    stmt_user = insert(UserModel).values(
        username=user_in.username,
        hashed_password=hashed_password,
        avatar_url=user_in.avatar_url,
        bio=user_in.bio,
        student_since_year=user_in.student_since_year,
        is_muffled=True,  # Default to muffled until email verification
        is_admin=False,
        echoes=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    ).returning(UserModel)  # Use returning to get the created user model

    result = await db.execute(stmt_user)
    created_user = result.scalar_one()

    await db.commit()

    return created_user


# @router.post("/verify-email")
# async def verify_email(
#     email: str,
#     db: AsyncSession = Depends(get_db),
#     current_user: UserModel = Depends(get_current_user),
# ) -> Any:
#     """
#     Verify an email address.
#     """
#     # Check if email exists in used_emails
#     stmt = select(UsedEmailModel).where(UsedEmailModel.email == email)
#     result = await db.execute(stmt)
#     email_record = result.scalar_one_or_none()

#     if not email_record:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Email not found",
#         )

#     # Update email verification status
#     async with db.begin():
#         stmt = update(UsedEmailModel).where(
#             UsedEmailModel.email == email
#         ).values(
#             verified_at=datetime.utcnow()
#         )
#         await db.execute(stmt)

#     return {"message": "Email verified successfully"}


@router.get("/me", response_model=User)
async def get_current_user_info(
    current_user: UserModel = Depends(get_current_user),
) -> Any:
    """
    Get current user information.
    """
    return current_user
