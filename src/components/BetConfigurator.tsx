"use client";

import { RiskProfile, StakeMode, RISK_PROFILE_CONFIG } from "@/types";
import {
  DollarSign,
  Target,
  Shield,
  Flame,
  Scale,
  Settings2,
  Zap,
  Skull,
  Rocket,
  AlertTriangle,
} from "lucide-react";

interface Props {
  config: {
    totalInvestment: number;
    betCount: number;
    minOdd: number;
    maxOdd: number;
    riskProfile: RiskProfile;
    stakeMode: StakeMode;
  };
  onChange: (config: Props["config"]) => void;
}

export default function BetConfigurator({ config, onChange }: Props) {
  const update = (partial: Partial<typeof config>) => {
    onChange({ ...config, ...partial });
  };

  const profileConfig = RISK_PROFILE_CONFIG[config.riskProfile];

  const riskProfiles: {
    value: RiskProfile;
    label: string;
    icon: React.ReactNode;
    color: string;
    bgActive: string;
  }[] = [
    { value: "conservador", label: "Conservador", icon: <Shield className="w-4 h-4" />, color: "text-green-400", bgActive: "border-green-500 bg-green-500/10" },
    { value: "moderado", label: "Moderado", icon: <Scale className="w-4 h-4" />, color: "text-blue-400", bgActive: "border-blue-500 bg-blue-500/10" },
    { value: "agressivo", label: "Agressivo", icon: <Flame className="w-4 h-4" />, color: "text-orange-400", bgActive: "border-orange-500 bg-orange-500/10" },
    { value: "muito_agressivo", label: "Muito Agressivo", icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-400", bgActive: "border-red-500 bg-red-500/10" },
    { value: "ultra_agressivo", label: "Ultra", icon: <Rocket className="w-4 h-4" />, color: "text-purple-400", bgActive: "border-purple-500 bg-purple-500/10" },
    { value: "extremo", label: "Extremo", icon: <Skull className="w-4 h-4" />, color: "text-pink-400", bgActive: "border-pink-500 bg-pink-500/10" },
  ];

  const stakeModes: { value: StakeMode; label: string; icon: React.ReactNode }[] = [
    { value: "automatico", label: "Automático", icon: <Zap className="w-4 h-4" /> },
    { value: "manual", label: "Manual", icon: <Settings2 className="w-4 h-4" /> },
  ];

  const currentProfile = riskProfiles.find((p) => p.value === config.riskProfile);

  return (
    <div className="space-y-5">
      {/* Valor total */}
      <div>
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-accent" />
          Valor Total a Investir
        </label>
        <div className="mt-1.5 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium text-sm">R$</span>
          <input
            type="number"
            min={10}
            step={10}
            value={config.totalInvestment}
            onChange={(e) => update({ totalInvestment: Math.max(10, Number(e.target.value)) })}
            className="w-full pl-12 pr-4 py-2.5 bg-bg-card border border-border rounded-xl text-text-primary text-lg font-semibold focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Quantidade de apostas */}
      <div>
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-accent" />
          Apostas: {config.betCount}
        </label>
        <div className="mt-1.5 flex gap-2">
          {[2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => update({ betCount: n })}
              className={`flex-1 py-2.5 rounded-xl border font-semibold text-sm transition-all ${
                config.betCount === n
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-bg-card text-text-secondary hover:bg-bg-card-hover"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Perfil de risco — 6 opções */}
      <div>
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Perfil de Risco
        </label>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {riskProfiles.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                const profileCfg = RISK_PROFILE_CONFIG[p.value];
                update({
                  riskProfile: p.value,
                  minOdd: profileCfg.oddMin,
                  maxOdd: profileCfg.oddMax,
                });
              }}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                config.riskProfile === p.value ? p.bgActive : "border-border bg-bg-card hover:bg-bg-card-hover"
              }`}
            >
              <div className={`flex justify-center mb-1 ${config.riskProfile === p.value ? p.color : "text-text-muted"}`}>
                {p.icon}
              </div>
              <div className={`text-xs font-semibold ${config.riskProfile === p.value ? p.color : "text-text-primary"}`}>
                {p.label}
              </div>
            </button>
          ))}
        </div>
        {/* Info do perfil selecionado */}
        <div className={`mt-2 p-3 rounded-lg bg-bg-secondary border border-border text-xs`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`font-semibold ${currentProfile?.color}`}>{profileConfig.label}</span>
            <span className="text-text-muted">Máx {profileConfig.maxSelections} seleções</span>
          </div>
          <div className="text-text-muted">{profileConfig.description}</div>
          <div className="text-text-muted mt-1">
            Faixa de odds: <span className="text-text-primary font-medium">{profileConfig.oddMin}x</span> a <span className="text-text-primary font-medium">{profileConfig.oddMax}x</span>
          </div>
        </div>
      </div>

      {/* Modo de stake */}
      <div>
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Modo de Stake
        </label>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {stakeModes.map((m) => (
            <button
              key={m.value}
              onClick={() => update({ stakeMode: m.value })}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all text-sm ${
                config.stakeMode === m.value
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-bg-card text-text-secondary hover:bg-bg-card-hover"
              }`}
            >
              {m.icon}
              <span className="font-semibold">{m.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
