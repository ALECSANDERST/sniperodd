"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

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
        ? "text-accent"
        : percent >= 50
          ? "text-warning"
          : "text-danger";

  const glowColor =
    percent >= 85
      ? "drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]"
      : percent >= 70
        ? "drop-shadow-[0_0_6px_rgba(228,186,96,0.3)]"
        : percent >= 50
          ? "drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]"
          : "drop-shadow-[0_0_6px_rgba(248,113,113,0.3)]";

  const sizeClasses = {
    sm: "w-9 h-9 text-[10px]",
    md: "w-12 h-12 text-xs",
    lg: "w-16 h-16 text-sm",
  };

  const strokeWidth = size === "sm" ? 2.5 : size === "md" ? 2 : 1.8;
  const radius = size === "sm" ? 14 : size === "md" ? 20 : 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const viewBox = size === "sm" ? 34 : size === "md" ? 46 : 58;
  const center = viewBox / 2;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={cn("relative flex items-center justify-center", sizeClasses[size], glowColor)}>
        <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${viewBox} ${viewBox}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--color-bg-elevated)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
            className={cn("transition-colors", color)}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        <span className={cn("font-extrabold relative z-10 tabular-nums", color)}>{score}</span>
      </div>
      {showLabel && (
        <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
          {percent >= 85 ? "Excelente" : percent >= 70 ? "Boa" : percent >= 50 ? "Regular" : "Fraca"}
        </span>
      )}
    </div>
  );
}
