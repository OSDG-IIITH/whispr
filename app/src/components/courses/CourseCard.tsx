import Link from "next/link";
import { Users } from "lucide-react";
import { Course } from "@/types/backend-models";
import { StarRating } from "@/components/ui/StarRating";

interface CourseCardProps {
  course: Course;
  className?: string;
}

/**
 * Course card component for list displays
 * Extracts and unifies the course card rendering logic
 */
export function CourseCard({ course, className = "" }: CourseCardProps) {
  const rating = parseFloat(course.average_rating) || 0;

  return (
    <Link href={`/courses/${course.code}`}>
      <div
        className={`bg-card border border-border rounded-xl p-4 sm:p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full ${className}`}
      >
        {/* Course Code and Credits */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-primary">
              {course.code}
            </h3>
          </div>
          <div className="text-xs sm:text-sm text-secondary">
            {course.credits} credits
          </div>
        </div>

        {/* Course Name */}
        <h4 className="font-semibold mb-3 text-base sm:text-lg">{course.name}</h4>

        {/* Description */}
        <p className="text-secondary text-xs sm:text-sm mb-4 line-clamp-3">
          {course.description || "No description available"}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <StarRating rating={rating} showValue size="sm" />
          <div className="flex items-center gap-1 text-xs sm:text-sm text-secondary">
            <Users className="w-4 h-4" />
            <span>{course.review_count || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
