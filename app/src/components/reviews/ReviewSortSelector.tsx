"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface SortOption {
    value: string;
    label: string;
    description?: string;
}

interface ReviewSortSelectorProps {
    sortBy: string;
    onSortChange: (sortBy: string) => void;
    className?: string;
}

const sortOptions: SortOption[] = [
    {
        value: "date_new",
        label: "Newest First",
    },
    {
        value: "date_old",
        label: "Oldest First",
    },
    {
        value: "votes_high",
        label: "Most Votes",
    },
    {
        value: "votes_low",
        label: "Least Votes",
    },
    {
        value: "controversial",
        label: "Most Controversial",
    },
    {
        value: "rating_high",
        label: "Highest Rating",
    },
    {
        value: "rating_low",
        label: "Lowest Rating",
    }
];

export function ReviewSortSelector({
    sortBy,
    onSortChange,
    className = ""
}: ReviewSortSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const currentOption = sortOptions.find(option => option.value === sortBy) || sortOptions[0];

    const handleOptionSelect = (option: SortOption) => {
        onSortChange(option.value);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors text-sm min-w-[150px] justify-between"
            >
                <div className="flex flex-col items-start">
                    <span className="text-xs text-secondary">Sort by</span>
                    <span className="text-foreground">{currentOption.label}</span>
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-secondary transition-transform ${isOpen ? "transform rotate-180" : ""
                        }`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden"
                        >
                            <div className="p-2">
                                {sortOptions.map((option, index) => (
                                    <motion.button
                                        key={option.value}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        onClick={() => handleOptionSelect(option)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex flex-col ${option.value === sortBy
                                                ? "bg-primary/10 text-primary"
                                                : "hover:bg-muted text-foreground"
                                            }`}
                                    >
                                        <span className="font-medium">{option.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
