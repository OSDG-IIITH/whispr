"use client";

interface SortSelectorProps {
  options: string[];
  selected: string;
  onChange: (option: string) => void;
  label?: string;
  className?: string;
}

/**
 * Sort option selector with pill-style buttons
 * Used across list pages for sorting results
 */
export function SortSelector({
  options,
  selected,
  onChange,
  label = "Sort by:",
  className = "",
}: SortSelectorProps) {
  return (
    <div className={`flex items-center gap-2 sm:gap-4 ${className}`}>
      {label && (
        <span className="text-secondary text-sm sm:text-base">{label}</span>
      )}
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors capitalize ${
            selected === option
              ? "bg-primary text-black"
              : "bg-muted text-secondary hover:bg-primary/10 hover:text-primary"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
