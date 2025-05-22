"""
Routes for professor-related endpoints.
"""

from typing import List, Any, Optional
from uuid import UUID
from pydantic.version import VERSION as PYDANTIC_VERSION

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete

from app.db.session import get_db
from app.models.professor import Professor as ProfessorModel
from app.models.professor_social_media import \
    ProfessorSocialMedia as ProfessorSocialMediaModel
from app.schemas.professor import (
    Professor, ProfessorCreate, ProfessorUpdate, ProfessorWithSocialMedia)
from app.schemas.professor_social_media import (
    ProfessorSocialMedia,
    ProfessorSocialMediaCreate,
    ProfessorSocialMediaUpdate
)
from app.auth.jwt import get_current_admin_user
from app.models.user import User as UserModel

router = APIRouter()


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
    query = select(ProfessorModel)

    if search:
        query = query.where(ProfessorModel.name.ilike(f"%{search}%"))

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    professors = result.scalars().all()

    return professors


@router.get("/{professor_id}", response_model=ProfessorWithSocialMedia)
async def read_professor(
    professor_id: UUID,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get a specific professor by id.
    """
    stmt = select(ProfessorModel).where(ProfessorModel.id == professor_id)
    result = await db.execute(stmt)
    professor = result.scalar_one_or_none()

    if professor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor not found"
        )

    # Load social media
    stmt = select(ProfessorSocialMediaModel).where(
        ProfessorSocialMediaModel.professor_id == professor_id)
    result = await db.execute(stmt)
    social_media = result.scalars().all()

    # Construct response
    if PYDANTIC_VERSION.startswith('2.'):
        professor_data = ProfessorWithSocialMedia.model_validate(professor)
    else:
        professor_data = ProfessorWithSocialMedia.from_orm(professor)
    professor_data.social_media = list(social_media)

    return professor_data


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


@router.put("/{professor_id}", response_model=Professor)
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


@router.delete("/{professor_id}", status_code=status.HTTP_204_NO_CONTENT)
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
    "/social-media",
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
    "/social-media/{social_media_id}", response_model=ProfessorSocialMedia
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
    "/social-media/{social_media_id}", status_code=status.HTTP_204_NO_CONTENT
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
