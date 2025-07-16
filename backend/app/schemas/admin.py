from typing import Optional, List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from app.schemas.user import User
from app.schemas.report import Report

class AdminUserResponse(BaseModel):
    id: UUID
    username: str
    email: Optional[str] = None
    echoes: int = 0
    is_admin: bool = False
    is_muffled: bool = True
    is_banned: bool = False
    ban_reason: Optional[str] = None
    banned_until: Optional[datetime] = None
    banned_by: Optional[str] = None
    banned_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AdminStatsResponse(BaseModel):
    total_users: int
    banned_users: int
    pending_reports: int
    under_review_reports: int

class BanUserRequest(BaseModel):
    reason: str
    duration_days: Optional[int] = None  # None for permanent ban

class AdminActionRequest(BaseModel):
    status: str  # "under_review", "resolved", "dismissed"
    action: str  # "ban_user", "delete_content", "dismiss", "warn_user"
    notes: Optional[str] = None
    ban_duration_days: Optional[int] = None

class AdminReportResponse(BaseModel):
    id: str
    reporter: User
    reported_user: Optional[User]
    review_id: Optional[str]
    reply_id: Optional[str]
    report_type: str
    reason: str
    status: str
    admin_notes: Optional[str]
    reviewed_by: Optional[str]
    reviewed_at: Optional[datetime]
    admin_action: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True