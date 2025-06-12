import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "white";
  className?: string;
}

export function FlowForgeLogo({ size = "md", variant = "default", className = "" }: LogoProps) {
  const sizesMap = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
  };
  
  const heightClass = sizesMap[size];
  const logoColor = variant === "white" ? "#FFFFFF" : "#3B82F6";
  const accentColor = variant === "white" ? "#D1D5DB" : "#1E40AF";
  
  return (
    <div className={`${heightClass} ${className}`}>
      <svg
        viewBox="0 0 180 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
      >
        {/* Pipeline Flow Animation Effect */}
        <defs>
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.3">
              <animate
                attributeName="offset"
                values="-0.5;1.5"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor={accentColor} stopOpacity="0.6">
              <animate
                attributeName="offset"
                values="0;2"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.3">
              <animate
                attributeName="offset"
                values="0.5;2.5"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>
        
        {/* Main Logo Shape - Pipeline with Flow Concept */}
        
        {/* Vertical Bar */}
        <rect x="15" y="5" width="6" height="30" rx="2" fill={logoColor} />
        
        {/* Horizontal Pipes */}
        <rect x="21" y="10" width="30" height="4" rx="2" fill={logoColor} />
        <rect x="21" y="18" width="40" height="4" rx="2" fill={logoColor} />
        <rect x="21" y="26" width="20" height="4" rx="2" fill={logoColor} />
        
        {/* Connection Nodes */}
        <circle cx="15" cy="10" r="4" fill={accentColor} />
        <circle cx="15" cy="18" r="4" fill={accentColor} />
        <circle cx="15" cy="26" r="4" fill={accentColor} />
        
        {/* Flow Animation for Pipelines */}
        <rect x="21" y="10" width="30" height="4" rx="2" fill="url(#flowGradient)" opacity="0.7" />
        <rect x="21" y="18" width="40" height="4" rx="2" fill="url(#flowGradient)" opacity="0.7" />
        <rect x="21" y="26" width="20" height="4" rx="2" fill="url(#flowGradient)" opacity="0.7" />
        
        {/* Text */}
        <text x="75" y="24" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="20" fill={logoColor}>
          FlowForge
        </text>
      </svg>
    </div>
  );
}
