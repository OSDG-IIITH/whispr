"""
File containing all the authentication routes.
"""
from fastapi import APIRouter

router = APIRouter()

@router.post("/login")
async def login():
    """
    Login route.
    """
    return {"message": "Login route"}

@router.post("/register")
async def register():
    """
    Register route.
    """
    return {"message": "Register route"}

@router.post("/reset-password")
async def reset_password():
    """
    Reset password route.
    """
    return {"message": "Reset password route"}

