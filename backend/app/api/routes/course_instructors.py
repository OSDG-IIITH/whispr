"""
Routes for course instructor-related endpoints.
"""

from typing import List, Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete, and_
from sqlalchemy.orm import joinedload

from app.db.session import get_db
from app.models.course_instructor import CourseInstructor\
    as CourseInstructorModel
from app.models.course import Course as CourseModel
from app.models.professor import Professor as ProfessorModel
from app.schemas.course_instructor import (
    CourseInstructor, CourseInstructorCreate, CourseInstructorUpdate,
    CourseInstructorDetail
)
from app.auth.jwt import get_current_admin_user
from app.models.user import User as UserModel

router = APIRouter()


@router.get("/", response_model=List[CourseInstructor])
async def read_course_instructors(
    skip: int = 0,
    limit: int = 100,
    course_id: Optional[UUID] = None,
    professor_id: Optional[UUID] = None,
    semester: Optional[str] = None,
    year: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Retrieve course instructors with optional filters.
    """
    query = select(CourseInstructorModel)

    if course_id:
        query = query.where(CourseInstructorModel.course_id == course_id)
    if professor_id:
        query = query.where(CourseInstructorModel.professor_id == professor_id)
    if semester:
        query = query.where(CourseInstructorModel.semester == semester)
    if year:
        query = query.where(CourseInstructorModel.year == year)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    course_instructors = result.scalars().all()

    return course_instructors


@router.get("/{course_instructor_id}", response_model=CourseInstructorDetail)
async def read_course_instructor(
    course_instructor_id: UUID,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get a specific course instructor by id.
    """
    stmt = (
        select(CourseInstructorModel)
        .options(joinedload(CourseInstructorModel.professor))
        .options(joinedload(CourseInstructorModel.course))
        .where(CourseInstructorModel.id == course_instructor_id)
    )
    result = await db.execute(stmt)
    course_instructor = result.unique().scalar_one_or_none()

    if course_instructor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course instructor not found"
        )

    return course_instructor


@router.post(
    "/",
    response_model=CourseInstructor,
    status_code=status.HTTP_201_CREATED
)
async def create_course_instructor(
    course_instructor_in: CourseInstructorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """
    Create a new course instructor (admin only).
    """
    # Check if professor exists
    stmt = select(ProfessorModel).where(
        ProfessorModel.id == course_instructor_in.professor_id)
    result = await db.execute(stmt)
    professor = result.scalar_one_or_none()

    if professor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor not found"
        )

    # Check if course exists
    stmt = select(CourseModel).where(
        CourseModel.id == course_instructor_in.course_id)
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    # Check if combination already exists
    stmt = select(CourseInstructorModel).where(
        and_(
            CourseInstructorModel.professor_id
            == course_instructor_in.professor_id,
            CourseInstructorModel.course_id == course_instructor_in.course_id,
            CourseInstructorModel.semester == course_instructor_in.semester,
            CourseInstructorModel.year == course_instructor_in.year
        )
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This professor-course-semester-year \
combination already exists"
        )

    async with db.begin():
        stmt = insert(CourseInstructorModel).values(
            **course_instructor_in.dict()
        ).returning(*CourseInstructorModel.__table__.c)
        result = await db.execute(stmt)
        course_instructor = result.fetchone()

    return course_instructor


@router.put("/{course_instructor_id}", response_model=CourseInstructor)
async def update_course_instructor(
    course_instructor_id: UUID,
    course_instructor_in: CourseInstructorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """
    Update a course instructor (admin only).
    """
    stmt = select(CourseInstructorModel).where(
        CourseInstructorModel.id == course_instructor_id)
    result = await db.execute(stmt)
    course_instructor = result.scalar_one_or_none()

    if course_instructor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course instructor not found"
        )

    update_data = course_instructor_in.dict(exclude_unset=True)

    # If updating semester or year, check for existing combinations
    if "semester" in update_data or "year" in update_data:
        # Get current values
        semester = update_data.get("semester", course_instructor.semester)
        year = update_data.get("year", course_instructor.year)

        # Check if combination already exists
        stmt = select(CourseInstructorModel).where(
            and_(
                CourseInstructorModel.professor_id
                == course_instructor.professor_id,
                CourseInstructorModel.course_id == course_instructor.course_id,
                CourseInstructorModel.semester == semester,
                CourseInstructorModel.year == year,
                CourseInstructorModel.id != course_instructor_id
            )
        )
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This professor-course-semester-year \
combination already exists"
            )

    async with db.begin():
        stmt = update(CourseInstructorModel).where(
            CourseInstructorModel.id == course_instructor_id
        ).values(**update_data).returning(*CourseInstructorModel.__table__.c)
        result = await db.execute(stmt)
        updated_course_instructor = result.fetchone()

    return updated_course_instructor


@router.delete(
    "/{course_instructor_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_course_instructor(
    course_instructor_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> None:
    """
    Delete a course instructor (admin only).
    """
    stmt = select(CourseInstructorModel).where(
        CourseInstructorModel.id == course_instructor_id)
    result = await db.execute(stmt)
    course_instructor = result.scalar_one_or_none()

    if course_instructor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course instructor not found"
        )

    async with db.begin():
        stmt = delete(CourseInstructorModel).where(
            CourseInstructorModel.id == course_instructor_id)
        await db.execute(stmt)
