import React from "react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "scale-50",
    md: "scale-75",
    lg: "scale-100",
  };

  return (
    <div className={`whispr-loader ${sizeClasses[size]} ${className}`}></div>
  );
};

export default Loader;
