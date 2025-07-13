"""
Pydantic schemas for Whispr platform.
"""

from app.schemas.user import User, UserCreate, UserUpdate
from app.schemas.professor import Professor, ProfessorCreate, ProfessorUpdate
from app.schemas.course import Course, CourseCreate, CourseUpdate
from app.schemas.review import Review, ReviewCreate, ReviewUpdate, ReviewWithUser
from app.schemas.reply import Reply, ReplyCreate, ReplyUpdate, ReplyWithUser
from app.schemas.vote import Vote, VoteCreate, VoteUpdate
from app.schemas.notification import Notification, NotificationCreate, NotificationUpdate
from app.schemas.report import Report, ReportCreate, ReportUpdate, ReportWithDetails
