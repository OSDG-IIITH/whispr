import Link from "next/link";
import { GraduationCap, Users } from "lucide-react";
import { Professor } from "@/types/backend-models";
import { StarRating } from "@/components/ui/StarRating";

interface ProfessorCardProps {
  professor: Professor;
  className?: string;
}

/**
 * Professor card component for list displays
 * Extracts and unifies the professor card rendering logic
 */
export function ProfessorCard({ professor, className = "" }: ProfessorCardProps) {
  // Get courses taught by professor from course instructors
  const getCourses = (): string[] => {
    if (!professor.course_instructors || professor.course_instructors.length === 0) {
      return [];
    }

    const courses = new Map<string, string>();
    professor.course_instructors.forEach((instructor) => {
      if (instructor.course) {
        courses.set(instructor.course.id, instructor.course.code);
      }
    });

    return Array.from(courses.values());
  };

  const courses = getCourses();
  const rating = parseFloat(professor.average_rating) || 0;

  return (
    <Link href={`/professors/${professor.id}`}>
      <div
        className={`bg-card border border-border rounded-xl p-4 sm:p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-base sm:text-lg mb-1">
              {professor.name}
            </h3>
            {professor.lab && (
              <p className="text-primary text-xs sm:text-sm">{professor.lab}</p>
            )}
          </div>
          <GraduationCap className="w-6 h-6 text-secondary" />
        </div>

        {/* Review Summary */}
        {professor.review_summary && (
          <div className="mb-4">
            <h4 className="text-xs sm:text-sm font-medium mb-2">Summary</h4>
            <p className="text-secondary text-xs line-clamp-3">
              {professor.review_summary}
            </p>
          </div>
        )}

        {/* Courses */}
        {courses.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs sm:text-sm font-medium mb-2">Courses</h4>
            <div className="flex flex-wrap gap-1">
              {courses.slice(0, 3).map((course, i) => (
                <span
                  key={i}
                  className="bg-muted text-secondary text-xs px-2 py-1 rounded"
                >
                  {course}
                </span>
              ))}
              {courses.length > 3 && (
                <span className="text-xs text-secondary">
                  +{courses.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <StarRating rating={rating} showValue size="sm" />
          <div className="flex items-center gap-1 text-xs sm:text-sm text-secondary">
            <Users className="w-4 h-4" />
            <span>{professor.review_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
