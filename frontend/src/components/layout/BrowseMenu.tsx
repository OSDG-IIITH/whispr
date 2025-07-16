"use client";

import { motion } from "framer-motion";
import { X, BookOpen, Users, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface BrowseMenuProps {
    onClose: () => void;
}

export function BrowseMenu({ onClose }: BrowseMenuProps) {
    const router = useRouter();

    const handleBrowseCourses = () => {
        onClose();
        router.push("/courses");
    };

    const handleBrowseProfessors = () => {
        onClose();
        router.push("/professors");
    };

    const handleBrowseUsers = () => {
        onClose();
        router.push("/profiles");
    };

    return (
        <div className="bg-card/90 backdrop-blur-xl border border-primary/20 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold">Browse</h3>
                <button
                    onClick={onClose}
                    className="text-secondary hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Menu Items */}
            <div className="p-2">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBrowseCourses}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors"
                >
                    <BookOpen className="w-5 h-5 text-secondary" />
                    <span>Browse Courses</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBrowseProfessors}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors"
                >
                    <Users className="w-5 h-5 text-secondary" />
                    <span>Browse Professors</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBrowseUsers}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors"
                >
                    <User className="w-5 h-5 text-secondary" />
                    <span>Browse Profiles</span>
                </motion.button>
            </div>
        </div>
    );
}
