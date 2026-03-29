"use client";

import { cn } from "@/lib/utils";

interface ConfidenceScoreProps {
  score: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ConfidenceScore({
  score,
  max = 100,
  size = "md",
  showLabel = true,
}: ConfidenceScoreProps) {
  const percent = Math.round((score / max) * 100);
  const color =
    percent >= 85
      ? "text-risk-low"
      : percent >= 70
        ? "text-info"
        : percent >= 50
          ? "text-warning"
          : "text-danger";

  const bgColor =
    percent >= 85
      ? "bg-risk-low"
      : percent >= 70
        ? "bg-info"
        : percent >= 50
          ? "bg-warning"
          : "bg-danger";

  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-11 h-11 text-xs",
    lg: "w-14 h-14 text-sm",
  };

  const strokeWidth = size === "sm" ? 3 : size === "md" ? 2.5 : 2;
  const radius = size === "sm" ? 13 : size === "md" ? 18 : 23;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const viewBox = size === "sm" ? 30 : size === "md" ? 40 : 50;
  const center = viewBox / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
        <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${viewBox} ${viewBox}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--color-bg-elevated)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn("transition-all duration-700 ease-out", color)}
          />
        </svg>
        <span className={cn("font-bold relative z-10", color)}>{score}</span>
      </div>
      {showLabel && (
        <span className="text-[9px] font-medium text-text-muted uppercase tracking-wider">
          {percent >= 85 ? "Excelente" : percent >= 70 ? "Boa" : percent >= 50 ? "Regular" : "Fraca"}
        </span>
      )}
    </div>
  );
}
