interface ResultsCountProps {
  count: number;
  singular: string;
  plural?: string;
  className?: string;
}

/**
 * Results count display component
 * Shows "X items found" with proper pluralization
 */
export function ResultsCount({
  count,
  singular,
  plural,
  className = "",
}: ResultsCountProps) {
  const label = count === 1 ? singular : (plural || `${singular}s`);

  return (
    <div className={`text-secondary text-xs sm:text-base ${className}`}>
      {count} {label} found
    </div>
  );
}
