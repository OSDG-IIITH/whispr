"""
File containing the user routes.
"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/me")
async def get_me():
    """
    Get the current user.
    """
    return {"message": "Get current user"}

@router.get("/leaderboard")
async def get_leaderboard(limit: int = 10, offset: int = 0):
    """
    Get the leaderboard.
    """
    return {"message": f"Get leaderboard with limit {limit} and offset {offset}"}

