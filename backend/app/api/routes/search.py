"""
Routes for search functionality.
"""

from typing import Any, Dict, List, Optional
from uuid import UUID
import re
import math

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func, desc, asc

from app.db.session import get_db
from app.auth.jwt import get_current_unmuffled_user
from app.models.user import User as UserModel
from app.models.course import Course as CourseModel
from app.models.professor import Professor as ProfessorModel
from app.models.review import Review as ReviewModel
from app.models.reply import Reply as ReplyModel
from app.models.course_instructor \
    import CourseInstructor as CourseInstructorModel

from app.schemas.search import (
    SearchParams, SearchResponse,
    CourseSearchResult, ProfessorSearchResult, ReviewSearchResult,
    ReplySearchResult, CourseInstructorSearchResult, EntityType,
    SortField, SortOrder
)

router = APIRouter()


def preprocess_query(query: str) -> str:
    """
    Preprocess the search query to prepare it for search.
    """
    # Trim whitespace and convert to lowercase
    query = query.strip().lower()

    # Remove special characters except spaces and alphanumerics
    query = re.sub(r'[^\w\s]', '', query)

    # Remove multiple spaces
    query = re.sub(r'\s+', ' ', query)

    return query


def calculate_relevance_score(
        query_tokens: List[str], text: str, field_weight: float = 1.0
) -> float:
    """
    Calculate relevance score based on token matches.

    Uses a simple TF-IDF style algorithm:
    - More matched tokens means higher score
    - Exact phrase matches get a bonus
    - Field weights allow prioritizing certain fields
    """
    if not text or not query_tokens:
        return 0.0

    text = text.lower()

    # Token frequency
    score = 0.0
    for token in query_tokens:
        if token in text:
            # Count occurrences of token
            token_count = text.count(token)
            # Add to score
            # (logarithmic scaling to prevent large texts from dominating)
            score += math.log(1 + token_count) * field_weight

    # Exact phrase bonus for multi-word queries
    query = " ".join(query_tokens)
    if len(query_tokens) > 1 and query in text:
        score *= 1.5  # 50% bonus for exact phrase match

    return score


def combine_relevance_scores(scores: Dict[str, float]) -> float:
    """
    Combine relevance scores from multiple fields into a single score.
    """
    # Different field types have different weights
    field_weights = {
        "name": 5.0,       # High priority
        "code": 5.0,       # High priority
        "title": 3.0,      # Medium-high priority
        "description": 2.0,  # Medium priority
        "content": 1.0,     # Standard priority
        "lab": 2.0,         # Medium priority
        "summary": 1.5      # Medium-low priority
    }

    # Sum weighted scores
    total_score = 0.0
    for field, score in scores.items():
        weight = field_weights.get(field, 1.0)
        total_score += score * weight

    return total_score # TODO: normalize this score if needed


@router.post("/", response_model=SearchResponse)
async def search(
    params: SearchParams,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_unmuffled_user)
) -> Any:
    """
    Search across various entities with optional filtering and deep search.
    """
    # Preprocess query
    query = preprocess_query(params.query)
    query_tokens = query.split()

    if not query_tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query cannot be empty"
        )

    # Determine which entity types to search based on params
    entity_types = params.entity_types or [
        EntityType.COURSE,
        EntityType.PROFESSOR,
        EntityType.COURSE_INSTRUCTOR,
        EntityType.REVIEW,
        EntityType.REPLY
    ]

    # Build search results
    results = []
    total_count = 0

    # Search courses
    if EntityType.COURSE in entity_types:
        course_results, course_count = await search_courses(
            db, query_tokens, params
        )
        results.extend(course_results)
        total_count += course_count

    # Search professors
    if EntityType.PROFESSOR in entity_types:
        professor_results, professor_count = await search_professors(
            db, query_tokens, params
        )
        results.extend(professor_results)
        total_count += professor_count

    # Search course instructors
    if EntityType.COURSE_INSTRUCTOR in entity_types:
        course_instructor_results, course_instructor_count = await \
            search_course_instructors(db, query_tokens, params)
        results.extend(course_instructor_results)
        total_count += course_instructor_count

    # Search reviews (only in deep search)
    if params.deep and EntityType.REVIEW in entity_types:
        review_results, review_count = await search_reviews(
            db, query_tokens, params
        )
        results.extend(review_results)
        total_count += review_count

    # Search replies (only in deep search)
    if params.deep and EntityType.REPLY in entity_types:
        reply_results, reply_count = await search_replies(
            db, query_tokens, params
        )
        results.extend(reply_results)
        total_count += reply_count

    # Sort combined results
    results.sort(key=lambda x: x.relevance_score, reverse=True)

    # Apply pagination to final sorted list
    paginated_results = results[params.skip:params.skip + params.limit]

    return SearchResponse(
        total=total_count,
        results=paginated_results,
        query=params.query,
        deep=params.deep
    )


@router.get("/", response_model=SearchResponse)
async def search_get(
    query: str = Query(..., description="The search query string"),
    deep: bool = Query(
        False, description="Whether to perform a deep search in content"),
    entity_types: Optional[List[EntityType]] = Query(
        None, description="Types of entities to include"),
    course_id: Optional[UUID] = Query(None, description="Filter by course ID"),
    professor_id: Optional[UUID] = Query(
        None, description="Filter by professor ID"),
    min_rating: Optional[int] = Query(
        None, ge=1, le=5, description="Minimum rating"),
    max_rating: Optional[int] = Query(
        None, ge=1, le=5, description="Maximum rating"),
    sort_by: Optional[SortField] = Query(
        SortField.RELEVANCE, description="Field to sort by"),
    sort_order: Optional[SortOrder] = Query(
        SortOrder.DESC, description="Sort order"),
    skip: int = Query(0, ge=0, description="Number of results to skip"),
    limit: int = Query(100, ge=1, le=100,
                       description="Maximum number of results to return"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_unmuffled_user)
) -> Any:
    """
    GET endpoint for search functionality (same as POST but with query params).
    """
    # Convert to SearchParams for consistent handling
    params = SearchParams(
        query=query,
        deep=deep,
        entity_types=entity_types,
        course_id=course_id,
        professor_id=professor_id,
        min_rating=min_rating,
        max_rating=max_rating,
        sort_by=sort_by,
        sort_order=sort_order,
        skip=skip,
        limit=limit
    )

    return await search(params, db, current_user)


async def search_courses(
    db: AsyncSession,
    query_tokens: List[str],
    params: SearchParams
) -> tuple[List[CourseSearchResult], int]:
    """
    Search courses based on query.
    """
    like_expressions = []

    # Basic search fields
    for token in query_tokens:
        like_expressions.extend([
            CourseModel.name.ilike(f"%{token}%"),
            CourseModel.code.ilike(f"%{token}%")
        ])

        # Include description in deep search
        if params.deep:
            like_expressions.append(
                CourseModel.description.ilike(f"%{token}%"))

    # Build query
    query = select(CourseModel).where(or_(*like_expressions))

    # Apply sorting
    if params.sort_by == SortField.NAME:
        order_func = asc if params.sort_order == SortOrder.ASC else desc
        query = query.order_by(order_func(CourseModel.name))
    elif params.sort_by == SortField.CODE:
        order_func = asc if params.sort_order == SortOrder.ASC else desc
        query = query.order_by(order_func(CourseModel.code))
    elif params.sort_by == SortField.CREATED_AT:
        order_func = asc if params.sort_order == SortOrder.ASC else desc
        query = query.order_by(order_func(CourseModel.created_at))
    elif params.sort_by == SortField.UPDATED_AT:
        order_func = asc if params.sort_order == SortOrder.ASC else desc
        query = query.order_by(order_func(CourseModel.updated_at))

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total_count = count_result.scalar() or 0

    # Apply pagination if RELEVANCE sorting
    if params.sort_by == SortField.RELEVANCE:
        # For relevance sorting, retrieve all results and sort them by score
        pass
    else:
        query = query.offset(params.skip).limit(params.limit)

    # Execute query
    result = await db.execute(query)
    courses = result.scalars().all()

    # Calculate relevance scores
    results = []
    for course in courses:
        # Calculate scores for each field
        scores = {
            "name": calculate_relevance_score(
                query_tokens, getattr(course, "name", ""), 5.0
            ),
            "code": calculate_relevance_score(
                query_tokens, getattr(course, "code", ""), 5.0)
        }

        if params.deep and getattr(course, "description", None):
            scores["description"] = calculate_relevance_score(
                query_tokens, getattr(course, "description", ""), 2.0
            )

        # Combine scores
        relevance_score = combine_relevance_scores(scores)

        # Add to results
        results.append(CourseSearchResult(
            entity_type=EntityType.COURSE,
            relevance_score=relevance_score,
            data=course
        ))

    # Sort by relevance if requested
    if params.sort_by == SortField.RELEVANCE:
        order_multiplier = 1 if params.sort_order == SortOrder.ASC else -1
        results.sort(key=lambda x: x.relevance_score * order_multiplier)

        # Apply pagination after sorting
        results = results[params.skip:params.skip + params.limit]

    return results, total_count


async def search_professors(
    db: AsyncSession,
    query_tokens: List[str],
    params: SearchParams
) -> tuple[List[ProfessorSearchResult], int]:
    """
    Search professors based on query.
    """
    like_expressions = []

    # Basic search fields
    for token in query_tokens:
        like_expressions.append(ProfessorModel.name.ilike(f"%{token}%"))

        # Include lab and review_summary in deep search
        if params.deep:
            like_expressions.extend([
                ProfessorModel.lab.ilike(f"%{token}%"),
                ProfessorModel.review_summary.ilike(f"%{token}%")
            ])

    # Build query
    query = select(ProfessorModel).where(or_(*like_expressions))

    # Apply sorting
    if params.sort_by == SortField.NAME:
        order_func = asc if params.sort_order == SortOrder.ASC else desc
        query = query.order_by(order_func(ProfessorModel.name))
    elif params.sort_by == SortField.RATING:
        order_func = asc if params.sort_order == SortOrder.ASC else desc
        query = query.order_by(order_func(ProfessorModel.average_rating))
    elif params.sort_by == SortField.CREATED_AT:
        order_func = asc if params.sort_order == SortOrder.ASC else desc
        query = query.order_by(order_func(ProfessorModel.created_at))
    elif params.sort_by == SortField.UPDATED_AT:
        order_func = asc if params.sort_order == SortOrder.ASC else desc
        query = query.order_by(order_func(ProfessorModel.updated_at))

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total_count = count_result.scalar() or 0

    # Apply pagination if not RELEVANCE sorting
    if params.sort_by == SortField.RELEVANCE:
        # For relevance sorting, retrieve all results and sort them by score
        pass
    else:
        query = query.offset(params.skip).limit(params.limit)

    # Execute query
    result = await db.execute(query)
    professors = result.scalars().all()

    # Calculate relevance scores
    results = []
    for professor in professors:
        # Calculate scores for each field
        scores = {
            "name": calculate_relevance_score(query_tokens, getattr(
                professor, "name", ""), 5.0
            )
        }

        if params.deep:
            lab = getattr(professor, "lab", None)
            summary = getattr(professor, "review_summary", None)
            if lab is not None:
                scores["lab"] = calculate_relevance_score(
                    query_tokens, lab, 2.0)
            if summary is not None:
                scores["summary"] = calculate_relevance_score(
                    query_tokens, summary, 1.5)

        # Combine scores
        relevance_score = combine_relevance_scores(scores)

        # Add to results
        results.append(ProfessorSearchResult(
            entity_type=EntityType.PROFESSOR,
            relevance_score=relevance_score,
            data=professor
        ))

    # Sort by relevance if requested
    if params.sort_by == SortField.RELEVANCE:
        order_multiplier = 1 if params.sort_order == SortOrder.ASC else -1
        results.sort(key=lambda x: x.relevance_score * order_multiplier)

        # Apply pagination after sorting
        results = results[params.skip:params.skip + params.limit]

    return results, total_count


async def search_course_instructors(
    db: AsyncSession,
    query_tokens: List[str],
    params: SearchParams
) -> tuple[List[CourseInstructorSearchResult], int]:
    """
    Search course instructors based on query.
    """
    # We need to join with courses and professors to search in their fields
    query = (
        select(
            CourseInstructorModel,
            CourseModel,
            ProfessorModel
        )
        .join(CourseModel, CourseInstructorModel.course_id == CourseModel.id)
        .join(ProfessorModel, CourseInstructorModel.professor_id
              == ProfessorModel.id)
    )

    # Build filter conditions
    filter_conditions = []

    # Apply course_id filter if provided
    if params.course_id:
        filter_conditions.append(
            CourseInstructorModel.course_id == params.course_id)

    # Apply professor_id filter if provided
    if params.professor_id:
        filter_conditions.append(
            CourseInstructorModel.professor_id == params.professor_id)

    # Add search conditions
    search_conditions = []
    for token in query_tokens:
        search_conditions.extend([
            CourseModel.name.ilike(f"%{token}%"),
            CourseModel.code.ilike(f"%{token}%"),
            ProfessorModel.name.ilike(f"%{token}%"),
            CourseInstructorModel.semester.ilike(f"%{token}%")
        ])

        # Include deep search fields
        if params.deep:
            search_conditions.extend([
                CourseModel.description.ilike(f"%{token}%"),
                ProfessorModel.lab.ilike(f"%{token}%"),
                CourseInstructorModel.summary.ilike(f"%{token}%")
            ])

    # Combine search and filter conditions
    if search_conditions:
        filter_conditions.append(or_(*search_conditions))

    if filter_conditions:
        query = query.where(and_(*filter_conditions))

    # Apply sorting (note: sorting is handled differently for joined tables)
    if params.sort_by == SortField.NAME:
        order_func = asc if params.sort_order == SortOrder.ASC else desc
        query = query.order_by(order_func(ProfessorModel.name))
    elif params.sort_by == SortField.CODE:
        order_func = asc if params.sort_order == SortOrder.ASC else desc
        query = query.order_by(order_func(CourseModel.code))
    elif params.sort_by == SortField.CREATED_AT:
        order_func = asc if params.sort_order == SortOrder.ASC else desc
        query = query.order_by(order_func(CourseInstructorModel.created_at))
    elif params.sort_by == SortField.UPDATED_AT:
        order_func = asc if params.sort_order == SortOrder.ASC else desc
        query = query.order_by(order_func(CourseInstructorModel.updated_at))

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total_count = count_result.scalar() or 0

    # Apply pagination if not RELEVANCE sorting
    if params.sort_by == SortField.RELEVANCE:
        # For relevance sorting, retrieve all results and sort them by score
        pass
    else:
        query = query.offset(params.skip).limit(params.limit)

    # Execute query
    result = await db.execute(query)
    rows = result.all()

    # Calculate relevance scores and prepare results
    results = []
    for course_instructor, course, professor in rows:
        # Calculate scores for each field
        scores = {
            "course_name": calculate_relevance_score(
                query_tokens, course.name, 4.0
            ),
            "course_code": calculate_relevance_score(
                query_tokens, course.code, 4.0
            ),
            "professor_name": calculate_relevance_score(
                query_tokens, professor.name, 4.0
            ),
            "semester": calculate_relevance_score(
                query_tokens, course_instructor.semester, 3.0
            )
        }

        if params.deep:
            if course.description:
                scores["course_description"] = calculate_relevance_score(
                    query_tokens, course.description, 1.5
                )
            if professor.lab:
                scores["professor_lab"] = calculate_relevance_score(
                    query_tokens, professor.lab, 1.5
                )
            if course_instructor.summary:
                scores["summary"] = calculate_relevance_score(
                    query_tokens, course_instructor.summary, 2.0
                )

        # Combine scores
        relevance_score = sum(scores.values())

        # Create course instructor with details
        from app.schemas.course_instructor import CourseInstructorDetail
        from app.schemas.course import Course
        from app.schemas.professor import Professor

        # Convert SQLAlchemy models to Pydantic schemas
        course_schema = Course.model_validate(course)
        professor_schema = Professor.model_validate(professor)

        # Create course instructor dict from SQLAlchemy object
        course_instructor_dict = {
            column.name: getattr(course_instructor, column.name)
            for column in course_instructor.__table__.columns
        }
        
        course_instructor_with_details = CourseInstructorDetail(
            **course_instructor_dict,
            course=course_schema,
            professor=professor_schema
        )

        # Add to results
        results.append(CourseInstructorSearchResult(
            entity_type=EntityType.COURSE_INSTRUCTOR,
            relevance_score=relevance_score,
            data=course_instructor_with_details
        ))

    # Sort by relevance if requested
    if params.sort_by == SortField.RELEVANCE:
        order_multiplier = 1 if params.sort_order == SortOrder.ASC else -1
        results.sort(key=lambda x: x.relevance_score * order_multiplier)

        # Apply pagination after sorting
        results = results[params.skip:params.skip + params.limit]

    return results, total_count


async def search_reviews(
    db: AsyncSession,
    query_tokens: List[str],
    params: SearchParams
) -> tuple[List[ReviewSearchResult], int]:
    """
    Search reviews based on query (deep search only).
    """
    # Join with users to get user data
    query = (
        select(
            ReviewModel,
            UserModel
        )
        .join(UserModel, ReviewModel.user_id == UserModel.id)
    )

    # Build filter conditions
    filter_conditions = []

    # Apply course_id filter if provided
    if params.course_id:
        filter_conditions.append(ReviewModel.course_id == params.course_id)

    # Apply professor_id filter if provided
    if params.professor_id:
        filter_conditions.append(
            ReviewModel.professor_id == params.professor_id)

    # Apply rating filters if provided
    if params.min_rating is not None:
        filter_conditions.append(ReviewModel.rating >= params.min_rating)
    if params.max_rating is not None:
        filter_conditions.append(ReviewModel.rating <= params.max_rating)

    # Add search conditions
    search_conditions = []
    for token in query_tokens:
        search_conditions.append(ReviewModel.content.ilike(f"%{token}%"))

    # Combine search and filter conditions
    if search_conditions:
        filter_conditions.append(or_(*search_conditions))

    if filter_conditions:
        query = query.where(and_(*filter_conditions))

    # Apply sorting
    if params.sort_by == SortField.RATING:
        order_func = asc if params.sort_order == SortOrder.ASC else desc
        query = query.order_by(order_func(ReviewModel.rating))
    elif params.sort_by == SortField.CREATED_AT:
        order_func = asc if params.sort_order == SortOrder.ASC else desc
        query = query.order_by(order_func(ReviewModel.created_at))
    elif params.sort_by == SortField.UPDATED_AT:
        order_func = asc if params.sort_order == SortOrder.ASC else desc
        query = query.order_by(order_func(ReviewModel.updated_at))

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total_count = count_result.scalar() or 0

    # Apply pagination if not RELEVANCE sorting
    if params.sort_by == SortField.RELEVANCE:
        # For relevance sorting, retrieve all results and sort them by score
        pass
    else:
        query = query.offset(params.skip).limit(params.limit)

    # Execute query
    result = await db.execute(query)
    rows = result.all()

    # Calculate relevance scores and prepare results
    results = []
    for review, user in rows:
        # Calculate score for content
        score = calculate_relevance_score(query_tokens, review.content, 1.0)

        # Create review with user
        from app.schemas.review import ReviewWithUser
        from app.schemas.user import User

        # Convert SQLAlchemy models to Pydantic schemas
        user_schema = User.model_validate(user)

        # Create review dict from SQLAlchemy object
        review_dict = {
            column.name: getattr(review, column.name)
            for column in review.__table__.columns
        }
        
        review_with_user = ReviewWithUser(
            **review_dict,
            user=user_schema
        )

        # Add to results
        results.append(ReviewSearchResult(
            entity_type=EntityType.REVIEW,
            relevance_score=score,
            data=review_with_user
        ))

    # Sort by relevance if requested
    if params.sort_by == SortField.RELEVANCE:
        order_multiplier = 1 if params.sort_order == SortOrder.ASC else -1
        results.sort(key=lambda x: x.relevance_score * order_multiplier)

        # Apply pagination after sorting
        results = results[params.skip:params.skip + params.limit]

    return results, total_count


async def search_replies(
    db: AsyncSession,
    query_tokens: List[str],
    params: SearchParams
) -> tuple[List[ReplySearchResult], int]:
    """
    Search replies based on query (deep search only).
    """
    # Join with users to get user data
    query = (
        select(
            ReplyModel,
            UserModel
        )
        .join(UserModel, ReplyModel.user_id == UserModel.id)
    )

    # Build filter conditions
    filter_conditions = []

    # Add search conditions
    search_conditions = []
    for token in query_tokens:
        search_conditions.append(ReplyModel.content.ilike(f"%{token}%"))

    # Combine search and filter conditions
    if search_conditions:
        filter_conditions.append(or_(*search_conditions))

    if filter_conditions:
        query = query.where(and_(*filter_conditions))

    # Apply sorting
    if params.sort_by == SortField.CREATED_AT:
        order_func = asc if params.sort_order == SortOrder.ASC else desc
        query = query.order_by(order_func(ReplyModel.created_at))
    elif params.sort_by == SortField.UPDATED_AT:
        order_func = asc if params.sort_order == SortOrder.ASC else desc
        query = query.order_by(order_func(ReplyModel.updated_at))

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total_count = count_result.scalar() or 0

    # Apply pagination if not RELEVANCE sorting
    if params.sort_by == SortField.RELEVANCE:
        # For relevance sorting, retrieve all results and sort them by score
        pass
    else:
        query = query.offset(params.skip).limit(params.limit)

    # Execute query
    result = await db.execute(query)
    rows = result.all()

    # Calculate relevance scores and prepare results
    results = []
    for reply, user in rows:
        # Calculate score for content
        score = calculate_relevance_score(query_tokens, reply.content, 1.0)

        # Create reply with user
        from app.schemas.reply import ReplyWithUser
        from app.schemas.user import User

        # Convert SQLAlchemy models to Pydantic schemas
        user_schema = User.model_validate(user)

        # Create reply dict from SQLAlchemy object
        reply_dict = {
            column.name: getattr(reply, column.name)
            for column in reply.__table__.columns
        }
        
        reply_with_user = ReplyWithUser(
            **reply_dict,
            user=user_schema
        )

        # Add to results
        results.append(ReplySearchResult(
            entity_type=EntityType.REPLY,
            relevance_score=score,
            data=reply_with_user
        ))

    # Sort by relevance if requested
    if params.sort_by == SortField.RELEVANCE:
        order_multiplier = 1 if params.sort_order == SortOrder.ASC else -1
        results.sort(key=lambda x: x.relevance_score * order_multiplier)

        # Apply pagination after sorting
        results = results[params.skip:params.skip + params.limit]

    return results, total_count
