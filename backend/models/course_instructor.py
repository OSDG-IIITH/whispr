"""
Model for course-instructor relationship.

This module defines the CourseInstructor model representing the relationship
between courses and instructors, including semester and year information.
"""
from typing import List, Optional
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from database.helpers import PyObjectId
from bson import ObjectId


class SemesterEnum(str, Enum):
    """
    Enum for academic semesters.
    """
    SPRING = "Spring"
    MONSOON = "Monsoon"


class Iteration(BaseModel):
    """
    Schema for course offering in a specific semester.

    Attributes:
        year: Academic year when the course was taught
        semester: Academic semester (Spring or Monsoon)
    """
    year: int
    semester: SemesterEnum


class CourseInstructor(BaseModel):
    """
    CourseInstructor model
    represents the relationship between courses and professors.

    Attributes:
        id: Unique identifier for the relationship
        course_id: Reference to the course
        instructor_id: Reference to the professor teaching the course
        iterations: List of semesters when course was taught by instructor
        created_at: Timestamp when the record was created
        updated_at: Timestamp when the record was last updated
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    course_id: PyObjectId
    instructor_id: PyObjectId
    iterations: List[Iteration] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        """Pydantic model configuration."""
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "_id": "60d5ec9af682fbd3d45323ab",
                "course_id": "60d5ec9af682fbd3d45323a7",
                "instructor_id": "60d5ec9af682fbd3d45323a8",
                "iterations": [
                    {
                        "year": 2023,
                        "semester": "Monsoon"
                    },
                    {
                        "year": 2024,
                        "semester": "Spring"
                    }
                ],
                "created_at": "2023-01-10T09:00:00.000Z",
                "updated_at": "2024-01-15T10:30:00.000Z"
            }
        }


class CourseInstructorCreate(BaseModel):
    """Schema for creating a new course-instructor relationship record."""
    course_id: str
    instructor_id: str
    iterations: List[Iteration] = []


class CourseInstructorUpdate(BaseModel):
    """Schema for updating a course-instructor relationship."""
    iterations: Optional[List[Iteration]] = None
