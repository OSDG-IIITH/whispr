"""
Routes for course-related endpoints.
"""

from typing import List, Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete

from app.db.session import get_db
from app.models.course import Course as CourseModel
from app.schemas.course import Course, CourseCreate, CourseUpdate
from app.auth.jwt import get_current_admin_user
from app.models.user import User as UserModel

router = APIRouter()


@router.get("/", response_model=List[Course])
async def read_courses(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Retrieve courses with optional search.
    """
    query = select(CourseModel)

    if search:
        query = query.where(
            (CourseModel.name.ilike(f"%{search}%")) |
            (CourseModel.code.ilike(f"%{search}%"))
        )

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    courses = result.scalars().all()

    return courses


@router.get("/{course_id}", response_model=Course)
async def read_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get a specific course by id.
    """
    stmt = select(CourseModel).where(CourseModel.id == course_id)
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    return course


@router.get("/by-code/{code}", response_model=Course)
async def read_course_by_code(
    code: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get a specific course by code.
    """
    stmt = select(CourseModel).where(CourseModel.code == code)
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    return course


@router.post("/", response_model=Course, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_in: CourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """
    Create a new course (admin only).
    """
    # Check if course with this code already exists
    stmt = select(CourseModel).where(CourseModel.code == course_in.code)
    result = await db.execute(stmt)
    existing_course = result.scalar_one_or_none()

    if existing_course:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course with this code already exists"
        )

    async with db.begin():
        stmt = insert(CourseModel).values(
            **course_in.dict()
        ).returning(*CourseModel.__table__.c)
        result = await db.execute(stmt)
        course = result.fetchone()

    return course


@router.put("/{course_id}", response_model=Course)
async def update_course(
    course_id: UUID,
    course_in: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """
    Update a course (admin only).
    """
    stmt = select(CourseModel).where(CourseModel.id == course_id)
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    update_data = course_in.dict(exclude_unset=True)

    async with db.begin():
        stmt = update(CourseModel).where(
            CourseModel.id == course_id
        ).values(**update_data).returning(*CourseModel.__table__.c)
        result = await db.execute(stmt)
        updated_course = result.fetchone()

    return updated_course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> None:
    """
    Delete a course (admin only).
    """
    stmt = select(CourseModel).where(CourseModel.id == course_id)
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    async with db.begin():
        stmt = delete(CourseModel).where(CourseModel.id == course_id)
        await db.execute(stmt)
