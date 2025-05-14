"""
Authentication routes for the Whispr API.

This module provides endpoints for user authentication, including login,
registration, password reset, and email verification through CAS.

IMPORTANT: CAS is used ONLY for institutional email verification to unmute
user accounts. Regular login/registration uses username/password and does not
require CAS. Users must verify with CAS once to be able to post content.
"""
from datetime import timedelta
from typing import Dict
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
import jwt  # Using PyJWT library

from routes.base import create_access_token, get_current_user
from config import Config
from services.cas import verify_cas_authentication, cas_client
from models.user import UserCreate, User
from managers.user import UserManager
from managers.verified import VerifiedManager

router = APIRouter(prefix="/auth", tags=["authentication"])

AUTH_COOKIE_NAME = "Authorization"


@router.post("/register", response_model=User)
async def register(user_data: UserCreate):
    """
    Register a new user account.

    Args:
        user_data: User registration data

    Returns:
        Created user document

    Raises:
        HTTPException: If username is taken
    """
    user_manager = UserManager()

    # Check if username already exists
    existing_user = await user_manager.collection.find_one(
        {"username": user_data.username}
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create the user account
    user = await user_manager.create_user(user_data.dict())

    return user


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticate a user and issue JWT token.

    Args:
        form_data: Form containing username and password

    Returns:
        Token data with access_token and token_type

    Raises:
        HTTPException: If authentication fails
    """
    user_manager = UserManager()
    user = await user_manager.verify_password(
        form_data.username, form_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(
        minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    access_token = create_access_token(
        data={"sub": str(user["_id"])},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(user["_id"]),
        "username": user["username"],
        "is_muffled": user.get("muffled", True)
    }


@router.post("/verify-cas")
async def verify_cas(
    ticket: str = Body(...),
    current_user: Dict = Depends(get_current_user)
):
    """
    Verify a CAS authentication ticket and unmute the user if successful.

    This endpoint is purely for verifying if a user is real by checking their
    institutional credentials - it is NOT used for login. After successful
    verification, the user's account is unmuted, allowing them to post content.

    Args:
        ticket: CAS authentication ticket
        current_user: Current authenticated user

    Returns:
        Verification result with updated muffled status

    Raises:
        HTTPException: If CAS verification fails or email already used
    """
    # Verify CAS ticket
    user_data = await verify_cas_authentication(ticket)

    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="CAS authentication failed"
        )

    # Extract email from user data
    cas_email = user_data["email"]

    # Validate email domain against allowed domains in config
    valid_domain = False
    for pattern in Config.ALLOWED_DOMAINS:
        # Remove regex markers for simple domain check
        domain = pattern.replace('r".*@', '').replace('$"', '')
        if cas_email.endswith(domain):
            valid_domain = True
            break

    if not valid_domain:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email domain not allowed for verification"
        )

    # Check if email has already been used
    verified_manager = VerifiedManager()
    already_verified = await verified_manager.is_email_verified(cas_email)

    if already_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email has already been used for verification"
        )

    try:
        # Mark email as verified
        await verified_manager.verify_email(cas_email)

        # Unmute the user
        user_manager = UserManager()
        await user_manager.unmute_user(str(current_user["_id"]))

        return {
            "success": True,
            "email": cas_email,
            "is_muffled": False,  # Should be false now
            "attributes": user_data.get("attributes", {})
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e


@router.get("/cas-verification")
async def cas_verification(request: Request):
    """
    Initiate CAS verification process (not login).

    This endpoint redirects to the CAS server for identity verification only.
    It doesn't log the user in, but helps verify the institutional identity
    to unmute the account.

    Args:
        request: The FastAPI request object

    Returns:
        RedirectResponse to CAS verification page
    """
    # Check if user is already logged in via normal auth
    current_user = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        try:
            payload = jwt.decode(token, Config.SECRET_KEY,
                                 algorithms=[Config.ALGORITHM])
            user_id = payload.get("sub")
            if user_id:
                user_manager = UserManager()
                current_user = await user_manager.get_by_id(user_id)
        except jwt.PyJWTError:
            pass

    if not current_user:
        return RedirectResponse(
            url=f"{Config.FRONTEND_URL}/auth/login?error=login_required"
        )

    next_url = request.query_params.get(
        "next", f"{Config.FRONTEND_URL}/verify-success")
    ticket = request.query_params.get("ticket")

    if not ticket:
        # No ticket, the request comes from end user, send to CAS login
        cas_login_url = cas_client.get_login_url()
        # Add next parameter if available
        if next_url:
            cas_login_url += f"?{urlencode({'next': next_url})}"
        response = RedirectResponse(url=cas_login_url)
        # Add CORS headers
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET POST OPTIONS"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response

    # Verify the ticket
    user_data = await verify_cas_authentication(ticket)

    if not user_data:
        return RedirectResponse(
            url=f"{Config.FRONTEND_URL}/verify?error=cas_failed"
        )

    # Extract user information
    email = user_data["email"]

    # Check if email is from allowed domains
    valid_domain = False
    for pattern in Config.ALLOWED_DOMAINS:
        # Remove regex markers for simple domain check
        domain = pattern.replace('r".*@', '').replace('$"', '')
        if email.endswith(domain):
            valid_domain = True
            break

    if not valid_domain:
        return RedirectResponse(
            url=f"{Config.FRONTEND_URL}/verify?error=domain_not_allowed"
        )

    # Check if email already used
    verified_manager = VerifiedManager()
    already_verified = await verified_manager.is_email_verified(email)

    if already_verified:
        return RedirectResponse(
            url=f"{Config.FRONTEND_URL}/verify?error=email_already_used"
        )

    # Mark email as verified and unmute user
    await verified_manager.verify_email(email)
    user_manager = UserManager()
    await user_manager.unmute_user(str(current_user["_id"]))

    # Redirect to success page
    return RedirectResponse(url=next_url)


@router.get("/verification-status")
async def verification_status(current_user: Dict = Depends(get_current_user)):
    """
    Get the verification status of the current user.

    Args:
        current_user: Current authenticated user

    Returns:
        User verification status information
    """
    return {
        "is_muffled": current_user.get("muffled", True),
        "username": current_user.get("username"),
        "user_id": str(current_user["_id"])
    }
