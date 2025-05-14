"""
CAS Authentication Router for Whispr.

This module provides endpoints for user authentication through the
Central Authentication Service (CAS) used by IIIT Hyderabad.
"""
from urllib.parse import urlencode
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
import jwt  # Using PyJWT library
from dotenv import load_dotenv

from config import Config
from services.cas import cas_client

# Load configuration settings
load_dotenv()

AUTH_COOKIE_NAME = "Authorization"
JWT_SECRET_KEY = Config.SECRET_KEY
ALGORITHM = Config.ALGORITHM
SERVICE_URL = Config.SERVICE_URL
FRONTEND_URL = Config.FRONTEND_URL
CAS_SERVER_URL = Config.CAS_URL

auth_router = APIRouter()


@auth_router.get("/login")
async def login(request: Request):
    """
    This function handles CAS login in a two-step process:
    1. First redirect to CAS server for authentication
    2. After successful login at CAS,
        verify the ticket and generate a JWT token

    Args:
        request: The FastAPI request object

    Returns:
        Redirect response with authentication cookie if successful
    """
    # Already logged in
    if request.cookies.get(AUTH_COOKIE_NAME):
        return RedirectResponse(url=FRONTEND_URL)

    next_url = request.query_params.get("next", FRONTEND_URL)
    ticket = request.query_params.get("ticket")

    if not ticket:
        # No ticket, the request comes from end user, send to CAS login
        cas_login_url = cas_client.get_login_url(SERVICE_URL)
        # Add next parameter if available
        if next_url and next_url != FRONTEND_URL:
            cas_login_url += f"?{urlencode({'next': next_url})}"
        response = RedirectResponse(url=cas_login_url)
        # Add CORS headers to the response
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET POST PUT DELETE OPTIONS"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response

    # Verify the ticket using the updated verify_cas_authentication function
    user, attributes, pgtiou = cas_client.verify_ticket(ticket)

    if not user:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/auth/login?error=cas_failed"
        )

    # Create payload for JWT token
    payload = {
        "uid": attributes.get("uid"),
        "email": user,
        "name": attributes.get("Name"),
        "roll_no": attributes.get("RollNo"),
        "first_name": attributes.get("FirstName"),
        "last_name": attributes.get("LastName")
    }

    # Generate JWT token using configuration
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=ALGORITHM)

    # Create the response with the token
    response = RedirectResponse(url=next_url or FRONTEND_URL)
    response.set_cookie(
        AUTH_COOKIE_NAME,
        token,
        httponly=True,
        secure=True,
        max_age=Config.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
    )
    response.set_cookie("login", "true")

    return response


@auth_router.get("/decode_token")
async def decode_token(request: Request):
    """
    Decode the JWT token from cookies.

    Args:
        request: The FastAPI request object

    Returns:
        Decoded token payload

    Raises:
        HTTPException: When token is missing or invalid
    """
    token = request.cookies.get(AUTH_COOKIE_NAME)
    if token is None:
        raise HTTPException(status_code=400, detail="Token not provided")

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Invalid token")
