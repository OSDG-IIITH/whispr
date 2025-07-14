"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, X } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
    message: string;
    type: "success" | "error";
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

export function Toast({
    message,
    type,
    isVisible,
    onClose,
    duration = 3000
}: ToastProps) {
    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    const icon = type === "success" ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
        <XCircle className="w-5 h-5 text-red-500" />
    );

    const bgColor = type === "success"
        ? "bg-green-500/10 border-green-500/20"
        : "bg-red-500/10 border-red-500/20";

    const textColor = type === "success"
        ? "text-green-400"
        : "text-red-400";

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                    className={`fixed top-6 right-6 z-50 ${bgColor} border rounded-xl p-4 shadow-2xl max-w-sm`}
                >
                    <div className="flex items-center gap-3">
                        {icon}
                        <p className={`flex-1 text-sm font-medium ${textColor}`}>
                            {message}
                        </p>
                        <button
                            onClick={onClose}
                            className="text-secondary hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
} 