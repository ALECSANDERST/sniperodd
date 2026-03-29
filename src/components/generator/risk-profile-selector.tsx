"use client";

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
  activeClasses: string;
  gradient: string;
}[] = [
  {
    value: "conservador",
    icon: <Shield className="w-4.5 h-4.5" />,
    color: "text-risk-low",
    activeClasses: "border-risk-low/40 bg-risk-low/5 ring-1 ring-risk-low/20",
    gradient: "from-risk-low/20 to-transparent",
  },
  {
    value: "moderado",
    icon: <Scale className="w-4.5 h-4.5" />,
    color: "text-info",
    activeClasses: "border-info/40 bg-info/5 ring-1 ring-info/20",
    gradient: "from-info/20 to-transparent",
  },
  {
    value: "agressivo",
    icon: <Flame className="w-4.5 h-4.5" />,
    color: "text-warning",
    activeClasses: "border-warning/40 bg-warning/5 ring-1 ring-warning/20",
    gradient: "from-warning/20 to-transparent",
  },
  {
    value: "muito_agressivo",
    icon: <AlertTriangle className="w-4.5 h-4.5" />,
    color: "text-danger",
    activeClasses: "border-danger/40 bg-danger/5 ring-1 ring-danger/20",
    gradient: "from-danger/20 to-transparent",
  },
  {
    value: "ultra_agressivo",
    icon: <Rocket className="w-4.5 h-4.5" />,
    color: "text-purple-400",
    activeClasses: "border-purple-400/40 bg-purple-400/5 ring-1 ring-purple-400/20",
    gradient: "from-purple-400/20 to-transparent",
  },
  {
    value: "extremo",
    icon: <Skull className="w-4.5 h-4.5" />,
    color: "text-risk-extreme",
    activeClasses: "border-risk-extreme/40 bg-risk-extreme/5 ring-1 ring-risk-extreme/20",
    gradient: "from-risk-extreme/20 to-transparent",
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
            <button
              key={p.value}
              onClick={() => onSelect(p.value)}
              className={cn(
                "relative p-3 rounded-xl border text-center transition-all duration-200 overflow-hidden",
                isActive
                  ? p.activeClasses
                  : "border-border bg-bg-card hover:bg-bg-card-hover hover:border-border-hover"
              )}
            >
              {isActive && (
                <div className={cn("absolute inset-0 bg-gradient-to-b opacity-50", p.gradient)} />
              )}
              <div className="relative">
                <div
                  className={cn(
                    "flex justify-center mb-1.5",
                    isActive ? p.color : "text-text-muted"
                  )}
                >
                  {p.icon}
                </div>
                <div
                  className={cn(
                    "text-[11px] font-semibold",
                    isActive ? p.color : "text-text-primary"
                  )}
                >
                  {cfg.label}
                </div>
                <div className="text-[9px] text-text-muted mt-0.5">
                  {cfg.oddMin}x – {cfg.oddMax}x
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected profile detail */}
      <div
        className={cn(
          "p-3.5 rounded-xl bg-bg-elevated border border-border"
        )}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={cn("text-sm font-semibold", selectedProfile?.color)}>
            {selectedConfig.label}
          </span>
          <span className="text-[11px] text-text-muted">
            Máx {selectedConfig.maxSelections} seleções
          </span>
        </div>
        <p className="text-[11px] text-text-muted">{selectedConfig.description}</p>
      </div>
    </div>
  );
}
