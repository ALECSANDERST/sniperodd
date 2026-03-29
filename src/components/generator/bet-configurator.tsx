"use client";

import { motion } from "motion/react";
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
        <label className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-2.5">
          <DollarSign className="w-3.5 h-3.5 text-accent" />
          Valor a Investir
        </label>
        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-semibold text-sm transition-colors group-focus-within:text-accent">
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
            className="w-full pl-12 pr-4 py-3 bg-bg-elevated border border-border rounded-xl text-text-primary text-lg font-extrabold tabular-nums focus:outline-none focus:border-accent/30 focus:ring-2 focus:ring-accent/10 focus:shadow-[0_0_16px_-4px_rgba(228,186,96,0.15)] transition-all duration-300"
          />
        </div>
        <div className="flex gap-2 mt-2">
          {[100, 250, 500, 1000].map((v) => (
            <motion.button
              key={v}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              onClick={() => onUpdate({ totalInvestment: v })}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[10px] font-bold tabular-nums transition-colors duration-200",
                config.totalInvestment === v
                  ? "bg-accent-muted text-accent border border-border-accent shadow-[0_0_12px_-3px_rgba(228,186,96,0.15)]"
                  : "bg-bg-elevated text-text-muted hover:text-text-secondary border border-transparent"
              )}
            >
              R${v}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Bet count */}
      <div>
        <label className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-2.5">
          <Target className="w-3.5 h-3.5 text-accent" />
          Número de Apostas
        </label>
        <div className="flex gap-2">
          {[2, 3, 4, 5].map((n) => (
            <motion.button
              key={n}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              onClick={() => onUpdate({ betCount: n })}
              className={cn(
                "flex-1 py-3 rounded-xl border font-extrabold text-sm transition-colors duration-200",
                config.betCount === n
                  ? "border-accent/30 bg-accent-muted text-accent ring-1 ring-accent/10 shadow-[0_0_16px_-4px_rgba(228,186,96,0.15)]"
                  : "border-border bg-bg-card text-text-secondary hover:bg-bg-card-hover hover:border-border-hover"
              )}
            >
              {n}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Risk profile */}
      <div>
        <label className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-2.5">
          Perfil de Risco
        </label>
        <RiskProfileSelector selected={config.riskProfile} onSelect={onSetRiskProfile} />
      </div>

      {/* Stake mode */}
      <div>
        <label className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] mb-2.5">
          Modo de Stake
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "automatico" as StakeMode, label: "Automático", icon: <Zap className="w-4 h-4" />, desc: "Motor calcula" },
            { value: "manual" as StakeMode, label: "Manual", icon: <Settings2 className="w-4 h-4" />, desc: "Você define" },
          ].map((m) => (
            <motion.button
              key={m.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              onClick={() => onUpdate({ stakeMode: m.value })}
              className={cn(
                "p-3 rounded-xl border flex items-center gap-3 transition-colors duration-200 text-left",
                config.stakeMode === m.value
                  ? "border-accent/30 bg-accent-muted ring-1 ring-accent/10 shadow-[0_0_16px_-4px_rgba(228,186,96,0.15)]"
                  : "border-border bg-bg-card hover:bg-bg-card-hover hover:border-border-hover"
              )}
            >
              <div className={cn(
                "transition-colors",
                config.stakeMode === m.value ? "text-accent" : "text-text-muted"
              )}>
                {m.icon}
              </div>
              <div>
                <div className={cn(
                  "text-sm font-bold transition-colors",
                  config.stakeMode === m.value ? "text-accent" : "text-text-primary"
                )}>
                  {m.label}
                </div>
                <div className="text-[10px] text-text-muted">{m.desc}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
