"use client";

import { RiskProfile, StakeMode } from "@/types";
import { DollarSign, Target, Zap, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import RiskProfileSelector from "./risk-profile-selector";

interface Props {
  config: {
    totalInvestment: number;
    betCount: number;
    riskProfile: RiskProfile;
    stakeMode: StakeMode;
  };
  onUpdate: (partial: Partial<Props["config"]>) => void;
  onSetRiskProfile: (profile: RiskProfile) => void;
}

export default function BetConfigurator({ config, onUpdate, onSetRiskProfile }: Props) {
  return (
    <div className="space-y-6">
      {/* Investment */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          <DollarSign className="w-3.5 h-3.5 text-accent" />
          Valor a Investir
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium text-sm">
            R$
          </span>
          <input
            type="number"
            min={10}
            step={10}
            value={config.totalInvestment}
            onChange={(e) =>
              onUpdate({ totalInvestment: Math.max(10, Number(e.target.value)) })
            }
            className="w-full pl-12 pr-4 py-3 bg-bg-elevated border border-border rounded-xl text-text-primary text-lg font-bold focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>
        {/* Quick amounts */}
        <div className="flex gap-2 mt-2">
          {[100, 250, 500, 1000].map((v) => (
            <button
              key={v}
              onClick={() => onUpdate({ totalInvestment: v })}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                config.totalInvestment === v
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "bg-bg-elevated text-text-muted hover:text-text-secondary border border-transparent"
              )}
            >
              R${v}
            </button>
          ))}
        </div>
      </div>

      {/* Bet count */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          <Target className="w-3.5 h-3.5 text-accent" />
          Número de Apostas
        </label>
        <div className="flex gap-2">
          {[2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onUpdate({ betCount: n })}
              className={cn(
                "flex-1 py-3 rounded-xl border font-bold text-sm transition-all duration-200",
                config.betCount === n
                  ? "border-accent/40 bg-accent/10 text-accent ring-1 ring-accent/20"
                  : "border-border bg-bg-card text-text-secondary hover:bg-bg-card-hover hover:border-border-hover"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Risk profile */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          Perfil de Risco
        </label>
        <RiskProfileSelector selected={config.riskProfile} onSelect={onSetRiskProfile} />
      </div>

      {/* Stake mode */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          Modo de Stake
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "automatico" as StakeMode, label: "Automático", icon: <Zap className="w-4 h-4" />, desc: "Motor calcula" },
            { value: "manual" as StakeMode, label: "Manual", icon: <Settings2 className="w-4 h-4" />, desc: "Você define" },
          ].map((m) => (
            <button
              key={m.value}
              onClick={() => onUpdate({ stakeMode: m.value })}
              className={cn(
                "p-3 rounded-xl border flex items-center gap-3 transition-all duration-200 text-left",
                config.stakeMode === m.value
                  ? "border-accent/40 bg-accent/10 ring-1 ring-accent/20"
                  : "border-border bg-bg-card hover:bg-bg-card-hover hover:border-border-hover"
              )}
            >
              <div className={cn(
                config.stakeMode === m.value ? "text-accent" : "text-text-muted"
              )}>
                {m.icon}
              </div>
              <div>
                <div className={cn(
                  "text-sm font-semibold",
                  config.stakeMode === m.value ? "text-accent" : "text-text-primary"
                )}>
                  {m.label}
                </div>
                <div className="text-[10px] text-text-muted">{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
