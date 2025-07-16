"""
Routes for professor-related endpoints.
"""

from typing import List, Any, Optional
from uuid import UUID
from pydantic.version import VERSION as PYDANTIC_VERSION

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete
from sqlalchemy.orm import joinedload

from app.db.session import get_db
from app.models.professor import Professor as ProfessorModel
from app.models.professor_social_media import \
    ProfessorSocialMedia as ProfessorSocialMediaModel
from app.models.course_instructor import CourseInstructor as CourseInstructorModel
from app.schemas.professor import (
    Professor, ProfessorCreate, ProfessorUpdate, ProfessorWithSocialMedia)
from app.schemas.professor_social_media import (
    ProfessorSocialMedia,
    ProfessorSocialMediaCreate,
    ProfessorSocialMediaUpdate
)
from app.auth.jwt import get_current_admin_user
from app.models.user import User as UserModel
from app.schemas.course import CourseBase

router = APIRouter()


def convert_professor_to_with_social_media(professor: ProfessorModel) -> ProfessorWithSocialMedia:
    """
    Convert a professor model to ProfessorWithSocialMedia schema.
    """
    # Build course instructors list
    course_instructors = []
    for instructor in professor.course_instructors:
        if instructor.course:
            course_base = CourseBase(
                code=instructor.course.code,
                name=instructor.course.name,
                credits=instructor.course.credits,
                description=instructor.course.description,
                official_document_url=instructor.course.official_document_url,
                review_summary=instructor.course.review_summary
            )
            instructor_data = {
                'id': instructor.id,
                'professor_id': instructor.professor_id,
                'course_id': instructor.course_id,
                'semester': instructor.semester,
                'year': instructor.year,
                'summary': instructor.summary,
                'review_count': instructor.review_count,
                'average_rating': instructor.average_rating,
                'created_at': instructor.created_at,
                'course': course_base
            }
            course_instructors.append(instructor_data)

    # Build social media list
    social_media = []
    for sm in professor.social_media:
        social_media.append({
            'id': sm.id,
            'professor_id': sm.professor_id,
            'platform': sm.platform,
            'url': sm.url,
            'created_at': sm.created_at,
            'updated_at': sm.updated_at
        })

    return ProfessorWithSocialMedia(
        id=professor.id,
        name=professor.name,
        lab=professor.lab,
        review_summary=professor.review_summary,
        review_count=professor.review_count,
        average_rating=professor.average_rating,
        created_at=professor.created_at,
        updated_at=professor.updated_at,
        social_media=social_media,
        course_instructors=course_instructors
    )


@router.get("/", response_model=List[Professor])
async def read_professors(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Retrieve professors with optional search.
    """
    query = (
        select(ProfessorModel)
        .options(joinedload(ProfessorModel.course_instructors).joinedload(CourseInstructorModel.course))
    )

    if search:
        query = query.where(ProfessorModel.name.ilike(f"%{search}%"))

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    professors = result.unique().scalars().all()

    return professors


@router.get("/{professor_id}/", response_model=ProfessorWithSocialMedia)
async def read_professor(
    professor_id: UUID,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get a specific professor by id.
    """
    stmt = (
        select(ProfessorModel)
        .options(joinedload(ProfessorModel.course_instructors).joinedload(CourseInstructorModel.course))
        .options(joinedload(ProfessorModel.social_media))
        .where(ProfessorModel.id == professor_id)
    )
    result = await db.execute(stmt)
    professor = result.unique().scalar_one_or_none()

    if professor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor not found"
        )

    return convert_professor_to_with_social_media(professor)


@router.post(
    "/", response_model=Professor, status_code=status.HTTP_201_CREATED
)
async def create_professor(
    professor_in: ProfessorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """
    Create a new professor (admin only).
    """
    async with db.begin():
        stmt = insert(ProfessorModel).values(
            **professor_in.dict(),
        ).returning(*ProfessorModel.__table__.c)
        result = await db.execute(stmt)
        professor = result.fetchone()

    return professor


@router.put("/{professor_id}/", response_model=Professor)
async def update_professor(
    professor_id: UUID,
    professor_in: ProfessorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """
    Update a professor (admin only).
    """
    stmt = select(ProfessorModel).where(ProfessorModel.id == professor_id)
    result = await db.execute(stmt)
    professor = result.scalar_one_or_none()

    if professor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor not found"
        )

    update_data = professor_in.dict(exclude_unset=True)

    async with db.begin():
        stmt = update(ProfessorModel).where(
            ProfessorModel.id == professor_id
        ).values(**update_data).returning(*ProfessorModel.__table__.c)
        result = await db.execute(stmt)
        updated_professor = result.fetchone()

    return updated_professor


@router.delete("/{professor_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_professor(
    professor_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> None:
    """
    Delete a professor (admin only).
    """
    stmt = select(ProfessorModel).where(ProfessorModel.id == professor_id)
    result = await db.execute(stmt)
    professor = result.scalar_one_or_none()

    if professor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor not found"
        )

    async with db.begin():
        stmt = delete(ProfessorModel).where(ProfessorModel.id == professor_id)
        await db.execute(stmt)


# Social media endpoints
@router.post(
    "/social-media/",
    response_model=ProfessorSocialMedia,
    status_code=status.HTTP_201_CREATED
)
async def create_professor_social_media(
    social_media_in: ProfessorSocialMediaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """
    Add social media to a professor (admin only).
    """
    # Check if professor exists
    stmt = select(ProfessorModel).where(
        ProfessorModel.id == social_media_in.professor_id)
    result = await db.execute(stmt)
    professor = result.scalar_one_or_none()

    if professor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor not found"
        )

    async with db.begin():
        stmt = insert(ProfessorSocialMediaModel).values(
            **social_media_in.dict()
        ).returning(*ProfessorSocialMediaModel.__table__.c)
        result = await db.execute(stmt)
        social_media = result.fetchone()

    return social_media


@router.put(
    "/social-media/{social_media_id}/", response_model=ProfessorSocialMedia
)
async def update_professor_social_media(
    social_media_id: UUID,
    social_media_in: ProfessorSocialMediaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """
    Update a professor's social media (admin only).
    """
    stmt = select(ProfessorSocialMediaModel).where(
        ProfessorSocialMediaModel.id == social_media_id)
    result = await db.execute(stmt)
    social_media = result.scalar_one_or_none()

    if social_media is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social media not found"
        )

    update_data = social_media_in.dict(exclude_unset=True)

    async with db.begin():
        stmt = update(ProfessorSocialMediaModel).where(
            ProfessorSocialMediaModel.id == social_media_id
        ).values(
            **update_data
        ).returning(*ProfessorSocialMediaModel.__table__.c)
        result = await db.execute(stmt)
        updated_social_media = result.fetchone()

    return updated_social_media


@router.delete(
    "/social-media/{social_media_id}/", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_professor_social_media(
    social_media_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> None:
    """
    Delete a professor's social media (admin only).
    """
    stmt = select(ProfessorSocialMediaModel).where(
        ProfessorSocialMediaModel.id == social_media_id)
    result = await db.execute(stmt)
    social_media = result.scalar_one_or_none()

    if social_media is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social media not found"
        )

    async with db.begin():
        stmt = delete(ProfessorSocialMediaModel).where(
            ProfessorSocialMediaModel.id == social_media_id)
        await db.execute(stmt)
