"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Toast } from "@/components/common/Toast";

interface ToastContextType {
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

interface ToastProviderProps {
    children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error";
        isVisible: boolean;
    }>({
        message: "",
        type: "success",
        isVisible: false,
    });

    const showToast = (message: string, type: "success" | "error") => {
        setToast({
            message,
            type,
            isVisible: true,
        });
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, isVisible: false }));
    };

    const showSuccess = (message: string) => {
        showToast(message, "success");
    };

    const showError = (message: string) => {
        showToast(message, "error");
    };

    return (
        <ToastContext.Provider value={{ showSuccess, showError }}>
            {children}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />
        </ToastContext.Provider>
    );
} 