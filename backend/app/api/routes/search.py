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


def calculate_relevance_score(query_tokens: List[str], text: str) -> float:
    """
    Calculate a simple relevance score as a percentage (0-100) based on token matches.
    
    Simple algorithm:
    - Each matching token adds points
    - Exact phrase match gets bonus
    - Score is normalized to 0-100 range
    """
    if not text or not query_tokens:
        return 0.0

    text_lower = text.lower()
    query_lower = " ".join(query_tokens).lower()
    
    # Check for exact phrase match (gets 100%)
    if query_lower in text_lower:
        return 100.0
    
    # Count matching tokens
    matching_tokens = 0
    for token in query_tokens:
        if token in text_lower:
            matching_tokens += 1
    
    if matching_tokens == 0:
        return 0.0
    
    # Simple percentage based on how many tokens matched
    match_percentage = (matching_tokens / len(query_tokens)) * 100
    
    # Cap at 95% for partial matches (reserve 100% for exact phrase)
    return min(95.0, match_percentage)


def combine_relevance_scores(scores: Dict[str, float]) -> float:
    """
    Combine relevance scores from multiple fields using simple weighted average.
    Returns a score between 1 and 100.
    """
    if not scores:
        return 1.0
    
    # Simple field weights
    field_weights = {
        "name": 2.0,
        "code": 2.0,  
        "title": 1.5,
        "course_name": 1.5,
        "course_code": 1.5,
        "professor_name": 1.5,
        "description": 1.0,
        "content": 1.0,
        "lab": 1.0,
        "summary": 1.0,
        "semester": 1.0,
        "course_description": 1.0,
        "professor_lab": 1.0,
    }
    
    # Calculate simple weighted average
    total_score = 0.0
    total_weight = 0.0
    
    for field, score in scores.items():
        if score > 0:  # Only count fields with matches
            weight = field_weights.get(field, 1.0)
            total_score += score * weight
            total_weight += weight
    
    if total_weight == 0:
        return 1.0
    
    # Simple average
    final_score = total_score / total_weight
    
    # Ensure between 1 and 100
    return max(1.0, min(100.0, round(final_score, 1)))


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
    all_results = []

    # Search courses
    if EntityType.COURSE in entity_types:
        course_results, _ = await search_courses(
            db, query_tokens, params
        )
        all_results.extend(course_results)

    # Search professors
    if EntityType.PROFESSOR in entity_types:
        professor_results, _ = await search_professors(
            db, query_tokens, params
        )
        all_results.extend(professor_results)

    # Search course instructors
    if EntityType.COURSE_INSTRUCTOR in entity_types:
        course_instructor_results, _ = await \
            search_course_instructors(db, query_tokens, params)
        all_results.extend(course_instructor_results)

    # Search reviews (only in deep search)
    if params.deep and EntityType.REVIEW in entity_types:
        review_results, _ = await search_reviews(
            db, query_tokens, params
        )
        all_results.extend(review_results)

    # Search replies (only in deep search)
    if params.deep and EntityType.REPLY in entity_types:
        reply_results, _ = await search_replies(
            db, query_tokens, params
        )
        all_results.extend(reply_results)

    # Sort combined results by relevance
    if params.sort_by == SortField.RELEVANCE:
        order_multiplier = 1 if params.sort_order == SortOrder.ASC else -1
        all_results.sort(key=lambda x: x.relevance_score * order_multiplier)
    else:
        # For other sorting, sort by created_at as fallback
        all_results.sort(key=lambda x: getattr(x.data, 'created_at', None) or '', 
                        reverse=(params.sort_order == SortOrder.DESC))

    # Get total count
    total_count = len(all_results)

    # Apply pagination to final sorted list
    paginated_results = all_results[params.skip:params.skip + params.limit]

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
    sql_query = select(CourseModel).where(or_(*like_expressions))

    # Execute query - get all results for relevance sorting
    result = await db.execute(sql_query)
    courses = result.scalars().all()

    # Calculate relevance scores
    results = []
    for course in courses:
        # Calculate scores for each field
        scores = {
            "name": calculate_relevance_score(
                query_tokens, getattr(course, "name", "")
            ),
            "code": calculate_relevance_score(
                query_tokens, getattr(course, "code", ""))
        }

        if params.deep and getattr(course, "description", None):
            scores["description"] = calculate_relevance_score(
                query_tokens, getattr(course, "description", "")
            )

        # Combine scores
        relevance_score = combine_relevance_scores(scores)

        # Add to results
        results.append(CourseSearchResult(
            entity_type=EntityType.COURSE,
            relevance_score=relevance_score,
            data=course
        ))

    return results, len(results)


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
    sql_query = select(ProfessorModel).where(or_(*like_expressions))

    # Execute query - get all results for relevance sorting
    result = await db.execute(sql_query)
    professors = result.scalars().all()

    # Calculate relevance scores
    results = []
    for professor in professors:
        # Calculate scores for each field
        scores = {
            "name": calculate_relevance_score(query_tokens, getattr(
                professor, "name", "")
            )
        }

        if params.deep:
            lab = getattr(professor, "lab", None)
            summary = getattr(professor, "review_summary", None)
            if lab is not None:
                scores["lab"] = calculate_relevance_score(
                    query_tokens, lab)
            if summary is not None:
                scores["summary"] = calculate_relevance_score(
                    query_tokens, summary)

        # Combine scores
        relevance_score = combine_relevance_scores(scores)

        # Add to results
        results.append(ProfessorSearchResult(
            entity_type=EntityType.PROFESSOR,
            relevance_score=relevance_score,
            data=professor
        ))

    return results, len(results)


async def search_course_instructors(
    db: AsyncSession,
    query_tokens: List[str],
    params: SearchParams
) -> tuple[List[CourseInstructorSearchResult], int]:
    """
    Search course instructors based on query.
    """
    # We need to join with courses and professors to search in their fields
    sql_query = (
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
        sql_query = sql_query.where(and_(*filter_conditions))

    # Execute query - get all results for relevance sorting
    result = await db.execute(sql_query)
    rows = result.all()

    # Calculate relevance scores and prepare results
    results = []
    for course_instructor, course, professor in rows:
        # Calculate scores for each field
        scores = {
            "course_name": calculate_relevance_score(
                query_tokens, course.name
            ),
            "course_code": calculate_relevance_score(
                query_tokens, course.code
            ),
            "professor_name": calculate_relevance_score(
                query_tokens, professor.name
            ),
            "semester": calculate_relevance_score(
                query_tokens, course_instructor.semester
            )
        }

        if params.deep:
            if course.description:
                scores["course_description"] = calculate_relevance_score(
                    query_tokens, course.description
                )
            if professor.lab:
                scores["professor_lab"] = calculate_relevance_score(
                    query_tokens, professor.lab
                )
            if course_instructor.summary:
                scores["summary"] = calculate_relevance_score(
                    query_tokens, course_instructor.summary
                )

        # Combine scores
        relevance_score = combine_relevance_scores(scores)

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

    return results, len(results)


async def search_reviews(
    db: AsyncSession,
    query_tokens: List[str],
    params: SearchParams
) -> tuple[List[ReviewSearchResult], int]:
    """
    Search reviews based on query (deep search only).
    """
    # Join with users to get user data
    sql_query = (
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
        sql_query = sql_query.where(and_(*filter_conditions))

    # Execute query - get all results for relevance sorting
    result = await db.execute(sql_query)
    rows = result.all()

    # Calculate relevance scores and prepare results
    results = []
    for review, user in rows:
        # Calculate score for content
        score = calculate_relevance_score(query_tokens, review.content)

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

    return results, len(results)


async def search_replies(
    db: AsyncSession,
    query_tokens: List[str],
    params: SearchParams
) -> tuple[List[ReplySearchResult], int]:
    """
    Search replies based on query (deep search only).
    """
    # Join with users to get user data
    sql_query = (
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
        sql_query = sql_query.where(and_(*filter_conditions))

    # Execute query - get all results for relevance sorting
    result = await db.execute(sql_query)
    rows = result.all()

    # Calculate relevance scores and prepare results
    results = []
    for reply, user in rows:
        # Calculate score for content
        score = calculate_relevance_score(query_tokens, reply.content)

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

    return results, len(results)
