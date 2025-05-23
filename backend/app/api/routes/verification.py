"""
Anonymous CAS verification routes.
Implements privacy-first verification flow.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, delete, update

from app.db.session import get_db
from app.core.config import settings
from app.core.cas import cas_client
from app.core.security import generate_session_token, hash_email
from app.auth.jwt import get_current_user
from app.models.user import User
from app.models.used_email import UsedEmail
from app.models.verification_session import VerificationSession

router = APIRouter()


@router.post("/initiate")
async def initiate_verification(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Initiate CAS verification for current user.

    Creates a temporary verification session and returns CAS login URL.
    """
    # Check if user is already verified
    if getattr(current_user, "is_muffled", False) is not True:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already verified",
        )

    # Clean up any existing verification sessions for this user
    await db.execute(
        delete(VerificationSession).where(
            VerificationSession.user_id == current_user.id
        )
    )

    # Create new verification session
    session_token = generate_session_token()

    stmt = insert(VerificationSession).values(
        user_id=current_user.id,
        session_token=session_token,
    )

    await db.execute(stmt)
    await db.commit()

    # Generate CAS login URL
    cas_url = cas_client.get_login_url(session_token)

    return {
        "cas_url": cas_url,
        "session_token": session_token,
        "expires_in_minutes": settings.VERIFICATION_SESSION_EXPIRE_MINUTES,
    }


@router.get("/callback")
async def cas_callback(
    ticket: str = Query(..., description="CAS ticket"),
    state: str = Query(..., description="Session token"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Handle CAS callback with anonymous verification.

    This endpoint:
    1. Validates the CAS ticket to get email
    2. Hashes the email
    3. Checks if email hash has been used before
    4. If not used, verifies the user and marks email as used
    5. Redirects to frontend with result
    """
    try:
        # Find verification session
        stmt = select(VerificationSession).where(
            VerificationSession.session_token == state
        )
        result = await db.execute(stmt)
        session = result.scalar_one_or_none()

        if not session:
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/verify?error=invalid_session"
            )

        # Check if session expired
        if session.is_expired:
            await db.execute(
                delete(VerificationSession).where(
                    VerificationSession.id == session.id
                )
            )
            await db.commit()

            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/verify?error=session_expired"
            )

        # Validate CAS ticket
        email = await cas_client.validate_ticket(ticket, state)
        if not email:
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}\
/verify?error=cas_validation_failed"
            )

        # Hash email for anonymous storage
        email_hash = hash_email(email)

        # Check if email hash already used
        stmt = select(UsedEmail).where(UsedEmail.email_hash == email_hash)
        result = await db.execute(stmt)
        existing_email = result.scalar_one_or_none()

        if existing_email:
            # Clean up session
            await db.execute(
                delete(VerificationSession).where(
                    VerificationSession.id == session.id
                )
            )
            await db.commit()

            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/verify?error=email_already_used"
            )

        # Start transaction for verification
        async with db.begin():
            # Add email hash to used emails
            await db.execute(insert(UsedEmail).values(email_hash=email_hash))

            # Update user verification status
            await db.execute(
                update(User)
                .where(User.id == session.user_id)
                .values(is_verified=True, is_muffled=False)
            )

            # Delete verification session
            await db.execute(
                delete(VerificationSession).where(
                    VerificationSession.id == session.id
                )
            )

        return RedirectResponse(url=f"{settings.FRONTEND_URL}\
/verify?success=true")

    except Exception as e:
        print(f"Verification error: {e}")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/verify?error=internal_error"
        )


@router.get("/status")
async def get_verification_status(
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get current user's verification status.
    """
    return {
        "is_verified": current_user.is_verified,
        "is_muffled": current_user.is_muffled,
        "username": current_user.username,
        "echoes": current_user.echoes,
    }
