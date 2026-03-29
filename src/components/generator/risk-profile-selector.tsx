"use client";

import { motion, AnimatePresence } from "motion/react";
import { RiskProfile, RISK_PROFILE_CONFIG } from "@/types";
import { cn } from "@/lib/utils";
import {
  Shield,
  Scale,
  Flame,
  AlertTriangle,
  Rocket,
  Skull,
} from "lucide-react";

const profiles: {
  value: RiskProfile;
  icon: React.ReactNode;
  color: string;
  activeRing: string;
  activeBg: string;
  glowColor: string;
}[] = [
  {
    value: "conservador",
    icon: <Shield className="w-4 h-4" />,
    color: "text-risk-low",
    activeRing: "ring-risk-low/30",
    activeBg: "bg-risk-low/5 border-risk-low/25",
    glowColor: "rgba(52,211,153,0.12)",
  },
  {
    value: "moderado",
    icon: <Scale className="w-4 h-4" />,
    color: "text-info",
    activeRing: "ring-info/30",
    activeBg: "bg-info/5 border-info/25",
    glowColor: "rgba(96,165,250,0.12)",
  },
  {
    value: "agressivo",
    icon: <Flame className="w-4 h-4" />,
    color: "text-warning",
    activeRing: "ring-warning/30",
    activeBg: "bg-warning/5 border-warning/25",
    glowColor: "rgba(251,191,36,0.12)",
  },
  {
    value: "muito_agressivo",
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-danger",
    activeRing: "ring-danger/30",
    activeBg: "bg-danger/5 border-danger/25",
    glowColor: "rgba(248,113,113,0.12)",
  },
  {
    value: "ultra_agressivo",
    icon: <Rocket className="w-4 h-4" />,
    color: "text-purple-400",
    activeRing: "ring-purple-400/30",
    activeBg: "bg-purple-400/5 border-purple-400/25",
    glowColor: "rgba(167,139,250,0.12)",
  },
  {
    value: "extremo",
    icon: <Skull className="w-4 h-4" />,
    color: "text-risk-extreme",
    activeRing: "ring-risk-extreme/30",
    activeBg: "bg-risk-extreme/5 border-risk-extreme/25",
    glowColor: "rgba(244,114,182,0.12)",
  },
];

interface Props {
  selected: RiskProfile;
  onSelect: (profile: RiskProfile) => void;
}

export default function RiskProfileSelector({ selected, onSelect }: Props) {
  const selectedProfile = profiles.find((p) => p.value === selected);
  const selectedConfig = RISK_PROFILE_CONFIG[selected];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {profiles.map((p) => {
          const isActive = selected === p.value;
          const cfg = RISK_PROFILE_CONFIG[p.value];
          return (
            <motion.button
              key={p.value}
              onClick={() => onSelect(p.value)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={cn(
                "relative p-3 rounded-xl border text-center transition-colors duration-200",
                isActive
                  ? cn(p.activeBg, "ring-1", p.activeRing)
                  : "border-border bg-bg-card hover:bg-bg-card-hover hover:border-border-hover"
              )}
              style={isActive ? { boxShadow: `0 0 24px -4px ${p.glowColor}` } : undefined}
            >
              <div
                className={cn(
                  "flex justify-center mb-1.5 transition-colors",
                  isActive ? p.color : "text-text-muted"
                )}
              >
                {p.icon}
              </div>
              <div
                className={cn(
                  "text-[11px] font-bold",
                  isActive ? p.color : "text-text-primary"
                )}
              >
                {cfg.label}
              </div>
              <div className="text-[9px] text-text-muted mt-0.5 tabular-nums">
                {cfg.oddMin}x – {cfg.oddMax}x
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="p-3.5 rounded-xl bg-bg-elevated border border-border"
        >
          <div className="flex items-center justify-between mb-1">
            <span className={cn("text-sm font-bold", selectedProfile?.color)}>
              {selectedConfig.label}
            </span>
            <span className="text-[10px] text-text-muted font-medium tabular-nums">
              Máx {selectedConfig.maxSelections} seleções
            </span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">{selectedConfig.description}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
