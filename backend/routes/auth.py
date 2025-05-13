"""
File containing all the authentication routes.
"""
from fastapi import APIRouter
from services.cas import validate_cas_ticket
from config import Config

router = APIRouter()

@router.post("/login")
async def login(username: str, password: str):
    """
    Login route.
    """

@router.post("/register")
async def register(ticket: str):
    """
    Register route.
    """
    service = Config.SERVICE_URL
    response = validate_cas_ticket(ticket, service)

    if response["success"]:
        user = response["user"]
        # user validation logic
        return {"message": "User registered successfully", "user": user}
    return {"success": False, "message": "Invalid ticket"}
