"""
Routes for report-related endpoints.
"""

from typing import List, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete, and_
from sqlalchemy.orm import joinedload

from app.db.session import get_db
from app.models.report import Report as ReportModel
from app.models.review import Review as ReviewModel
from app.models.reply import Reply as ReplyModel
from app.models.user import User as UserModel
from app.schemas.report import Report, ReportCreate, ReportUpdate, ReportWithDetails
from app.auth.jwt import get_current_user, get_current_admin_user

router = APIRouter()


@router.get("/", response_model=List[ReportWithDetails])
async def read_reports(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    report_type: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """
    Retrieve reports (admin only).
    """
    query = select(ReportModel).options(
        joinedload(ReportModel.reporter),
        joinedload(ReportModel.reported_user)
    )

    filters = []
    if status:
        filters.append(ReportModel.status == status)
    if report_type:
        filters.append(ReportModel.report_type == report_type)

    if filters:
        query = query.where(and_(*filters))

    query = query.offset(skip).limit(limit).order_by(ReportModel.created_at.desc())
    result = await db.execute(query)
    reports = result.unique().scalars().all()

    return reports


@router.get("/{report_id}", response_model=ReportWithDetails)
async def read_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """
    Get a specific report by id (admin only).
    """
    stmt = (
        select(ReportModel)
        .options(
            joinedload(ReportModel.reporter),
            joinedload(ReportModel.reported_user)
        )
        .where(ReportModel.id == report_id)
    )
    result = await db.execute(stmt)
    report = result.unique().scalar_one_or_none()

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    return report


@router.post("/", response_model=Report, status_code=status.HTTP_201_CREATED)
async def create_report(
    report_in: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Create a new report.
    """
    # Validate that at least one target is provided
    targets = [report_in.review_id, report_in.reply_id, report_in.reported_user_id]
    if not any(targets):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one of review_id, reply_id, or reported_user_id must be provided"
        )

    # Check if targets exist and get reported user
    reported_user_id = None
    if report_in.review_id:
        stmt = select(ReviewModel).where(ReviewModel.id == report_in.review_id)
        result = await db.execute(stmt)
        review = result.scalar_one_or_none()
        if review is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        reported_user_id = review.user_id

    if report_in.reply_id:
        stmt = select(ReplyModel).where(ReplyModel.id == report_in.reply_id)
        result = await db.execute(stmt)
        reply = result.scalar_one_or_none()
        if reply is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reply not found"
            )
        reported_user_id = reply.user_id

    if report_in.reported_user_id:
        stmt = select(UserModel).where(UserModel.id == report_in.reported_user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        reported_user_id = report_in.reported_user_id

    # Check if user is reporting themselves
    if reported_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot report yourself"
        )

    # Check if user already reported this content
    filters = [ReportModel.reporter_id == current_user.id]
    if report_in.review_id:
        filters.append(ReportModel.review_id == report_in.review_id)
    if report_in.reply_id:
        filters.append(ReportModel.reply_id == report_in.reply_id)
    if report_in.reported_user_id:
        filters.append(ReportModel.reported_user_id == report_in.reported_user_id)

    stmt = select(ReportModel).where(and_(*filters))
    result = await db.execute(stmt)
    existing_report = result.scalar_one_or_none()

    if existing_report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reported this content"
        )

    # Create the report
    async with db.begin():
        stmt = insert(ReportModel).values(
            reporter_id=current_user.id,
            review_id=report_in.review_id,
            reply_id=report_in.reply_id,
            reported_user_id=reported_user_id,
            report_type=report_in.report_type,
            reason=report_in.reason
        ).returning(*ReportModel.__table__.c)
        result = await db.execute(stmt)
        report = result.fetchone()

    return report


@router.put("/{report_id}", response_model=Report)
async def update_report(
    report_id: UUID,
    report_in: ReportUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> Any:
    """
    Update a report (admin only).
    """
    stmt = select(ReportModel).where(ReportModel.id == report_id)
    result = await db.execute(stmt)
    report = result.scalar_one_or_none()

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    update_data = report_in.dict(exclude_unset=True)

    async with db.begin():
        stmt = update(ReportModel).where(
            ReportModel.id == report_id
        ).values(**update_data).returning(*ReportModel.__table__.c)
        result = await db.execute(stmt)
        updated_report = result.fetchone()

    return updated_report


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin_user)
) -> None:
    """
    Delete a report (admin only).
    """
    stmt = select(ReportModel).where(ReportModel.id == report_id)
    result = await db.execute(stmt)
    report = result.scalar_one_or_none()

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    async with db.begin():
        stmt = delete(ReportModel).where(ReportModel.id == report_id)
        await db.execute(stmt)
