"use client";

import { Badge } from "@/components/ui/badge";
import type { BetRiskLevel } from "@/types";
import { Shield, Info, AlertTriangle, Zap, Flame } from "lucide-react";

const riskConfig: Record<
  BetRiskLevel,
  { label: string; variant: "success" | "info" | "warning" | "danger" | "extreme"; icon: React.ReactNode }
> = {
  baixo: { label: "Baixo", variant: "success", icon: <Shield className="w-3 h-3" /> },
  medio: { label: "Médio", variant: "info", icon: <Info className="w-3 h-3" /> },
  alto: { label: "Alto", variant: "warning", icon: <AlertTriangle className="w-3 h-3" /> },
  muito_alto: { label: "Muito Alto", variant: "danger", icon: <Zap className="w-3 h-3" /> },
  extremo: { label: "Extremo", variant: "extreme", icon: <Flame className="w-3 h-3" /> },
};

export function RiskBadge({ level }: { level: BetRiskLevel }) {
  const config = riskConfig[level] || riskConfig.medio;
  return (
    <Badge variant={config.variant}>
      {config.icon}
      {config.label}
    </Badge>
  );
}
