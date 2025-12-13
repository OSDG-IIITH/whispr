import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

const textSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

/**
 * Star rating display component
 * Shows filled/unfilled stars based on rating value
 */
export function StarRating({
  rating,
  maxStars = 5,
  size = "md",
  showValue = false,
  className = "",
}: StarRatingProps) {
  const starSize = sizeMap[size];
  const textSize = textSizeMap[size];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }, (_, i) => (
          <Star
            key={i}
            className={`${starSize} ${
              i < Math.floor(rating)
                ? "text-yellow-500 fill-current"
                : "text-secondary"
            }`}
          />
        ))}
      </div>
      {showValue && (
        <span className={`${textSize} font-medium ml-1`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
