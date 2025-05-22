"""
Search schemas for search functionality.
"""

from typing import List, Optional, Union
from uuid import UUID
from enum import Enum
from pydantic import BaseModel, Field

from app.schemas.course import Course
from app.schemas.professor import Professor
from app.schemas.review import ReviewWithUser
from app.schemas.reply import ReplyWithUser
from app.schemas.course_instructor import CourseInstructorDetail


class EntityType(str, Enum):
    """
    Type of entity for search filtering.
    """
    COURSE = "course"
    PROFESSOR = "professor"
    REVIEW = "review"
    REPLY = "reply"
    COURSE_INSTRUCTOR = "course_instructor"


class SortField(str, Enum):
    """
    Fields to sort search results by.
    """
    RELEVANCE = "relevance"
    NAME = "name"
    RATING = "rating"
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"
    CODE = "code"  # For courses


class SortOrder(str, Enum):
    """
    Sort order for search results.
    """
    ASC = "asc"
    DESC = "desc"


class SearchParams(BaseModel):
    """
    Parameters for search functionality.
    """
    query: str = Field(..., description="The search query string")
    deep: bool = Field(
        False, description="Whether to perform a deep search in content")

    # Filtering
    entity_types: Optional[List[EntityType]] = Field(
        None, description="Types of entities to include in search results"
    )
    course_id: Optional[UUID] = Field(None, description="Filter by course ID")
    professor_id: Optional[UUID] = Field(
        None, description="Filter by professor ID")
    min_rating: Optional[int] = Field(
        None, ge=1, le=5, description="Minimum rating")
    max_rating: Optional[int] = Field(
        None, ge=1, le=5, description="Maximum rating")

    # Sorting
    sort_by: Optional[SortField] = Field(
        SortField.RELEVANCE, description="Field to sort by")
    sort_order: Optional[SortOrder] = Field(
        SortOrder.DESC, description="Sort order")

    # Pagination
    skip: int = Field(0, ge=0, description="Number of results to skip")
    limit: int = Field(100, ge=1, le=100,
                       description="Maximum number of results to return")


class SearchResult(BaseModel):
    """
    Base class for search results.
    """
    entity_type: EntityType
    relevance_score: float = Field(
        ...,
        description="Relevance score for the search result"
    )


class CourseSearchResult(SearchResult):
    """
    Course search result.
    """
    entity_type: EntityType = EntityType.COURSE
    data: Course


class ProfessorSearchResult(SearchResult):
    """
    Professor search result.
    """
    entity_type: EntityType = EntityType.PROFESSOR
    data: Professor


class ReviewSearchResult(SearchResult):
    """
    Review search result.
    """
    entity_type: EntityType = EntityType.REVIEW
    data: ReviewWithUser


class ReplySearchResult(SearchResult):
    """
    Reply search result.
    """
    entity_type: EntityType = EntityType.REPLY
    data: ReplyWithUser


class CourseInstructorSearchResult(SearchResult):
    """
    CourseInstructor search result.
    """
    entity_type: EntityType = EntityType.COURSE_INSTRUCTOR
    data: CourseInstructorDetail


class SearchResponse(BaseModel):
    """
    Response model for search results.
    """
    total: int = Field(..., description="Total number of results")
    results: List[Union[
        CourseSearchResult,
        ProfessorSearchResult,
        ReviewSearchResult,
        ReplySearchResult,
        CourseInstructorSearchResult
    ]] = Field(..., description="Search results")
    query: str = Field(..., description="The original search query")
    deep: bool = Field(..., description="Whether a deep search was performed")
