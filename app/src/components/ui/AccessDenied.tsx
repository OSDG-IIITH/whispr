import { ReactNode } from "react";
import { Shield } from "lucide-react";

interface AccessDeniedProps {
  icon?: ReactNode;
  title?: string;
  message?: string;
}

/**
 * Access denied view for protected pages
 * Displayed when user lacks required permissions
 */
export function AccessDenied({
  icon,
  title = "Access Denied",
  message = "You don't have permission to access this page.",
}: AccessDeniedProps) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 text-red-500 mx-auto mb-4 flex items-center justify-center">
          {icon || <Shield className="w-16 h-16" />}
        </div>
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-secondary">{message}</p>
      </div>
    </div>
  );
}
