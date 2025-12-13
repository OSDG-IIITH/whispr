"use client";

import { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { useDebouncedCallback } from "@/hooks/useDebounce";

interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Reusable search input with debouncing and search icon
 * Prevents excessive re-renders by debouncing the onChange callback
 */
export function SearchInput({
  value: externalValue,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
  className = "",
  autoFocus = false,
}: SearchInputProps) {
  // Internal state for immediate UI feedback
  const [internalValue, setInternalValue] = useState(externalValue || "");
  
  // Debounced callback for external state updates
  const debouncedOnChange = useDebouncedCallback(onChange, debounceMs);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    debouncedOnChange(newValue);
  }, [debouncedOnChange]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
      <input
        type="text"
        placeholder={placeholder}
        value={internalValue}
        onChange={handleChange}
        autoFocus={autoFocus}
        className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm sm:text-base"
      />
    </div>
  );
}
